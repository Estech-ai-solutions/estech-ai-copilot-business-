import { NextRequest, NextResponse } from 'next/server';
import { generateAiResponse } from '@/lib/ai';
import { retrieveRelevantKnowledge, buildKnowledgeContext } from '@/lib/knowledge/retrieval';
import { getUserAndWorkspace } from '@/lib/auth-server';

type LeadSource = 'web' | 'linkedin' | 'jobs' | 'directories';

const SOURCE_META: Record<LeadSource, { label: string; siteFilter: string; hint: string }> = {
  web: {
    label: 'Anywhere on the web',
    siteFilter: '',
    hint: 'Prefer official business websites that show contact details (email, phone, address).',
  },
  linkedin: {
    label: 'LinkedIn companies',
    siteFilter: 'site:linkedin.com',
    hint: 'LinkedIn company pages identify the organisation, its industry and its size.',
  },
  jobs: {
    label: 'Companies hiring',
    siteFilter: 'site:indeed.com OR site:glassdoor.com OR site:ziprecruiter.com',
    hint: 'Companies that are hiring have budget and are growing — strong prospects.',
  },
  directories: {
    label: 'Business directories',
    siteFilter: 'site:yellowpages.com OR site:yelp.com OR site:bbb.org OR site:clutch.co',
    hint: 'Directory listings usually expose phone, address and website for outreach.',
  },
};

const LOW_QUALITY_HOSTS = [
  'wikipedia.org', 'youtube.com', 'facebook.com', 'instagram.com', 'twitter.com',
  'x.com', 'tiktok.com', 'reddit.com', 'quora.com', 'pinterest.com', 'medium.com',
  'linkedin.com/pulse', 'linkedin.com/posts', 'news.', 'blog.',
];

