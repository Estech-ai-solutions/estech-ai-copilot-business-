import { NextRequest, NextResponse } from 'next/server';
import { getUserAndWorkspace } from '@/lib/auth-server';
import { createKnowledgeChunks } from '@/lib/knowledge/indexing';

export async function POST(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error === 'AuthServiceUnavailable') {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, userId, workspaceId } = result;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!workspaceId) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
  }

  const body = await request.json();
  const {
    businessName,
    businessDescription,
    industry,
    whatYouSell,
    typicalCustomer,
    primaryGoal,
    customerContactMethod,
    communicationTone,
    mainServices,
    customerFacingInfo,
  } = body || {};

  if (!businessName || !businessDescription || !industry) {
    return NextResponse.json(
      { error: 'businessName, businessDescription, and industry are required' },
      { status: 400 }
    );
  }

  const trimmedName = businessName.trim();

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const settingsPayload: any = {
    user_id: userId,
    workspace_id: workspaceId,
    company_name: trimmedName,
    business_description: businessDescription.trim(),
    industry: industry.trim(),
    what_you_sell: whatYouSell?.trim() || null,
    typical_customer: typicalCustomer?.trim() || null,
    primary_goal: primaryGoal?.trim() || null,
    customer_contact_method: customerContactMethod?.trim() || null,
    communication_tone: communicationTone?.trim() || null,
    main_services: mainServices?.trim() || null,
    customer_facing_info: customerFacingInfo?.trim() || null,
  };

  const { error: settingsError } = await supabase
    .from('user_settings')
    .upsert(settingsPayload, { onConflict: 'user_id,workspace_id' });

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 });
  }

  const knowledgeEntries: any[] = [];

  knowledgeEntries.push({
    workspace_id: workspaceId,
    title: 'Business Identity',
    category: 'general',
    content: `${trimmedName} — ${businessDescription.trim()}\n\nIndustry: ${industry.trim()}`,
    source_type: 'onboarding',
    created_by: userId,
  });

  if (whatYouSell?.trim() || mainServices?.trim()) {
    const servicesContent = [
      whatYouSell?.trim() ? `What we sell: ${whatYouSell.trim()}` : '',
      mainServices?.trim() ? `Main services: ${mainServices.trim()}` : '',
    ].filter(Boolean).join('\n\n');

    knowledgeEntries.push({
      workspace_id: workspaceId,
      title: 'What We Offer',
      category: 'services',
      content: servicesContent,
      source_type: 'onboarding',
      created_by: userId,
    });
  }

  if (typicalCustomer?.trim()) {
    knowledgeEntries.push({
      workspace_id: workspaceId,
      title: 'Customer Profile',
      category: 'general',
      content: `Typical customer: ${typicalCustomer.trim()}`,
      source_type: 'onboarding',
      created_by: userId,
    });
  }

  if (customerContactMethod?.trim() || communicationTone?.trim()) {
    const commContent = [
      customerContactMethod?.trim() ? `Preferred contact method: ${customerContactMethod.trim()}` : '',
      communicationTone?.trim() ? `Communication tone: ${communicationTone.trim()}` : '',
    ].filter(Boolean).join('\n\n');

    knowledgeEntries.push({
      workspace_id: workspaceId,
      title: 'Communication Preferences',
      category: 'general',
      content: commContent,
      source_type: 'onboarding',
      created_by: userId,
    });
  }

  if (knowledgeEntries.length > 0) {
    const { data: createdEntries, error: knowledgeError } = await supabase
      .from('knowledge')
      .insert(knowledgeEntries)
      .select('id, category, content');

    if (knowledgeError) {
      console.error('Failed to create onboarding knowledge entries:', knowledgeError);
    } else if (createdEntries) {
      for (const entry of createdEntries) {
        try {
          await createKnowledgeChunks(supabase, entry.id, null, entry.content, entry.category);
        } catch (error) {
          console.error(`[Onboarding] Failed to create chunks for knowledge ${entry.id}:`, error);
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Onboarding completed successfully',
  });
}
