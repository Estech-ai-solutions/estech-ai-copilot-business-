import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('query');
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
  }

  const tavilyApiKey = process.env.TAVILY_API_KEY;
  
  if (!tavilyApiKey) {
    // Return mock results for development
    return NextResponse.json({
      results: [
        { title: 'Sample Business 1', url: 'https://example.com', snippet: 'A sample business matching your criteria' },
        { title: 'Sample Business 2', url: 'https://example.org', snippet: 'Another potential lead' }
      ]
    });
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tavilyApiKey}`
      },
      body: JSON.stringify({
        query,
        search_depth: 'basic',
        max_results: 10,
        include_answer: false
      })
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Tavily search error:', error);
    return NextResponse.json({ error: 'Failed to search for leads' }, { status: 500 });
  }
}