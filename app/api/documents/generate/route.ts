import { NextRequest, NextResponse } from 'next/server';
import { generateAiResponse } from '@/lib/ai';
import { retrieveRelevantKnowledge, buildKnowledgeContext } from '@/lib/knowledge/retrieval';
import { getUserAndWorkspace } from '@/lib/auth-server';

function buildDocumentPrompt(
  documentType: string,
  userRequest: string,
  knowledgeContext: string,
  documentTypeInstructions: string
): string {
  return `You are a professional document writing assistant for a small business.

Document Type: ${documentType}
${documentTypeInstructions}

User Request:
${userRequest}

${knowledgeContext ? `Business Knowledge Context:\n${knowledgeContext}\n` : ''}

Instructions:
- Write a complete, professional ${documentType.toLowerCase()} that directly addresses the user's request
- Use the business knowledge context above to make the document specific and accurate
- If no business context is provided, write a generic but professional template that the user can customize
- Include all standard sections expected for this document type
- Use professional business language appropriate for ${documentType.toLowerCase()}s
- Format the document with clear sections and proper structure
- Do NOT include placeholder text like [insert name here] unless unavoidable; use realistic example data instead
- Return ONLY the document content, no explanations, no markdown code blocks, no extra text`;
}

const documentTypeInstructions: Record<string, string> = {
  quote: 'Include: company header, quote number/date, client details, itemized services/products with quantities and prices, subtotal/tax/total, terms and conditions, validity period, call-to-action.',
  proposal: 'Include: executive summary, problem statement, proposed solution, scope of work, timeline, pricing/ investment, team qualifications, next steps, acceptance section.',
  invoice: 'Include: invoice number, date, due date, bill-to and ship-to addresses, itemized charges, subtotal, tax, total, payment terms, payment methods, late payment policy.',
  contract: 'Include: title, date, parties involved, recitals, definitions, terms and conditions, obligations, payment terms, term and termination, dispute resolution, governing law, signature blocks.',
  business_letter: 'Include: sender address, date, recipient address, salutation, body paragraphs with clear purpose, closing, signature block, enclosures if any.',
  email: 'Include: clear subject line, professional greeting, concise body with purpose and call-to-action, professional closing, signature.',
  report: 'Include: title, date, author, executive summary, introduction, methodology, findings, analysis, recommendations, conclusion, appendices if needed.',
  meeting_notes: 'Include: meeting title, date, attendees, agenda items, discussion points, decisions made, action items with owners and deadlines, next meeting date.',
};

export async function POST(request: NextRequest) {
  try {
  const result = await getUserAndWorkspace(request);
  if (result.error === 'AuthServiceUnavailable') {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, userId, workspaceId } = result;
    const body = await request.json();
    const { documentType, userRequest, title } = body || {};

    if (!documentType || !userRequest) {
      return NextResponse.json(
        { error: 'documentType and userRequest are required' },
        { status: 400 }
      );
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
    }

    let knowledgeContext = '';

    try {
      const knowledgeResults = await retrieveRelevantKnowledge(supabase, workspaceId, userRequest, { limit: 5 });
      const knowledgeContextStr = buildKnowledgeContext(knowledgeResults);

      if (knowledgeContextStr) {
        knowledgeContext = 'Relevant Business Knowledge:\n' + knowledgeContextStr;
      }
    } catch (error) {
      console.error('Failed to fetch knowledge context:', error);
      knowledgeContext = '';
    }

    const documentInstructions = documentTypeInstructions[documentType] || 'Write a professional business document.';

    const prompt = buildDocumentPrompt(documentType, userRequest, knowledgeContext, documentInstructions);

    const aiResponse = await generateAiResponse(prompt);

    if (!aiResponse.text || aiResponse.text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate document. Please try again.' },
        { status: 500 }
      );
    }

    const documentTitle = title?.trim() || `${documentType.replace('_', ' ')} ${new Date().toLocaleDateString()}`;

    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        workspace_id: workspaceId,
        title: documentTitle,
        type: documentType,
        content: aiResponse.text.trim(),
        status: 'draft',
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Document generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate document. Please try again.' },
      { status: 500 }
    );
  }
}