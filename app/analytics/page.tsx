'use client';

import SidebarNav from '@/components/sidebar-nav';
import { BarChart3, FileText, MessageSquare, CheckSquare, Brain } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <SidebarNav />
      
      <main className="lg:pl-64">
        <div className="px-6 py-8 lg:px-12">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="mt-1 text-slate-400">Track your AI usage and business insights.</p>
          </div>

          {/* Stats Grid */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={MessageSquare} title="Conversations" value="0" trend="+12%" />
            <StatCard icon={FileText} title="Documents" value="0" trend="+8%" />
            <StatCard icon={CheckSquare} title="Tasks" value="0" trend="0%" />
            <StatCard icon={Brain} title="Knowledge" value="0" trend="0%" />
          </div>

          {/* Charts Section */}
          <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Usage Overview</h2>
            <div className="mt-6 h-64 rounded-lg bg-slate-950/50 flex items-center justify-center">
              <p className="text-slate-500">Chart data will appear here as you use the platform.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, trend }: { icon: React.ElementType; title: string; value: string; trend: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-slate-400" />
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-emerald-400">{trend} this month</p>
    </div>
  );
}