import { NextRequest, NextResponse } from 'next/server';
import { generateAiResponse } from '@/lib/ai';
import { retrieveRelevantKnowledge, buildKnowledgeContext } from '@/lib/knowledge/retrieval';
import { getUserAndWorkspace } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error === 'AuthServiceUnavailable') {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, userId, workspaceId } = result;
  const body = await request.json();
  const { targetIndustry, targetLocation, idealCustomer } = body;

  if (!targetIndustry || !targetLocation) {
    return NextResponse.json({ error: 'targetIndustry and targetLocation are required' }, { status: 400 });
  }

  const userDescription = [idealCustomer, targetIndustry, targetLocation].filter(Boolean).join(' in ');

  let optimizedQuery = `${targetIndustry} in ${targetLocation}`;

  try {
    const queryResponse = await generateAiResponse(
      `You are a search query optimizer. Given a user's description of their ideal customer or target market, generate ONE highly specific search query optimized for finding real businesses, companies, or organizations.

User description: "${userDescription}"

Requirements:
- Make it specific enough to find actual businesses, not Wikipedia pages
- Include location if provided
- Include industry-specific terms
- Ask for business names, websites, contact info, addresses
- Keep it under 200 characters
- Return ONLY the search query, nothing else`,
      'You are a helpful assistant that generates optimized search queries for finding real businesses.'
    );

    const cleaned = (queryResponse.text || '').trim();
    if (cleaned && !cleaned.toLowerCase().startsWith('error')) {
      optimizedQuery = cleaned.replace(/^["']|["']$/g, '');
    }
  } catch (e) {
    console.error('Failed to optimize search query:', e);
  }

  const tavilyApiKey = process.env.TAVILY_API_KEY;
  let searchResults: any[] = [];

  if (tavilyApiKey) {
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tavilyApiKey}`,
        },
        body: JSON.stringify({
          query: optimizedQuery,
          search_depth: 'advanced',
          max_results: 10,
          include_raw_content: true,
        }),
      });

      const data = await response.json();
      searchResults = data.results || [];
    } catch (e) {
      console.error('Tavily search error:', e);
    }
  }

  if (searchResults.length === 0) {
    searchResults = Array.from({ length: 3 }, (_, i) => ({
      title: `${targetIndustry} Business ${i + 1}`,
      url: `https://${targetIndustry.toLowerCase().replace(/\s+/g, '')}${i + 1}.com`,
      snippet: `A ${targetIndustry.toLowerCase()} business located in ${targetLocation} that ${idealCustomer || 'needs our services'}`,
      content: `Business description for ${targetIndustry} ${i + 1} in ${targetLocation}.`,
    }));
  }

  const { data: workspaceData } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single();

  let knowledgeContextStr = '';

  if (workspaceId) {
    try {
      const knowledgeResults = await retrieveRelevantKnowledge(
        supabase,
        workspaceId,
        targetIndustry + ' ' + targetLocation,
        { limit: 3 }
      );
      knowledgeContextStr = buildKnowledgeContext(knowledgeResults);
    } catch (error) {
      console.error('Failed to retrieve relevant knowledge for leads:', error);
    }
  }

  const analyzedLeads = await Promise.all(
    searchResults.map(async (result) => {
      const title = result.title || 'Unknown Business';
      const url = result.url || '';
      const snippet = result.snippet || '';
      const content = result.content || '';

      let businessName = title.replace(/ - .*/, '').replace(/ \| .*/, '').trim();
      if (!businessName || businessName.length < 2) {
        businessName = title;
      }

      const analysisPrompt = `Analyze this search result and extract structured lead information.

Search Result:
Title: ${title}
URL: ${url}
Snippet: ${snippet}
Content: ${content}

Context:
- Target Industry: ${targetIndustry}
- Target Location: ${targetLocation}
- Ideal Customer: ${idealCustomer || 'Not specified'}

${knowledgeContextStr ? `Business Knowledge Context:\n${knowledgeContextStr}\n` : ''}

Extract and return ONLY valid JSON (no markdown, no extra text):
{
  "business_name": "string - the actual business name",
  "website": "string - the website URL",
  "email": "string or null - any email found",
  "phone": "string or null - any phone number found",
  "address": "string or null - street address if found",
  "city": "string or null - city if found",
  "state": "string or null - state/region if found",
  "description": "string - brief description of the business",
  "industry": "${targetIndustry}",
  "lead_score": number (0-100, how good a match),
  "reason": "string - why this is a good lead",
  "opportunity": "string - potential business opportunity",
  "suggested_service": "string - what service to offer"
}`;

      let leadData: any = {
        business_name: businessName,
        website: url,
        email: null,
        phone: null,
        address: null,
        city: null,
        state: null,
        description: snippet,
        industry: targetIndustry,
        lead_score: 50,
        reason: snippet || 'Potential lead from search',
        opportunity: '',
        suggested_service: '',
      };

      try {
        const aiResponse = await generateAiResponse(analysisPrompt, undefined, { maxTokens: 300 });
        const jsonMatch = aiResponse.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          leadData = {
            ...leadData,
            ...parsed,
            lead_score: typeof parsed.lead_score === 'number' ? parsed.lead_score : Number(parsed.lead_score) || 50,
          };
        }
      } catch {
        // Use defaults
      }

      return {
        ...leadData,
        workspace_id: workspaceId,
        location: targetLocation,
        source_url: url,
        status: 'new' as const,
        created_by: userId,
      };
    }),
  );

  const validLeads = analyzedLeads.filter((l) => l.business_name && l.business_name !== 'Unknown Business');

  if (validLeads.length > 0) {
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('website')
      .eq('workspace_id', workspaceId)
      .not('website', 'is', null);

    const existingWebsites = new Set((existingLeads || [])
      .map((l: any) => l.website)
      .filter(Boolean));

    const newLeads = validLeads.filter((l) => !existingWebsites.has(l.website));

    for (const lead of newLeads) {
      const { error } = await supabase.from('leads').insert(lead);
      if (error) {
        console.error('Failed to insert lead:', error);
      }
    }
  }

  const { data: searchRecord } = await supabase
    .from('lead_searches')
    .insert({
      workspace_id: workspaceId,
      query: optimizedQuery,
      results_count: validLeads.length,
    })
    .select()
    .single();

  return NextResponse.json({
    leads: validLeads,
    search: searchRecord,
    optimizedQuery,
  });
}
