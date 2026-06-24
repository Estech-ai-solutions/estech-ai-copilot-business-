import { NextResponse } from 'next/server';
import { getTokenFromHeader, verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateAiResponse } from '@/lib/ai';

function getUserId(request: Request): number | null {
  const token = getTokenFromHeader(request);
  if (!token) return null;
  try {
    const payload = verifyToken(token);
    return payload.userId ? Number(payload.userId) : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const userId = getUserId(request);
  const body = await request.json();
  const { targetIndustry, targetLocation, idealCustomer } = body;

  if (!targetIndustry || !targetLocation) {
    return NextResponse.json({ error: 'targetIndustry and targetLocation are required' }, { status: 400 });
  }

  // Build search query
  const searchQueries = [
    `${targetIndustry} in ${targetLocation}`,
    `${targetIndustry} ${targetLocation} businesses`,
    `best ${targetIndustry} ${targetLocation}`,
    `${idealCustomer || ''} ${targetIndustry} ${targetLocation}`.trim()
  ];

  const tavilyApiKey = process.env.TAVILY_API_KEY;
  let searchResults: any[] = [];

  if (tavilyApiKey) {
    try {
      const responses = await Promise.all(
        searchQueries.map(query =>
          fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tavilyApiKey}`
            },
            body: JSON.stringify({ query, search_depth: 'basic', max_results: 5 })
          }).then(r => r.json()).then(d => d.results || [])
        )
      );
      searchResults = responses.flat().slice(0, 10);
    } catch (e) {
      console.error('Tavily search error:', e);
    }
  }

  // For development without Tavily API, use mock data
  if (searchResults.length === 0) {
    searchResults = Array.from({ length: 5 }, (_, i) => ({
      title: `${targetIndustry} Business ${i + 1}`,
      url: `https://${targetIndustry.toLowerCase().replace(/\s+/g, '')}${i + 1}.com`,
      snippet: `A ${targetIndustry.toLowerCase()} business located in ${targetLocation} that ${idealCustomer || 'needs our services'}`,
      content: `Business description for ${targetIndustry} ${i + 1} in ${targetLocation}.`
    }));
  }

  // Get business profile for context
  const profiles = await db.profiles();
  const profile = profiles.find((p: any) => p.user_id === (userId ?? 0));

  // Analyze each lead with AI
  const analyzedLeads = await Promise.all(
    searchResults.map(async (result) => {
      const businessName = result.title || 'Unknown Business';
      const website = result.url || '';

      const analysisPrompt = `Analyze this potential lead for a business:

Business: ${businessName}
Location: ${targetLocation}
Industry: ${targetIndustry}
Description: ${result.snippet || result.content || ''}

Our business:
${profile ? `Name: ${profile.name}
Description: ${profile.description}
Services: ${profile.services}
Pricing: ${profile.pricing_info}` : 'Not specified'}

Ideal customer: ${idealCustomer || 'Not specified'}

Analyze and provide:
1. Lead score (0-100) - how good a match
2. Reason - why this is a good lead
3. Opportunity - potential business opportunity
4. Suggested service - what service we should offer them

Respond in JSON format only:
{
  "lead_score": number,
  "reason": "string",
  "opportunity": "string",
  "suggested_service": "string"
}`;

      const aiResponse = await generateAiResponse(analysisPrompt);
      
      let analysis = { lead_score: 50, reason: 'Potential match', opportunity: '', suggested_service: '' };
      try {
        const parsed = JSON.parse(aiResponse.text);
        analysis = parsed;
      } catch {
        // Use default analysis
      }

      return {
        id: Date.now() + Math.random(),
        user_id: userId ?? 0,
        business_name: businessName,
        website,
        location: targetLocation,
        industry: targetIndustry,
        lead_score: analysis.lead_score || 50,
        reason: analysis.reason || result.snippet || 'Potential lead',
        opportunity: analysis.opportunity,
        suggested_service: analysis.suggested_service,
        status: 'New',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    })
  );

  // Save to database
  const existingLeads = await db.leads(userId ?? undefined);
  const newLeads = analyzedLeads.filter(
    (l: any) => !existingLeads.find((e: any) => e.business_name === l.business_name)
  );
  
  if (newLeads.length > 0) {
    const allLeads = [...existingLeads, ...newLeads];
    await db.saveLeads(allLeads);
  }

  // Save search record
  const searchRecord = {
    id: Date.now(),
    user_id: userId ?? 0,
    target_industry: targetIndustry,
    target_location: targetLocation,
    ideal_customer_description: idealCustomer,
    search_query: searchQueries.join(' | '),
    results_found: newLeads.length,
    created_at: new Date().toISOString()
  };

  const existingSearches = await db.leadSearches(userId ?? undefined);
  await db.saveLeadSearches([searchRecord, ...existingSearches]);

  return NextResponse.json({ leads: analyzedLeads, search: searchRecord });
}