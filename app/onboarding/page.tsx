'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Bot, ChevronRight, ChevronLeft, Check, Upload, FileText, Sparkles, Shield } from 'lucide-react';
import { PageHeader, Button, Input, TextArea, Select, Alert } from '@/components/ui';

type OnboardingData = {
  businessName: string;
  businessDescription: string;
  industry: string;
  whatYouSell: string;
  typicalCustomer: string;
  primaryGoal: string;
  customerContactMethod: string;
  communicationTone: string;
  mainServices: string;
  customerFacingInfo: string;
};

type Step = 1 | 2 | 3 | 4;

const industries = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'retail', label: 'Retail' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'education', label: 'Education' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'construction', label: 'Construction' },
  { value: 'food_service', label: 'Food Service' },
  { value: 'other', label: 'Other' },
];

const goals = [
  { value: 'get_more_customers', label: 'Get more customers' },
  { value: 'improve_service', label: 'Improve customer service' },
  { value: 'automate_work', label: 'Automate repetitive work' },
  { value: 'organize_info', label: 'Organize business information' },
  { value: 'save_time', label: 'Save time on admin tasks' },
  { value: 'other', label: 'Other' },
];

const contactMethods = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone calls' },
  { value: 'whatsapp', label: 'WhatsApp / Messaging' },
  { value: 'social_media', label: 'Social media' },
  { value: 'in_person', label: 'In person' },
  { value: 'mixed', label: 'Mixed channels' },
];

