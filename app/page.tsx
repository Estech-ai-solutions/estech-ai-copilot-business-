'use client';

import { useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import {
  ArrowRight,
  Bot,
  Brain,
  CheckSquare,
  FileText,
  Megaphone,
  MessageSquare,
  Target,
  Shield,
  Zap,
  Users,
  Sparkles,
  ChevronDown,
  Menu,
  X,
  Star,
  Search,
  Mail,
} from 'lucide-react';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Estech AI Business Copilot',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'AI-assisted workspace for small businesses. Manage leads, communications, documents, knowledge, and content with an AI that learns your business.',
  url: 'https://estech-ai.com',
  provider: {
    '@type': 'Organization',
    name: 'Estech AI Solutions',
    email: 'business@estech-ai.com',
  },
};

const features = [
  {
    href: '/leads',
    icon: Target,
    title: 'Lead Intelligence',
    description: 'Discover, score, and engage high-value prospects with AI-driven insights and outreach.',
    accent: 'Growth',
  },
  {
    href: '/responses',
    icon: MessageSquare,
    title: 'Communication Studio',
    description: 'Generate professional customer replies, sales responses, and outreach messages in seconds.',
    accent: 'Messaging',
  },
  {
    href: '/documents',
    icon: FileText,
    title: 'Document Studio',
    description: 'Create quotes, proposals, invoices, contracts, and reports ready to download.',
    accent: 'Documents',
  },
  {
    href: '/knowledge',
    icon: Brain,
    title: 'Business Brain',
    description: 'Store your services, pricing, FAQs, and policies. The AI references this for accurate, on-brand responses.',
    accent: 'Knowledge',
  },
  {
    href: '/tasks',
    icon: CheckSquare,
    title: 'Task Manager',
    description: 'Convert AI suggestions into actionable tasks with deadlines, priorities, and status tracking.',
    accent: 'Planning',
  },
  {
    href: '/content',
    icon: Megaphone,
    title: 'Content Studio',
    description: 'Create marketing copy, social posts, email campaigns, and ad creatives at scale.',
    accent: 'Content',
  },
];

const benefits = [
  {
    icon: Zap,
    title: 'AI-Assisted Workflows',
    description: 'Automate repetitive work with an AI that learns your business context.',
  },
  {
    icon: Shield,
    title: 'Private by Design',
    description: 'Your workspace data is scoped to your account. We use standard security practices to protect it.',
  },
  {
    icon: Users,
    title: 'Built for Small Teams',
    description: 'Designed for founders, operators, and small teams who need more with less.',
  },
];

const coreFeatures = [
  {
    title: 'Lead Intelligence',
    description:
      'Discover new prospects, auto-score them, and manage outreach from one place. Prioritize high-value leads and close faster.',
    icon: Search,
  },
  {
    title: 'Communication Studio',
    description:
      'Generate professional customer replies, sales responses, and outreach messages in seconds. Every response is powered by your Business Brain context.',
    icon: Mail,
  },
  {
    title: 'Document Studio',
    description:
      'Create quotes, proposals, invoices, contracts, and reports formatted for clients. Save and download documents directly from the workspace.',
    icon: FileText,
  },
  {
    title: 'Business Brain',
    description:
      'Store your pricing, services, FAQs, and policies. The AI references this automatically for accurate, on-brand responses every time.',
    icon: Brain,
  },
  {
    title: 'BizBot AI Assistant',
    description:
      'Chat with an AI that knows your business. Ask questions, get suggestions, and automate repetitive work with natural language.',
    icon: Bot,
  },
];

const integrations = [
  'Stripe',
  'PayPal',
  'Gmail',
  'Outlook',
  'Calendly',
  'Zendesk',
];

const testimonials = [
  {
    quote: 'Estech helps us keep client communication and documents in one place. The AI suggestions save time on repetitive tasks.',
    name: 'Early User',
    title: 'Small Business Operator',
  },
  {
    quote: 'The Business Brain feature is useful. It remembers our services and uses that context when drafting replies and documents.',
    name: 'Early User',
    title: 'Founder',
  },
];

const pricingPlans = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'limited time',
    description: 'For solo founders and freelancers getting started.',
    features: ['1 workspace', 'Basic AI assistance', 'Core features', 'Email support'],
    cta: 'Create Free Account',
  },
  {
    name: 'Professional',
    price: 'Free',
    period: 'limited time',
    description: 'For growing teams that need more power and collaboration.',
    features: ['5 workspaces', 'Advanced AI assistance', 'All core features', 'Priority support'],
    cta: 'Create Free Account',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Free',
    period: 'limited time',
    description: 'For organizations that need control, security, and scale.',
    features: ['Unlimited workspaces', 'Advanced AI assistance', 'All core features', 'Dedicated support'],
    cta: 'Contact Sales',
  },
];

