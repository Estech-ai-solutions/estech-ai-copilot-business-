import { NextRequest, NextResponse } from 'next/server';
import { getUserAndWorkspace } from '@/lib/auth-server';

function getDateRange(range: string) {
  const now = new Date();
  let start = new Date();

  if (range === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (range === '7d') {
    start.setDate(now.getDate() - 7);
  } else if (range === '30d') {
    start.setDate(now.getDate() - 30);
  } else if (range === '90d') {
    start.setDate(now.getDate() - 90);
  } else {
    start.setDate(now.getDate() - 30);
  }

  return start.toISOString();
}

export async function GET(request: NextRequest) {
  const result = await getUserAndWorkspace(request);
  if (result.error === 'AuthServiceUnavailable') {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { supabase, userId, workspaceId } = result;
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '30d';
  const startDate = getDateRange(range);

  if (!workspaceId) {
    return NextResponse.json({
      stats: {
        totalLeads: 0,
        hotLeads: 0,
        documentsCreated: 0,
        knowledgeEntries: 0,
        completedTasks: 0,
        aiConversations: 0,
      },
      leadsByStatus: [],
      documentsByType: [],
      leadsOverTime: [],
      tasksCompleted: [],
      recentActivity: [],
      insights: [],
    });
  }

  const [
    leadsRes,
    documentsRes,
    knowledgeRes,
    tasksRes,
    conversationsRes,
    messagesRes,
  ] = await Promise.all([
    supabase.from('leads').select('*').eq('workspace_id', workspaceId).gte('created_at', startDate),
    supabase.from('documents').select('*').eq('workspace_id', workspaceId).gte('created_at', startDate),
    supabase.from('knowledge').select('*').eq('workspace_id', workspaceId).gte('created_at', startDate),
    supabase.from('tasks').select('*').eq('workspace_id', workspaceId).gte('created_at', startDate),
    supabase.from('conversations').select('*').eq('workspace_id', workspaceId).gte('created_at', startDate),
    supabase.from('messages').select('*').eq('workspace_id', workspaceId).gte('created_at', startDate),
  ]);

  const leads = leadsRes.data || [];
  const documents = documentsRes.data || [];
  const knowledge = knowledgeRes.data || [];
  const tasks = tasksRes.data || [];
  const conversations = conversationsRes.data || [];
  const messages = messagesRes.data || [];

  const hotLeads = leads.filter((l: any) => (l.lead_score || 0) >= 80).length;
  const completedTasks = tasks.filter((t: any) => t.status === 'done').length;

  const leadsByStatusMap = new Map<string, number>();
  leads.forEach((lead: any) => {
    const status = lead.status || 'new';
    leadsByStatusMap.set(status, (leadsByStatusMap.get(status) || 0) + 1);
  });

  const leadsByStatus = Array.from(leadsByStatusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  const documentsByTypeMap = new Map<string, number>();
  documents.forEach((doc: any) => {
    const type = doc.type || 'other';
    documentsByTypeMap.set(type, (documentsByTypeMap.get(type) || 0) + 1);
  });

  const documentsByType = Array.from(documentsByTypeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const leadsOverTimeMap = new Map<string, number>();
  leads.forEach((lead: any) => {
    const date = new Date(lead.created_at).toISOString().split('T')[0];
    leadsOverTimeMap.set(date, (leadsOverTimeMap.get(date) || 0) + 1);
  });

  const leadsOverTime = Array.from(leadsOverTimeMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const tasksCompletedByDate = new Map<string, number>();
  tasks.filter((t: any) => t.status === 'done').forEach((task: any) => {
    const date = new Date(task.created_at).toISOString().split('T')[0];
    tasksCompletedByDate.set(date, (tasksCompletedByDate.get(date) || 0) + 1);
  });

  const tasksCompleted = Array.from(tasksCompletedByDate.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  const recentActivity = [
    ...conversations.map((c: any) => ({
      type: 'conversation',
      title: c.title || 'New conversation',
      time: c.created_at,
      icon: 'message',
    })),
    ...documents.map((d: any) => ({
      type: 'document',
      title: d.title || 'New document',
      time: d.created_at,
      icon: 'file',
    })),
    ...knowledge.map((k: any) => ({
      type: 'knowledge',
      title: k.title || 'New knowledge entry',
      time: k.created_at,
      icon: 'brain',
    })),
    ...tasks.map((t: any) => ({
      type: 'task',
      title: t.title || 'New task',
      time: t.created_at,
      icon: 'check',
    })),
    ...leads.map((l: any) => ({
      type: 'lead',
      title: l.business_name || 'New lead',
      time: l.created_at,
      icon: 'target',
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 10);

  const totalLeads = leads.length;
  const proposalRate = totalLeads > 0 ? Math.round((leadsByStatusMap.get('proposal_sent') || 0) / totalLeads * 100) : 0;

  const mostCommonDocType = documentsByType.length > 0 ? documentsByType[0].type : 'none';

  const insights = [
    totalLeads > 0 ? `${hotLeads} hot leads requiring follow-up.` : 'No leads yet.',
    `Proposal conversion rate is ${proposalRate}%.`,
    mostCommonDocType !== 'none' ? `Most documents created are ${mostCommonDocType.replace('_', ' ')}s.` : 'No documents yet.',
  ];

  return NextResponse.json({
    stats: {
      totalLeads,
      hotLeads,
      documentsCreated: documents.length,
      knowledgeEntries: knowledge.length,
      completedTasks,
      aiConversations: conversations.length,
    },
    leadsByStatus,
    documentsByType,
    leadsOverTime,
    tasksCompleted,
    recentActivity,
    insights,
  });
}
