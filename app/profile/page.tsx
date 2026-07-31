'use client';

import { useEffect, useState, useRef } from 'react';
import SidebarNav from '@/components/sidebar-nav';
import { MobileNav } from '@/components/mobile-nav';
import { 
  User, TrendingUp, Target, Brain, MessageSquare, FileText, Shield, 
  Upload, Save, Edit3, X, CheckCircle2, AlertCircle
} from 'lucide-react';
import { PageHeader, StatCard, Section, Button, Input, TextArea, Alert } from '@/components/ui';
import { useToast } from '@/components/toast';
import { useSupabaseContext } from '@/providers/supabase-provider';

type Profile = {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  job_title?: string;
  bio?: string;
  avatar_url?: string;
  company_name?: string;
  subscription_plan?: string;
  subscription_status?: string;
  created_at?: string;
};

type Workspace = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
};

type Counts = {
  documents: number;
  knowledgeEntries: number;
  leads: number;
  messagesSent: number;
  tasksCompleted: number;
};

export default function ProfilePage() {
  const { user, loading: authLoading } = useSupabaseContext();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [role, setRole] = useState<string>('viewer');
  const [counts, setCounts] = useState<Counts>({
    documents: 0,
    knowledgeEntries: 0,
    leads: 0,
    messagesSent: 0,
    tasksCompleted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [passwordData, setPasswordData] = useState({
    current: '',
    newPassword: '',
    confirm: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
      }
      if (data.workspace) {
        setWorkspace(data.workspace);
      }
      if (data.role) {
        setRole(data.role);
      }
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch {
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save profile');
      } else {
        addToast('Profile updated successfully', 'success');
        setIsEditing(false);
      }
    } catch {
      setError('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirm) {
      setError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordData.newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to change password');
      } else {
        addToast('Password changed successfully', 'success');
        setPasswordData({ current: '', newPassword: '', confirm: '' });
      }
    } catch {
      setError('Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || 'Failed to upload avatar', 'error');
      } else {
        setProfile((prev) => prev ? { ...prev, avatar_url: data.avatarUrl } : null);
        addToast('Avatar updated successfully', 'success');
      }
    } catch {
      addToast('Failed to upload avatar', 'error');
    }
  }

  if (authLoading || loading) {
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <MobileNav />
        <SidebarNav />
        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="px-4 py-6 lg:px-8 lg:py-8">
            <p className="text-text-muted">Please sign in to view your profile.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <SidebarNav />
      <main className="max-w-4xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <PageHeader 
          title="Profile"
          description="Manage your personal information and account settings"
        />

        <div className="space-y-6">
          <Section title="Profile Information">
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"
                    >
                      <Upload className="h-3 w-3" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-heading">{profile.full_name || 'User'}</p>
                  <p className="text-xs text-text-muted">{user?.email}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-text-heading mb-2">Full Name</label>
                  <Input
                    value={profile.full_name ?? ''}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Your full name"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-heading mb-2">Email</label>
                  <Input
                    value={user?.email ?? ''}
                    onChange={() => {}}
                    disabled
                    className="bg-background-secondary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-heading mb-2">Phone Number</label>
                  <Input
                    value={profile.phone ?? ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-heading mb-2">Job Title</label>
                  <Input
                    value={profile.job_title ?? ''}
                    onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                    placeholder="e.g. Marketing Manager"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Bio</label>
                <TextArea
                  value={profile.bio ?? ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center gap-3">
                {!isEditing ? (
                  <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button type="submit" loading={saving}>
                      <Save className="h-3.5 w-3.5" />
                      Save Changes
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>

              {error && <Alert variant="error" title="Error" description={error} />}
            </form>
          </Section>

          <Section title="Workspace Information">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Workspace Name</label>
                  <p className="text-sm text-text-heading font-medium">{workspace?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Role</label>
                  <p className="text-sm text-text-heading font-medium capitalize">{role.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Member Since</label>
                  <p className="text-sm text-text-heading font-medium">
                    {workspace?.created_at ? new Date(workspace.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Subscription</label>
                  <p className="text-sm text-text-heading font-medium capitalize">
                    {profile.subscription_plan || 'Free'} {profile.subscription_status ? `(${profile.subscription_status})` : ''}
                  </p>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Security">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-text-heading mb-2">New Password</label>
                  <Input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    disabled={changingPassword}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-heading mb-2">Confirm Password</label>
                  <Input
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                    placeholder="Confirm new password"
                    disabled={changingPassword}
                  />
                </div>
              </div>
              <Button type="submit" variant="secondary" loading={changingPassword}>
                <Shield className="h-3.5 w-3.5" />
                Change Password
              </Button>
              {error && <Alert variant="error" title="Error" description={error} />}
            </form>
          </Section>

          <Section title="Activity Summary">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard icon={FileText} value={counts.documents} label="Documents Created" />
              <StatCard icon={Brain} value={counts.knowledgeEntries} label="Knowledge Entries" />
              <StatCard icon={Target} value={counts.leads} label="Leads Saved" />
              <StatCard icon={MessageSquare} value={counts.messagesSent} label="Messages Sent" />
              <StatCard icon={CheckCircle2} value={counts.tasksCompleted} label="Tasks Completed" />
            </div>
          </Section>
        </div>
      </main>
    </div>
  );
}
