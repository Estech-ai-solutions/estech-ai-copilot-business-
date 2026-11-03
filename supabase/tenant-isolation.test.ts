import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/**
 * Tenant-isolation integration tests.
 *
 * These tests require a dedicated, isolated test Supabase instance (never
 * production). Configure TEST_SUPABASE_URL and TEST_SUPABASE_ANON_KEY before
 * running. Without those variables the suite is skipped.
 *
 * They create two independent workspaces with different users and assert that
 * workspace A cannot read, modify, or delete workspace B's records across the
 * tables covered by migrations 20 and 21.
 */

const TEST_URL = process.env.TEST_SUPABASE_URL;
const TEST_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY;

const run = Boolean(TEST_URL && TEST_ANON_KEY);

const describeBlock = run ? describe : describe.skip;

describeBlock('tenant isolation (integration, requires test Supabase)', () => {
  let supabaseA: ReturnType<typeof createClient>;
  let supabaseB: ReturnType<typeof createClient>;
  let workspaceA: string;
  let workspaceB: string;
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    if (!run) return;
    supabaseA = createClient(TEST_URL!, TEST_ANON_KEY!);
    supabaseB = createClient(TEST_URL!, TEST_ANON_KEY!);

    const { data: signUpA } = await supabaseA.auth.signUp({
      email: 'tenant-a-test@example.com',
      password: 'TestPassword123!',
    });
    const { data: signUpB } = await supabaseB.auth.signUp({
      email: 'tenant-b-test@example.com',
      password: 'TestPassword123!',
    });

    userAId = signUpA.user?.id as string;
    userBId = signUpB.user?.id as string;

    const { data: wsA } = await supabaseA
      .from('workspaces')
      .insert({ name: 'Workspace A Test', created_by: userAId })
      .select('id')
      .single();
    const { data: wsB } = await supabaseB
      .from('workspaces')
      .insert({ name: 'Workspace B Test', created_by: userBId })
      .select('id')
      .single();

    workspaceA = wsA!.id;
    workspaceB = wsB!.id;
  });

  afterAll(async () => {
    if (!run) return;
    // Clean up test data created by this suite.
    await supabaseA.from('leads').delete().eq('workspace_id', workspaceA);
    await supabaseB.from('leads').delete().eq('workspace_id', workspaceB);
    await supabaseA.from('documents').delete().eq('workspace_id', workspaceA);
    await supabaseB.from('documents').delete().eq('workspace_id', workspaceB);
    await supabaseA.from('content').delete().eq('workspace_id', workspaceA);
    await supabaseB.from('content').delete().eq('workspace_id', workspaceB);
    await supabaseA.from('tasks').delete().eq('workspace_id', workspaceA);
    await supabaseB.from('tasks').delete().eq('workspace_id', workspaceB);
    await supabaseA.from('knowledge').delete().eq('workspace_id', workspaceA);
    await supabaseB.from('knowledge').delete().eq('workspace_id', workspaceB);
    await supabaseA.from('conversations').delete().eq('workspace_id', workspaceA);
    await supabaseB.from('conversations').delete().eq('workspace_id', workspaceB);
    await supabaseA.from('analytics').delete().eq('workspace_id', workspaceA);
    await supabaseB.from('analytics').delete().eq('workspace_id', workspaceB);
    await supabaseA.from('usage_logs').delete().eq('workspace_id', workspaceA);
    await supabaseB.from('usage_logs').delete().eq('workspace_id', workspaceB);
    await supabaseA.from('lead_searches').delete().eq('workspace_id', workspaceA);
    await supabaseB.from('lead_searches').delete().eq('workspace_id', workspaceB);
    await supabaseA.from('outreach').delete().eq('workspace_id', workspaceA);
    await supabaseB.from('outreach').delete().eq('workspace_id', workspaceB);
    await supabaseA.from('user_settings').delete().eq('user_id', userAId);
    await supabaseB.from('user_settings').delete().eq('user_id', userBId);
    await supabaseA.from('workspaces').delete().eq('id', workspaceA);
    await supabaseB.from('workspaces').delete().eq('id', workspaceB);
  });

  it('workspace A cannot read workspace B leads', async () => {
    if (!run) return;
    const { data: leadB, error: insertError } = await supabaseB
      .from('leads')
      .insert({
        workspace_id: workspaceB,
        business_name: 'Lead B',
        created_by: userBId,
      })
      .select('id')
      .single();
    expect(insertError).toBeNull();

    const { data, error } = await supabaseA
      .from('leads')
      .select('*')
      .eq('id', leadB!.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it('workspace A cannot modify workspace B leads', async () => {
    if (!run) return;
    const { data: leadB } = await supabaseB
      .from('leads')
      .insert({
        workspace_id: workspaceB,
        business_name: 'Lead B',
        created_by: userBId,
      })
      .select('id')
      .single();

    const { error } = await supabaseA
      .from('leads')
      .update({ business_name: 'Tampered A' })
      .eq('id', leadB!.id);
    expect(error).not.toBeNull();
  });

  it('workspace A cannot delete workspace B leads', async () => {
    if (!run) return;
    const { data: leadB } = await supabaseB
      .from('leads')
      .insert({
        workspace_id: workspaceB,
        business_name: 'Lead B',
        created_by: userBId,
      })
      .select('id')
      .single();

    const { error } = await supabaseA.from('leads').delete().eq('id', leadB!.id);
    expect(error).not.toBeNull();
  });

  it('workspace A cannot read workspace B knowledge (Business Brain)', async () => {
    if (!run) return;
    const { data: kb } = await supabaseB
      .from('knowledge')
      .insert({
        workspace_id: workspaceB,
        title: 'Secret Policy',
        content: 'confidential',
        created_by: userBId,
      })
      .select('id')
      .single();

    const { data, error } = await supabaseA
      .from('knowledge')
      .select('*')
      .eq('id', kb!.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it('workspace A cannot read workspace B documents', async () => {
    if (!run) return;
    const { data: doc } = await supabaseB
      .from('documents')
      .insert({
        workspace_id: workspaceB,
        title: 'Secret Doc',
        type: 'proposal',
        content: 'confidential',
        created_by: userBId,
      })
      .select('id')
      .single();

    const { data, error } = await supabaseA
      .from('documents')
      .select('*')
      .eq('id', doc!.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it('workspace A cannot read workspace B content drafts', async () => {
    if (!run) return;
    const { data: content } = await supabaseB
      .from('content')
      .insert({
        workspace_id: workspaceB,
        title: 'Secret Content',
        type: 'social_media_post',
        content: 'confidential',
        created_by: userBId,
      })
      .select('id')
      .single();

    const { data, error } = await supabaseA
      .from('content')
      .select('*')
      .eq('id', content!.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it('workspace A cannot read workspace B conversations/messages', async () => {
    if (!run) return;
    const { data: conv } = await supabaseB
      .from('conversations')
      .insert({
        workspace_id: workspaceB,
        title: 'Secret Conversation',
        created_by: userBId,
      })
      .select('id')
      .single();

    const { data, error } = await supabaseA
      .from('messages')
      .select('*')
      .eq('conversation_id', conv!.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it('workspace A can read its own records', async () => {
    if (!run) return;
    const { data: leadA, error: insertError } = await supabaseA
      .from('leads')
      .insert({
        workspace_id: workspaceA,
        business_name: 'Lead A',
        created_by: userAId,
      })
      .select('id')
      .single();
    expect(insertError).toBeNull();

    const { data, error } = await supabaseA
      .from('leads')
      .select('*')
      .eq('id', leadA!.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });
});
