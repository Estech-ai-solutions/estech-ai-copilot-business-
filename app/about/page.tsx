import { Metadata } from 'next';
import { Bot } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About | Estech AI Business Copilot',
  description: 'Learn about Estech AI Business Copilot.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-text-body">
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-text-heading">About Estech AI</h1>
        </div>
        <div className="space-y-4 text-sm text-text-muted leading-relaxed">
          <p>
            Estech AI Business Copilot is an AI-assisted workspace for small businesses. It helps with leads, customer communication, documents, knowledge management, and content creation.
          </p>
          <p>
            The product is built around a simple idea: teach the AI how your business works, then let it help you run it. Business Brain stores your services, pricing, policies, and context so AI responses stay accurate and on-brand.
          </p>
          <p>
            Estech is developed by Estech AI Solutions. The current release is an early-access version intended for real-user testing and feedback.
          </p>
          <p>
            For questions, reach us at business@estech-ai.com.
          </p>
        </div>
      </div>
    </div>
  );
}
