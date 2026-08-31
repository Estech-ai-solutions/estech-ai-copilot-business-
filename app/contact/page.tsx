'use client';

import { useState } from 'react';
import { Mail, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-background text-text-body">
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <h1 className="text-2xl font-semibold text-text-heading mb-2">Contact</h1>
        <p className="text-sm text-text-muted mb-8">
          Have a question or need help? Send us a message and we will get back to you.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface/70 p-6">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-text-heading">Email</h2>
            </div>
            <p className="text-sm text-text-muted">business@estech-ai.com</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/70 p-6">
            <div className="flex items-center gap-3 mb-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-text-heading">Support</h2>
            </div>
            <p className="text-sm text-text-muted">Use the in-app help options for account and technical support.</p>
          </div>
        </div>

        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <div>
            <label className="block text-xs font-medium text-text-heading mb-2">Subject</label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm text-text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="How can we help?"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-heading mb-2">Message</label>
            <textarea
              required
              rows={5}
              className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm text-text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              placeholder="Tell us more..."
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition shadow-[0_16px_40px_rgba(59,130,246,0.25)]"
          >
            Send Message
          </button>
          {sent && (
            <p className="text-xs text-success">Thank you. We have received your message.</p>
          )}
        </form>
      </div>
    </div>
  );
}