const faqs = [
  {
    question: 'How does the free early access work?',
    answer: 'All plans are currently free during our limited-time launch. Create an account and get access to the available features with no credit card required.',
  },
  {
    question: 'Can I switch plans later?',
    answer: 'Yes. You can change your workspace or plan settings as your needs evolve.',
  },
  {
    question: 'Is my business data secure?',
    answer: 'We use standard security practices including encrypted connections and access control. Your workspace data is scoped to your account.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'If you are not satisfied within the first 14 days, contact support for a full refund. No questions asked.',
  },
];

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [billingYearly, setBillingYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-text-body">
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div
        className="fixed inset-0 z-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8 lg:py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <span className="text-base font-semibold text-text-heading">Estech AI</span>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-muted">
              <Link href="#features" className="hover:text-text-heading transition">Features</Link>
              <Link href="#pricing" className="hover:text-text-heading transition">Pricing</Link>
              <Link href="/about" className="hover:text-text-heading transition">About</Link>
              <Link href="/contact" className="hover:text-text-heading transition">Contact</Link>
            </div>

            <div className="hidden md:flex items-center gap-3 text-sm">
              <Link href="/login" className="text-text-muted hover:text-text-heading transition">
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition shadow-[0_16px_40px_rgba(59,130,246,0.25)]"
              >
                Sign Up
              </Link>
            </div>

            <button
              className="md:hidden p-2 text-text-muted"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileOpen && (
            <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl">
              <div className="px-4 py-4 space-y-3 text-sm font-medium text-text-muted">
                <Link href="#features" className="block hover:text-text-heading" onClick={() => setMobileOpen(false)}>Features</Link>
                <Link href="#pricing" className="block hover:text-text-heading" onClick={() => setMobileOpen(false)}>Pricing</Link>
                <Link href="/about" className="block hover:text-text-heading" onClick={() => setMobileOpen(false)}>About</Link>
                <Link href="/contact" className="block hover:text-text-heading" onClick={() => setMobileOpen(false)}>Contact</Link>
                <div className="pt-3 flex flex-col gap-2">
                  <Link href="/login" className="block text-center text-text-muted hover:text-text-heading">Sign In</Link>
                  <Link href="/register" className="block text-center rounded-full bg-primary px-4 py-2 text-white text-center hover:bg-primary-dark transition">Sign Up</Link>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Hero */}
        <section className="mx-auto max-w-7xl px-4 pt-16 pb-20 lg:px-8 lg:pt-28 lg:pb-32">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI Business Copilot
            </span>

            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-text-heading sm:text-5xl lg:text-6xl">
              Teach Estech your business. Then let it help you run it.
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base text-text-muted sm:text-lg leading-relaxed">
              An AI assistant that learns your customers, documents, and knowledge—so you can spend less time on repetitive work and more time growing the business.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-dark transition shadow-[0_16px_40px_rgba(59,130,246,0.25)]"
              >
                Get Started Free
              </Link>
              <Link
                href="#features"
                className="rounded-full border border-border bg-surface/60 px-6 py-3 text-sm font-medium text-text-heading hover:bg-surface-hover transition"
              >
                See Features
              </Link>
            </div>

            <div className="mt-12 relative mx-auto max-w-5xl">
              <div className="rounded-2xl border border-border bg-surface/80 shadow-2xl shadow-black/20 overflow-hidden">
                <div className="h-6 bg-background-secondary border-b border-border flex items-center gap-2 px-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-danger/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
                </div>
                <div className="p-6 sm:p-8">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Workspaces', value: 'Active' },
                      { label: 'AI Assistance', value: 'Available' },
                      { label: 'Knowledge', value: 'Remembered' },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-border bg-background-secondary/60 p-4">
                        <p className="text-xs text-text-muted">{stat.label}</p>
                        <p className="mt-1 text-xl font-semibold text-text-heading">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 h-48 rounded-xl border border-dashed border-border bg-background-secondary/40 flex items-center justify-center text-xs text-text-muted">
                    Dashboard preview
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section id="features" className="mx-auto max-w-7xl px-4 pb-24 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <p className="text-xs uppercase tracking-widest text-primary font-medium">Focus on What Matters</p>
            <h2 className="mt-3 text-2xl lg:text-3xl font-semibold text-text-heading">Everything to Run and Grow Business.</h2>
          </div>

          <div className="grid gap-8 lg:gap-12 grid-cols-1 md:grid-cols-3">
            {[
              {
                title: 'Automate Operations',
                description: 'Remove repetitive work with AI that handles invoicing, follow-ups, and documentation without manual input.',
              },
              {
                title: 'Gain Financial Clarity',
                description: 'Track revenue, predict late payments, and keep clean books with automated bookkeeping and real-time analytics.',
              },
              {
                title: 'Close More Deals',
                description: 'Score leads, personalize outreach, and generate proposals fast—so your pipeline stays full and conversions rise.',
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <h3 className="text-base font-semibold text-text-heading mb-2">{item.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Core Features */}
        <section className="border-y border-border/60 bg-background-secondary/40">
          <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-xs uppercase tracking-widest text-primary font-medium">Our Core Features</p>
              <h2 className="mt-3 text-2xl lg:text-3xl font-semibold text-text-heading">Everything you need in one Platform.</h2>
            </div>

            <div className="space-y-16 lg:space-y-24">
              {coreFeatures.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`flex flex-col ${
                    index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  } items-center gap-10 lg:gap-16`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-text-heading">{feature.title}</h3>
                    </div>
                    <p className="text-sm text-text-muted leading-relaxed">{feature.description}</p>
                  </div>
                  <div className="flex-1 w-full">
                    <div className="aspect-video rounded-2xl border border-border bg-surface/60 shadow-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xl font-semibold text-text-heading">
              SEAMLESS WORKFLOW / Integrate Critical Workflows
            </h2>
            <p className="mt-2 text-sm text-text-muted">Connect with the tools you already use.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {integrations.map((name) => (
              <span
                key={name}
                className="rounded-full border border-border bg-surface/60 px-4 py-2 text-xs font-medium text-text-muted"
              >
                {name}
              </span>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-y border-border/60 bg-background-secondary/40">
          <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
            <h2 className="text-center text-xl font-semibold text-text-heading mb-10">What early users are saying</h2>

            <div className="grid gap-6 lg:gap-8 grid-cols-1 md:grid-cols-2">
              {testimonials.map((item) => (
                <div key={item.name} className="rounded-2xl border border-border bg-surface/70 p-6 shadow-sm">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-text-body leading-relaxed mb-4">“{item.quote}”</p>
                  <div>
                    <p className="text-sm font-semibold text-text-heading">{item.name}</p>
                    <p className="text-xs text-text-muted">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-primary font-medium">Simple Pricing</p>
            <h2 className="mt-3 text-2xl lg:text-3xl font-semibold text-text-heading">Start Free. Upgrade as You Grow.</h2>
            <p className="mt-2 text-sm text-text-muted">All plans are currently free during our limited-time launch.</p>

            <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-border bg-surface/60 p-1">
              <button
                onClick={() => setBillingYearly(false)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  !billingYearly ? 'bg-primary text-white' : 'text-text-muted hover:text-text-heading'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingYearly(true)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  billingYearly ? 'bg-primary text-white' : 'text-text-muted hover:text-text-heading'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:gap-8 grid-cols-1 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border bg-surface/70 p-6 ${
                  plan.popular ? 'border-primary shadow-[0_20px_50px_rgba(59,130,246,0.12)]' : 'border-border'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Most Popular
                  </span>
                )}
                <div className="text-center">
                  <h3 className="text-base font-semibold text-text-heading">{plan.name}</h3>
                  <p className="mt-2 text-xs text-text-muted">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-semibold text-text-heading">
                      {plan.price}
                    </span>
                    <span className="text-sm text-text-muted">{plan.period}</span>
                  </div>
                </div>

                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-text-muted">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.cta === 'Contact Sales' ? '/contact' : '/register'}
                  className={`mt-6 block w-full rounded-full py-2.5 text-center text-sm font-medium transition ${
                    plan.popular
                      ? 'bg-primary text-white hover:bg-primary-dark'
                      : 'border border-border text-text-heading hover:bg-surface-hover'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-y border-border/60 bg-background-secondary/40">
          <div className="mx-auto max-w-3xl px-4 py-20 lg:px-8">
            <div className="text-center mb-10">
              <p className="text-xs uppercase tracking-widest text-primary font-medium">FAQ</p>
              <h2 className="mt-3 text-2xl font-semibold text-text-heading">Frequently asked questions</h2>
            </div>

            <div className="space-y-3">
              {faqs.map((item) => {
                const isOpen = openFaq === item.question;
                return (
                  <div key={item.question} className="rounded-2xl border border-border bg-surface/70">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : item.question)}
                      className="flex w-full items-center justify-between px-5 py-4 text-left"
                    >
                      <span className="text-sm font-semibold text-text-heading">{item.question}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-text-muted transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-sm text-text-muted leading-relaxed">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="text-center rounded-3xl border border-border bg-surface/70 p-10 lg:p-16 shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <span className="text-base font-semibold text-text-heading">Estech AI</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-semibold text-text-heading">Run your Business the Smart Way!</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-text-muted">
              Join early users exploring AI-assisted customer, sales, and document workflows.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-dark transition shadow-[0_16px_40px_rgba(59,130,246,0.25)]"
            >
              Try it now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/60 bg-background-secondary/40">
          <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-text-heading">Estech AI</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="rounded-full border border-border bg-surface/60 px-4 py-2 text-xs text-text-heading placeholder:text-text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-dark transition">
                    Subscribe
                  </button>
                </div>
              </div>

              <p className="text-xs text-text-muted">© {new Date().getFullYear()} Estech AI. All rights reserved.</p>

              <div className="flex items-center gap-6 text-xs text-text-muted">
                <Link href="/about" className="hover:text-text-heading transition">About</Link>
                <Link href="/contact" className="hover:text-text-heading transition">Contact</Link>
                <Link href="/privacy" className="hover:text-text-heading transition">Privacy</Link>
                <Link href="/terms" className="hover:text-text-heading transition">Terms</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
