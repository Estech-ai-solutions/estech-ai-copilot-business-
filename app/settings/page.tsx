'use client';

import SidebarNav from '@/components/sidebar-nav';
import { Settings, User, Bell, Shield, CreditCard } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <SidebarNav />
      
      <main className="lg:pl-64">
        <div className="px-6 py-8 lg:px-12">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="mt-1 text-slate-400">Manage your account and preferences.</p>
          </div>

          {/* Settings Sections */}
          <div className="mt-8 max-w-2xl space-y-6">
            <SettingsSection icon={User} title="Account" description="Manage your profile and business information">
              <button className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400">
                Edit Profile
              </button>
            </SettingsSection>

            <SettingsSection icon={Bell} title="Notifications" description="Configure AI alerts and reminders">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-700 bg-slate-900" defaultChecked />
                <span className="text-sm text-slate-300">Email notifications</span>
              </label>
            </SettingsSection>

            <SettingsSection icon={Shield} title="Security" description="API keys and authentication settings">
              <button className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:border-slate-600">
                Change Password
              </button>
            </SettingsSection>

            <SettingsSection icon={CreditCard} title="Subscription" description="Manage your plan and billing">
              <button className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:border-slate-600">
                View Plan
              </button>
            </SettingsSection>
          </div>
        </div>
      </main>
    </div>
  );
}

function SettingsSection({ icon: Icon, title, description, children }: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
      <div className="flex items-start gap-4">
        <Icon className="h-6 w-6 text-sky-400" />
        <div className="flex-1">
          <h3 className="font-medium text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}