import Link from 'next/link';
import { ArrowRight, Bot, Brain, CheckSquare, FileText, Megaphone, MessageSquare, Target, Shield, Zap, Users } from 'lucide-react';

const features = [
  { 
    href: '/leads', 
    icon: Target, 
    title: 'Lead Intelligence', 
    description: 'Discover, qualify, and engage with high-potential prospects using AI-powered insights.',
    accent: 'Growth'
  },
  { 
    href: '/responses', 
    icon: MessageSquare, 
    title: 'Communication Studio', 
    description: 'Craft professional client replies with perfect tone and context in seconds.',
    accent: 'Messaging'
  },
  { 
    href: '/documents', 
    icon: FileText, 
    title: 'Document Studio', 
    description: 'Generate quotes, proposals, and contracts that convert with AI assistance.',
    accent: 'Documents'
  },
  { 
    href: '/knowledge', 
    icon: Brain, 
    title: 'Business Brain', 
    description: 'Store your services, pricing, and context to make AI responses accurate and on-brand.',
    accent: 'Knowledge'
  },
  { 
    href: '/tasks', 
    icon: CheckSquare, 
    title: 'Task Manager', 
    description: 'Turn AI recommendations into focused actions with elegant execution.',
    accent: 'Planning'
  },
  { 
    href: '/content', 
    icon: Megaphone, 
    title: 'Content Studio', 
    description: 'Create launch content and customer messaging that drives engagement.',
    accent: 'Content'
  },
];

const benefits = [
  {
    icon: Zap,
    title: 'AI-Powered',
    description: 'Intelligent automation that learns your business',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data stays yours, encrypted end-to-end',
  },
  {
    icon: Users,
    title: 'Team Ready',
    description: 'Scale from solo founder to entire organization',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <nav className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8 lg:py-4">
          <Link href="/" className="flex items-center gap-2 lg:gap-3">
            <div className="flex h-8 w-8 lg:h-9 lg:w-9 items-center justify-center rounded-xl bg-primary/15">
              <Bot className="h-4.5 w-4.5 lg:h-5 lg:w-5 text-primary" />
            </div>
            <span className="text-base lg:text-lg font-semibold text-text-heading">Estech AI</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-text-muted hover:text-text-heading transition">
              Sign in
            </Link>
            <Link 
              href="/register" 
              className="rounded-xl bg-primary px-3.5 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm font-medium text-white hover:bg-primary/90 transition shadow-[0_16px_40px_rgba(59,130,246,0.15)] min-h-[44px] lg:min-h-0 flex items-center"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <p className="text-[0.65rem] uppercase tracking-[0.34em] text-primary font-medium">
            AI Business Operating System
          </p>
          <h1 className="mt-3 lg:mt-4 text-3xl font-semibold tracking-tight text-text-heading sm:text-4xl lg:text-5xl">
            Run your business with calm, intelligent software.
          </h1>
          <p className="mt-4 lg:mt-6 max-w-xl text-base text-text-muted leading-7">
            Estech brings customer conversations, documents, leads, knowledge, and content into one refined workspace designed for founders who value precision.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link 
              href="/dashboard" 
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition shadow-[0_16px_40px_rgba(59,130,246,0.15)] text-center min-h-[44px] lg:min-h-0 flex items-center justify-center"
            >
              Open workspace
            </Link>
            <Link 
              href="/leads" 
              className="rounded-xl border border-border/60 bg-surface/60 px-5 py-2.5 text-sm font-medium text-text-heading hover:bg-surface/80 transition text-center min-h-[44px] lg:min-h-0 flex items-center justify-center"
            >
              Discover leads
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-px rounded-2xl border border-border/40 bg-border/20 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Link 
              key={feature.title} 
              href={feature.href} 
              className="group flex flex-col rounded-xl bg-surface/80 p-5 lg:p-6 backdrop-blur-sm transition-all duration-300 hover:bg-surface/90 min-h-[140px]"
            >
              <div className="flex items-center gap-2 mb-3 lg:gap-2.5 lg:mb-4">
                <div className="flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-xl bg-primary/15">
                  <feature.icon className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                </div>
                <span className="text-[0.65rem] lg:text-xs font-medium text-primary">{feature.accent}</span>
              </div>
              <h3 className="text-sm lg:text-base font-medium text-text-heading mb-1.5 lg:mb-2">{feature.title}</h3>
              <p className="text-xs lg:text-sm leading-6 text-text-muted flex-1">{feature.description}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs lg:text-sm font-medium text-primary">
                Explore
                <ArrowRight className="h-3.5 w-3.5 lg:h-4 lg:w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 lg:px-8 lg:pb-28">
        <div className="border-t border-border/40 pt-16 lg:pt-20">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-xl lg:text-2xl font-semibold text-text-heading mb-2 lg:mb-3">
              Built for serious businesses
            </h2>
            <p className="text-sm lg:text-base text-text-muted max-w-xl mx-auto">
              Premium tools that respect your time and protect your data
            </p>
          </div>
          <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center lg:text-left">
                <div className="flex lg:inline-flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-xl bg-primary/10 mb-3 lg:mb-5">
                  <benefit.icon className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                </div>
                <h3 className="text-sm lg:text-base font-medium text-text-heading mb-1.5 lg:mb-2">{benefit.title}</h3>
                <p className="text-xs lg:text-sm text-text-muted leading-6">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}