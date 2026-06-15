import Link from 'next/link';
import SiteNav from '@/components/site-nav';

const features = [
  {
    icon: '📧',
    title: 'Communication Studio',
    description: 'Generate professional customer replies in seconds. Download and send.'
  },
  {
    icon: '📄',
    title: 'Document Studio',
    description: 'Create quotes, invoices, and proposals your clients can download instantly.'
  },
  {
    icon: '🧠',
    title: 'Business Brain',
    description: 'Store your pricing, services, and FAQs. AI references this automatically.'
  },
  {
    icon: '✅',
    title: 'Task Manager',
    description: 'Convert AI suggestions into actionable tasks with deadlines.'
  }
];

const testimonials = [
  {
    name: 'Sarah Chen',
    business: 'Creative Agency',
    quote: 'Estech saves me 2 hours daily on customer emails. The AI knows my pricing perfectly.'
  },
  {
    name: 'Mike Rodriguez',
    business: 'E-commerce Store',
    quote: 'My product descriptions and customer replies are now consistent and professional.'
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <SiteNav />
      
      {/* Hero Section */}
      <section className="section-container flex min-h-[calc(100vh-6rem)] flex-col justify-center gap-16 py-16">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.4em] text-sky-400">AI Business Platform</p>
          <h1 className="mt-6 text-5xl font-bold leading-tight text-white sm:text-6xl">
            Your AI Copilot for Business
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Automate customer conversations, generate professional documents, and organize your business knowledge in one intelligent workspace.
          </p>
          
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/dashboard" className="rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
              Open Control Center
            </Link>
            <Link href="/responses" className="rounded-xl border border-slate-700 px-6 py-3 text-sm text-slate-100 transition hover:border-slate-600">
              Try Communication Studio
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 transition hover:border-slate-700">
              <div className="text-2xl">{feature.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-t border-slate-800/50 py-16">
        <div className="section-container">
          <h2 className="text-center text-lg font-semibold text-white">Trusted by small businesses</h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6">
                <p className="text-slate-300">"{t.quote}"</p>
                <p className="mt-4 text-sm text-sky-400">{t.name} • {t.business}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}