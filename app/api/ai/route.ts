import { NextResponse } from 'next/server';
import { getTokenFromHeader, verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateAiResponse } from '@/lib/ai';

export async function POST(request: Request) {
  const body = await request.json();
  const prompt = body.prompt?.trim();

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
  }

  const token = getTokenFromHeader(request);
  let knowledge: Array<{ title: string; type: string; content: string }> = [];
  let businessProfile: any = null;

  if (token) {
    try {
      const payload = verifyToken(token);
      const businessProfileId = payload.businessProfileId ? Number(payload.businessProfileId) : undefined;
      
      if (businessProfileId) {
        // Get business profile
        const profiles = await db.profiles();
        businessProfile = profiles.find((p: any) => p.id === businessProfileId);
        
        // Get knowledge base entries
        const knowledgeEntries = await db.knowledge(businessProfileId);
        knowledge = knowledgeEntries.slice(0, 10);
      }
    } catch {
      // Continue without knowledge if token invalid
    }
  }

  // Build comprehensive context
  let context = 'You are a helpful business consultant for small businesses.';
  
  if (businessProfile) {
    context = `You are a business consultant for ${businessProfile.name}.`;
    
    if (businessProfile.description) {
      context += `\n\nBusiness Description: ${businessProfile.description}`;
    }
    
    if (businessProfile.products) {
      context += `\n\nProducts/Services: ${businessProfile.products}`;
    }
    
    if (businessProfile.pricing_info) {
      context += `\n\nPricing Information: ${businessProfile.pricing_info}`;
    }
  }
  
  if (knowledge.length > 0) {
    context += `\n\nBusiness Knowledge Base:\n${knowledge.map(k => `## ${k.title} (${k.type})\n${k.content}`).join('\n\n')}`;
  }

  const aiResponse = await generateAiResponse(prompt, context);

  if (token && aiResponse) {
    try {
      const payload = verifyToken(token);
      const businessProfileId = payload.businessProfileId ? Number(payload.businessProfileId) : undefined;
      if (businessProfileId) {
        const usageLogs = await db.usageLogs(businessProfileId);
        usageLogs.push({
          id: Date.now(),
          business_profile_id: payload.businessProfileId,
          feature: 'assistant',
          tokens_used: Math.ceil((aiResponse.text?.length || 0) / 4),
          created_at: new Date().toISOString()
        });
        await db.saveUsageLogs(usageLogs);
      }
    } catch {
      // Continue without logging if error
    }
  }

  return NextResponse.json(aiResponse);
}