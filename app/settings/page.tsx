'use client';

import { useEffect, useState } from 'react';
import SidebarNav from '@/components/sidebar-nav';
import { MobileNav } from '@/components/mobile-nav';
import { 
  Trash2, Save, Thermometer
} from 'lucide-react';
import { PageHeader, Section, Button, Input, TextArea, Select, Alert } from '@/components/ui';
import { useToast } from '@/components/toast';

type Settings = {
  company_name?: string;
  industry?: string;
  timezone?: string;
  language?: string;
  ai_model?: string;
  temperature?: number;
  response_length?: string;
  default_country?: string;
  default_industry?: string;
  max_search_results?: number;
  email_signature?: string;
  whatsapp_signature?: string;
  autosave?: boolean;
  email_notifications?: boolean;
  browser_notifications?: boolean;
  daily_summary?: boolean;
  lead_alerts?: boolean;
  ai_notifications?: boolean;
  theme?: string;
  accent_color?: string;
};

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ar', label: 'Arabic' },
];

const aiModels = [
  { value: 'mistral', label: 'Mistral (Default)' },
  { value: 'openai', label: 'OpenAI GPT' },
  { value: 'anthropic', label: 'Anthropic Claude' },
];

const responseLengths = [
  { value: 'short', label: 'Short' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'detailed', label: 'Detailed' },
];

const countries = [
  { value: 'US', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'IN', label: 'India' },
  { value: 'SG', label: 'Singapore' },
  { value: 'AE', label: 'UAE' },
];

const industries = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'retail', label: 'Retail' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'education', label: 'Education' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'other', label: 'Other' },
];

const accentColors = [
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'purple', label: 'Purple' },
  { value: 'orange', label: 'Orange' },
  { value: 'red', label: 'Red' },
];