const tones = [
  { value: 'professional', label: 'Professional and formal' },
  { value: 'friendly', label: 'Friendly and warm' },
  { value: 'casual', label: 'Casual and relaxed' },
  { value: 'sales_focused', label: 'Sales-focused and persuasive' },
  { value: 'supportive', label: 'Supportive and helpful' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [data, setData] = useState<OnboardingData>({
    businessName: '',
    businessDescription: '',
    industry: 'other',
    whatYouSell: '',
    typicalCustomer: '',
    primaryGoal: 'get_more_customers',
    customerContactMethod: 'mixed',
    communicationTone: 'professional',
    mainServices: '',
    customerFacingInfo: '',
  });

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  async function checkOnboardingStatus() {
    try {
      const res = await fetch('/api/onboarding/status');
      const json = await res.json();
      if (json.completed) {
        router.push('/dashboard');
      }
    } catch {
      // User is not onboarded, continue
    } finally {
      setCheckingStatus(false);
    }
  }

  function updateField<K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) {
    setData(prev => ({ ...prev, [field]: value }));
  }

  function canProceed(): boolean {
    switch (currentStep) {
      case 1:
        return !!data.businessName.trim() && !!data.businessDescription.trim() && !!data.industry;
      case 2:
        return true; // Optional step
      case 3:
        return true; // Optional step
      case 4:
        return true;
      default:
        return false;
    }
  }

  async function handleNext() {
    if (!canProceed()) return;
    
    if (currentStep === 4) {
      await handleComplete();
    } else {
      setCurrentStep(prev => (prev + 1) as Step);
    }
  }

  async function handleBack() {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as Step);
    }
  }

  async function handleComplete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to complete onboarding');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  }

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-primary animate-pulse" />
          <p className="text-sm text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  const stepTitles = {
    1: 'Tell us about your business',
    2: 'How customers reach you',
    3: 'Teach Estech about your business',
    4: "You're all set!",
  };

  const stepDescriptions = {
    1: 'This helps Estech give you more relevant answers and documents.',
    2: 'Help Estech communicate in the right way for your business.',
    3: 'Add information so Estech can answer questions accurately.',
    4: 'Your business workspace is ready.',
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8 lg:py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-heading">Estech AI</h1>
              <p className="text-xs text-text-muted">Business Copilot</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className="flex items-center gap-2 flex-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition ${
                    step <= currentStep
                      ? 'bg-primary text-white'
                      : 'bg-background-secondary/60 text-text-muted'
                  }`}
                >
                  {step < currentStep ? <Check className="h-4 w-4" /> : step}
                </div>
                {step < 4 && (
                  <div
                    className={`h-0.5 flex-1 transition ${
                      step < currentStep ? 'bg-primary' : 'bg-border/40'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <h2 className="text-xl font-semibold text-text-heading mb-2">{stepTitles[currentStep]}</h2>
          <p className="text-sm text-text-muted">{stepDescriptions[currentStep]}</p>
        </div>

        {error && (
          <Alert variant="error" title="Error" description={error} className="mb-6" />
        )}

        <div className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Business Name *</label>
                <Input
                  value={data.businessName}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('businessName', e.target.value)}
                  placeholder="e.g. Acme Logistics"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">What does your business do? *</label>
                <TextArea
                  value={data.businessDescription}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('businessDescription', e.target.value)}
                  placeholder="Describe your business in a few sentences..."
                  rows={3}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Industry *</label>
                <Select
                  value={data.industry}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('industry', e.target.value)}
                  options={industries}
                  placeholder="Select your industry"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">What do you sell or provide?</label>
                <Input
                  value={data.whatYouSell}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('whatYouSell', e.target.value)}
                  placeholder="e.g. Logistics services, consulting, products..."
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Who are your typical customers?</label>
                <TextArea
                  value={data.typicalCustomer}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('typicalCustomer', e.target.value)}
                  placeholder="Describe your ideal customer..."
                  rows={2}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Primary business goal</label>
                <Select
                  value={data.primaryGoal}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('primaryGoal', e.target.value)}
                  options={goals}
                  placeholder="Select your primary goal"
                  className="w-full"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="rounded-xl border border-border/40 bg-background-secondary/30 p-4 mb-6">
                <p className="text-sm text-text-muted leading-6">
                  This helps Estech communicate with your customers in the right way.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">How do customers usually contact you?</label>
                <Select
                  value={data.customerContactMethod}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('customerContactMethod', e.target.value)}
                  options={contactMethods}
                  placeholder="Select contact method"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Preferred communication tone</label>
                <Select
                  value={data.communicationTone}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('communicationTone', e.target.value)}
                  options={tones}
                  placeholder="Select tone"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Main services or products</label>
                <TextArea
                  value={data.mainServices}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('mainServices', e.target.value)}
                  placeholder="List your main services or products..."
                  rows={3}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-heading mb-2">Any important customer-facing information?</label>
                <TextArea
                  value={data.customerFacingInfo}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('customerFacingInfo', e.target.value)}
                  placeholder="e.g. delivery times, pricing notes, special offers, policies..."
                  rows={3}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="rounded-xl border border-border/40 bg-background-secondary/30 p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-text-heading mb-1">Why this matters</p>
                    <p className="text-sm text-text-muted leading-6">
                      Estech can use this information when helping you answer customers, create documents, and make business recommendations.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/40 bg-background-secondary/30 p-4">
                <h3 className="text-sm font-medium text-text-heading mb-3">Add your first knowledge entry (optional)</h3>
                <p className="text-xs text-text-muted mb-4">
                  The more context you provide, the better Estech can help. You can skip this and add knowledge later.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-heading mb-2">Title</label>
                    <Input
                      value={data.whatYouSell ? 'What we offer' : ''}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('whatYouSell', e.target.value)}
                      placeholder="e.g. Our services, Pricing, FAQ"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-heading mb-2">Content</label>
                    <TextArea
                      value={data.customerFacingInfo}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('customerFacingInfo', e.target.value)}
                      placeholder="Add details about your business..."
                      rows={4}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="text-center py-4">
                <p className="text-xs text-text-muted">
                  You can always add more knowledge later in <strong>Business Brain</strong>.
                </p>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6 text-center py-8">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                  <Check className="h-8 w-8 text-success" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-heading mb-2">Your workspace is ready!</h3>
                <p className="text-sm text-text-muted leading-6 max-w-md mx-auto">
                  Estech now understands your business. You can start asking questions, finding leads, creating documents, and more.
                </p>
              </div>

              <div className="rounded-xl border border-border/40 bg-background-secondary/30 p-4 text-left">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-text-heading mb-1">Your data stays yours</p>
                    <p className="text-xs text-text-muted leading-5">
                      All business information is stored securely in your private workspace.
                      Estech uses this information only to help you run your business.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-border/40">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
            </div>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : currentStep === 4 ? (
                <>
                  Go to Dashboard
                  <ChevronRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