const LISTICLE_PATTERN = /\b(top|best|10|20|list of|guide|how to|tips|examples|ideas)\b/i;

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|limited|co|corp|company|group|and|the)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function isValidHttpUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value.startsWith('http') ? value : `https://${value}`);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

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

  const rawSource = String(body?.source || 'web');
  const source: LeadSource = (Object.keys(SOURCE_META) as LeadSource[]).includes(rawSource as LeadSource)
    ? (rawSource as LeadSource)
    : 'web';

  const targetIndustry = typeof body?.targetIndustry === 'string' ? body.targetIndustry.trim() : '';
  const targetLocation = typeof body?.targetLocation === 'string' ? body.targetLocation.trim() : '';
  const idealCustomer = typeof body?.idealCustomer === 'string' ? body.idealCustomer.trim() : '';

  if (!targetIndustry && !targetLocation && !idealCustomer) {
    return NextResponse.json(
      { error: 'Tell us what you are looking for — an industry, a location, or a description of your ideal customer.' },
      { status: 400 }
    );
  }

  const meta = SOURCE_META[source];
  const userDescription = [idealCustomer, targetIndustry, targetLocation].filter(Boolean).join(' · ');

  let optimizedQuery = [targetIndustry, targetLocation, 'businesses with contact details'].filter(Boolean).join(' ');

  try {
    const queryResponse = await generateAiResponse(
      `You are an expert at building web search queries that surface REAL, contactable businesses.

${meta.siteFilter ? `The query MUST include this search operator so results come from the right source: ${meta.siteFilter}` : ''}

Guidance for this source: ${meta.hint}

The user is looking for: "${userDescription}"

Write ONE search query (maximum 200 characters) that returns real business listings showing a business name plus a website, email or phone number.
- Do NOT request lists, statistics, guides, "top 10" articles, news, or research papers
- Do NOT wrap the query in quotes
Return ONLY the search query text.`,
      'You are a precise search-query generator. You return only the query text and nothing else.',
      { maxTokens: 200 }
    );

    const cleaned = (queryResponse.text || '')
      .trim()
      .replace(/^["'\s]+|["'\s]+$/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    const looksLikeError = /^(error|estech|ai is not configured|gemini|groq|mistral)/i.test(cleaned);
    if (cleaned.length > 3 && cleaned.length <= 250 && !cleaned.includes('\n') && !looksLikeError) {
      optimizedQuery = cleaned;
    }
  } catch (e) {
    console.error('Failed to optimize search query:', e);
  }

  const tavilyApiKey = process.env.TAVILY_API_KEY;
  if (!tavilyApiKey) {
    return NextResponse.json(
      { error: 'Lead discovery is not configured on this server. Add TAVILY_API_KEY to enable it.', leads: [] },
      { status: 503 }
    );
  }

  let searchResults: any[] = [];
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
        include_answer: false,
      }),
    });

    if (!response.ok) throw new Error(`Tavily returned ${response.status}`);

    const data = await response.json();
    searchResults = Array.isArray(data.results) ? data.results : [];
  } catch (e) {
    console.error('Tavily search error:', e);
    return NextResponse.json(
      { error: 'Lead search is temporarily unavailable. Please try again in a moment.', leads: [] },
      { status: 503 }
    );
  }

  if (searchResults.length === 0) {
    return NextResponse.json({
      leads: [],
      optimizedQuery,
      message: `No businesses matched that search. Try a broader industry, a larger location, or a different source.`,
    });
  }

  const relevantResults = searchResults.filter((item) => {
    const url = String(item?.url || '');
    const title = String(item?.title || '');
    if (!isValidHttpUrl(url)) return false;

    if (source === 'web') {
      if (LOW_QUALITY_HOSTS.some((host) => url.toLowerCase().includes(host))) return false;
      if (LISTICLE_PATTERN.test(title) && !/\b(business|ltd|llc|inc|company|services|solutions)\b/i.test(title)) {
        return false;
      }
    }

    return true;
  });

  if (relevantResults.length === 0) {
    return NextResponse.json({
      leads: [],
      optimizedQuery,
      message: 'The search only returned articles and aggregator pages, not individual businesses. Try a different source.',
    });
  }

  let knowledgeContextStr = '';
  if (workspaceId) {
    try {
      const knowledgeResults = await retrieveRelevantKnowledge(
        supabase,
        workspaceId,
        [targetIndustry, targetLocation, idealCustomer].filter(Boolean).join(' '),
        { limit: 3 }
      );
      knowledgeContextStr = buildKnowledgeContext(knowledgeResults);
    } catch (error) {
      console.error('Failed to retrieve relevant knowledge for leads:', error);
    }
  }

  const analyzedLeads = await Promise.all(
    relevantResults.map(async (item) => {
      const title = String(item?.title || '');
      const url = String(item?.url || '');
      const snippet = String(item?.snippet || item?.content || '');

      const analysisPrompt = `Extract structured lead data from this business listing.

Title: ${title}
URL: ${url}
Snippet: ${snippet.slice(0, 800)}

Wanted: ${targetIndustry || 'any industry'}${targetLocation ? ` in ${targetLocation}` : ''}
Ideal customer: ${idealCustomer || 'Not specified'}

${knowledgeContextStr ? `Business context for the seller:\n${knowledgeContextStr.slice(0, 1500)}\n` : ''}

Rules:
- "business_name" must be a REAL organisation name taken from the result. Never invent one.
- Set "is_real_business" to false if the result is a news article, blog post, listicle, PDF, or category/index page instead of a single business.
- Only include email/phone/city/state if they actually appear in the text, otherwise use null.
- "lead_score" (0-100) must reflect fit with the wanted industry, location and ideal customer. Be strict: 90+ only for a specific, strong match. Give low scores to generic or off-target results.

Return ONLY valid JSON, no markdown:
{
  "business_name": "string or empty",
  "website": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "city": "string or null",
  "state": "string or null",
  "description": "one sentence on what this business does",
  "industry": "string - the business's actual industry",
  "is_real_business": true,
  "lead_score": number,
  "reason": "one sentence: why this matches the search",
  "opportunity": "the specific angle to pitch them",
  "suggested_service": "what to offer them"
}`;

      const fallback = {
        business_name: '',
        website: isValidHttpUrl(url) ? url : null,
        email: null,
        phone: null,
        city: null,
        state: null,
        description: snippet.slice(0, 200),
        industry: targetIndustry || '',
        is_real_business: false,
        lead_score: 0,
        reason: '',
        opportunity: '',
        suggested_service: '',
      };

      try {
        const aiResponse = await generateAiResponse(analysisPrompt, undefined, { maxTokens: 400 });
        const jsonMatch = aiResponse.text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) return { ...fallback };

        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed?.is_real_business !== true) return { ...fallback };

        const businessName = typeof parsed.business_name === 'string' ? parsed.business_name.trim() : '';
        if (!businessName || businessName.length < 2) return { ...fallback };

        const score = Number(parsed.lead_score);
        const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 50;

        return {
          business_name: businessName,
          website: isValidHttpUrl(parsed.website) ? parsed.website : (isValidHttpUrl(url) ? url : null),
          email: typeof parsed.email === 'string' && parsed.email.includes('@') ? parsed.email.trim() : null,
          phone: typeof parsed.phone === 'string' && parsed.phone.trim() ? parsed.phone.trim() : null,
          city: typeof parsed.city === 'string' && parsed.city.trim() ? parsed.city.trim() : null,
          state: typeof parsed.state === 'string' && parsed.state.trim() ? parsed.state.trim() : null,
          description: typeof parsed.description === 'string' ? parsed.description.trim() : snippet.slice(0, 200),
          industry: typeof parsed.industry === 'string' && parsed.industry.trim() ? parsed.industry.trim() : targetIndustry || '',
          is_real_business: true,
          lead_score: safeScore,
          reason: typeof parsed.reason === 'string' ? parsed.reason.trim() : 'Matches your search criteria.',
          opportunity: typeof parsed.opportunity === 'string' ? parsed.opportunity.trim() : '',
          suggested_service: typeof parsed.suggested_service === 'string' ? parsed.suggested_service.trim() : '',
        };
      } catch {
        return { ...fallback };
      }
    })
  );

  const validLeads = analyzedLeads.filter(
    (l) => l.is_real_business === true && l.business_name && l.lead_score >= 40
  );

  let insertedCount = 0;

  if (validLeads.length > 0) {
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('website, business_name')
      .eq('workspace_id', workspaceId);

    const existingWebsites = new Set(
      (existingLeads || []).map((l: any) => l.website).filter(Boolean)
    );
    const existingNames = new Set(
      (existingLeads || []).map((l: any) => normalizeName(l.business_name || '')).filter(Boolean)
    );

    const seenInBatch = new Set<string>();

    for (const lead of validLeads) {
      const nameKey = normalizeName(lead.business_name);
      const websiteKey = lead.website ? String(lead.website).toLowerCase().replace(/\/$/, '') : '';

      if (nameKey && existingNames.has(nameKey)) continue;
      if (websiteKey && existingWebsites.has(lead.website)) continue;
      if (nameKey && seenInBatch.has(nameKey)) continue;

      seenInBatch.add(nameKey);

      const { error } = await supabase.from('leads').insert({
        ...lead,
        workspace_id: workspaceId,
        location: targetLocation || [lead.city, lead.state].filter(Boolean).join(', ') || 'Unspecified',
        source_url: lead.website || undefined,
        status: 'new',
        created_by: userId,
      });

      if (!error) insertedCount += 1;
      if (error) console.error('Failed to insert lead:', error.message);
    }
  }

  await supabase.from('lead_searches').insert({
    workspace_id: workspaceId,
    query: optimizedQuery,
    results_count: insertedCount,
  });

  if (insertedCount === 0) {
    return NextResponse.json({
      leads: [],
      optimizedQuery,
      message:
        validLeads.length > 0
          ? 'Every match found is already in your leads list.'
          : 'No relevant businesses matched. Try a different industry, location, or source.',
    });
  }

  return NextResponse.json({
    leads: validLeads,
    insertedCount,
    optimizedQuery,
  });
}
