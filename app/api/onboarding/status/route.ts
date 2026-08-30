import { NextRequest, NextResponse } from 'next/server';
import { getUserAndWorkspace } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error === 'AuthServiceUnavailable') {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, userId, workspaceId } = result;

  if (!userId) {
    return NextResponse.json({ completed: false });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, onboarding_completed_at')
    .eq('id', userId)
    .single();

  const completed = profile?.onboarding_completed === true;

  return NextResponse.json({
    completed,
    completedAt: profile?.onboarding_completed_at || null,
  });
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

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  // Update profile with business name and onboarding completion
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      company_name: businessName.trim(),
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Update or create user_settings with onboarding data
  const settingsPayload: any = {
    user_id: userId,
    workspace_id: workspaceId,
    company_name: businessName.trim(),
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

  return NextResponse.json({
    success: true,
    message: 'Onboarding completed successfully',
  });
}