export default function SettingsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<Settings>({
    company_name: '',
    industry: '',
    timezone: 'UTC',
    language: 'en',
    ai_model: 'mistral',
    temperature: 0.7,
    response_length: 'balanced',
    default_country: 'US',
    default_industry: '',
    max_search_results: 10,
    email_signature: '',
    whatsapp_signature: '',
    autosave: true,
    email_notifications: true,
    browser_notifications: true,
    daily_summary: false,
    lead_alerts: true,
    ai_notifications: true,
    theme: 'dark',
    accent_color: 'blue',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) {
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
    } catch {
      setError('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }

  async function saveSection(section: string, updates: Partial<Settings>) {
    setSaving(section);
    setError('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed to save ${section}`);
      } else {
        addToast(`${section.charAt(0).toUpperCase() + section.slice(1)} saved successfully`, 'success');
        setSettings((prev) => ({ ...prev, ...updates }));
      }
    } catch {
      setError(`Failed to save ${section}.`);
    } finally {
      setSaving(null);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    if (!confirm('This will permanently delete all your data. Type DELETE to confirm.')) {
      return;
    }

    setError('Account deletion is not available in this demo. Please contact support.');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileNav />
        <SidebarNav />
        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="px-4 py-6 lg:px-8 lg:py-8">
            <div className="h-6 w-48 animate-pulse rounded-lg bg-border/40 mb-3 lg:h-7 lg:w-56" />
            <div className="h-4 w-64 animate-pulse rounded-lg bg-border/40 lg:h-5 lg:w-80" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <SidebarNav />
      <main className="max-w-2xl mx-auto px-4 py-6 lg:pl-64 lg:pt-0 pt-14 lg:px-8 lg:py-8">
        <PageHeader 
          title="Settings"
          description="Manage your account and preferences"
        />

        <div className="space-y-6 lg:space-y-8">
          <Section title="General">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Company Name</label>
                <Input
                  value={settings.company_name ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSettings({ ...settings, company_name: e.target.value })}
                  placeholder="Your company name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Business Industry</label>
                <Select
                  value={settings.industry ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSettings({ ...settings, industry: e.target.value })}
                  options={industries}
                  placeholder="Select industry"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-text-heading mb-2">Timezone</label>
                  <Select
                    value={settings.timezone ?? 'UTC'}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSettings({ ...settings, timezone: e.target.value })}
                    options={timezones}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-heading mb-2">Language</label>
                  <Select
                    value={settings.language ?? 'en'}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSettings({ ...settings, language: e.target.value })}
                    options={languages}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => saveSection('general', {
                    company_name: settings.company_name,
                    industry: settings.industry,
                    timezone: settings.timezone,
                    language: settings.language,
                  })}
                  loading={saving === 'general'}
                >
                  <Save className="h-3.5 w-3.5" />
                  Save
                </Button>
              </div>
            </div>
          </Section>

          <Section title="AI Settings">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Preferred AI Model</label>
                <Select
                  value={settings.ai_model ?? 'mistral'}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSettings({ ...settings, ai_model: e.target.value })}
                  options={aiModels}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Response Length</label>
                <Select
                  value={settings.response_length ?? 'balanced'}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSettings({ ...settings, response_length: e.target.value })}
                  options={responseLengths}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">
                  Creativity: {settings.temperature?.toFixed(1) ?? '0.7'}
                </label>
                <div className="flex items-center gap-3">
                  <Thermometer className="h-4 w-4 text-text-muted" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.temperature ?? 0.7}
                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                    className="flex-1 h-2 rounded-full bg-border/60 appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => saveSection('ai settings', {
                    ai_model: settings.ai_model,
                    temperature: settings.temperature,
                    response_length: settings.response_length,
                  })}
                  loading={saving === 'ai settings'}
                >
                  <Save className="h-3.5 w-3.5" />
                  Save
                </Button>
              </div>
            </div>
          </Section>

          <Section title="Lead Intelligence">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-text-heading mb-2">Default Country</label>
                  <Select
                    value={settings.default_country ?? 'US'}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSettings({ ...settings, default_country: e.target.value })}
                    options={countries}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-heading mb-2">Default Industry</label>
                  <Select
                    value={settings.default_industry ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSettings({ ...settings, default_industry: e.target.value })}
                    options={industries}
                    placeholder="Select industry"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Maximum Search Results</label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={String(settings.max_search_results ?? 10)}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSettings({ ...settings, max_search_results: parseInt(e.target.value) || 10 })}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => saveSection('lead intelligence', {
                    default_country: settings.default_country,
                    default_industry: settings.default_industry,
                    max_search_results: settings.max_search_results,
                  })}
                  loading={saving === 'lead intelligence'}
                >
                  <Save className="h-3.5 w-3.5" />
                  Save
                </Button>
              </div>
            </div>
          </Section>

          <Section title="Communication">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Default Email Signature</label>
                <TextArea
                  value={settings.email_signature ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSettings({ ...settings, email_signature: e.target.value })}
                  rows={3}
                  placeholder="Best regards,&#10;Your Name&#10;Your Company"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">WhatsApp Signature</label>
                <TextArea
                  value={settings.whatsapp_signature ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSettings({ ...settings, whatsapp_signature: e.target.value })}
                  rows={2}
                  placeholder="Thanks, Your Name"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/40 bg-background-secondary/40 px-4 py-3.5">
                <div>
                  <span className="text-sm font-medium text-text-heading">Auto-save drafts</span>
                  <p className="text-xs text-text-muted">Automatically save message drafts</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, autosave: !settings.autosave })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    settings.autosave ? 'bg-primary' : 'bg-border/60'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
                      settings.autosave ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => saveSection('communication', {
                    email_signature: settings.email_signature,
                    whatsapp_signature: settings.whatsapp_signature,
                    autosave: settings.autosave,
                  })}
                  loading={saving === 'communication'}
                >
                  <Save className="h-3.5 w-3.5" />
                  Save
                </Button>
              </div>
            </div>
          </Section>

          <Section title="Notifications">
            <div className="space-y-3">
              {[
                { key: 'email_notifications', label: 'Email notifications', desc: 'Receive email updates' },
                { key: 'browser_notifications', label: 'Browser notifications', desc: 'Show desktop notifications' },
                { key: 'daily_summary', label: 'Daily summary', desc: 'Get a daily activity digest' },
                { key: 'lead_alerts', label: 'Lead alerts', desc: 'Notify when new leads are found' },
                { key: 'ai_notifications', label: 'AI completion alerts', desc: 'Notify when AI tasks complete' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-xl border border-border/40 bg-background-secondary/40 px-4 py-3.5">
                  <div>
                    <span className="text-sm font-medium text-text-heading">{item.label}</span>
                    <p className="text-xs text-text-muted">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof Settings] })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      settings[item.key as keyof Settings] ? 'bg-primary' : 'bg-border/60'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
                        settings[item.key as keyof Settings] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
              <div className="flex justify-end">
                <Button
                  onClick={() => saveSection('notifications', {
                    email_notifications: settings.email_notifications,
                    browser_notifications: settings.browser_notifications,
                    daily_summary: settings.daily_summary,
                    lead_alerts: settings.lead_alerts,
                    ai_notifications: settings.ai_notifications,
                  })}
                  loading={saving === 'notifications'}
                >
                  <Save className="h-3.5 w-3.5" />
                  Save
                </Button>
              </div>
            </div>
          </Section>

          <Section title="Appearance">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'system', label: 'System' },
                  ].map((theme) => (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => setSettings({ ...settings, theme: theme.value })}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                        settings.theme === theme.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/40 bg-background-secondary/40 text-text-heading hover:bg-surface/60'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Accent Color</label>
                <div className="flex gap-2">
                  {accentColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSettings({ ...settings, accent_color: color.value })}
                      className={`h-10 w-10 rounded-xl border-2 transition ${
                        settings.accent_color === color.value
                          ? 'border-primary scale-110'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value === 'blue' ? '#3b82f6' : color.value === 'green' ? '#22c55e' : color.value === 'purple' ? '#a855f7' : color.value === 'orange' ? '#f97316' : '#ef4444' }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => saveSection('appearance', {
                    theme: settings.theme,
                    accent_color: settings.accent_color,
                  })}
                  loading={saving === 'appearance'}
                >
                  <Save className="h-3.5 w-3.5" />
                  Save
                </Button>
              </div>
            </div>
          </Section>

          <Section title="Danger Zone">
            <div className="space-y-4">
              <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-danger">Delete Account</h3>
                    <p className="text-xs text-text-muted mt-1">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <Button variant="danger" size="sm" onClick={handleDeleteAccount}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </Section>

          {error && <Alert variant="error" title="Error" description={error} />}
        </div>
      </main>
    </div>
  );
}
