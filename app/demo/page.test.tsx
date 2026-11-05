import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DemoPage from '@/app/demo/page';

describe('Guest demo page', () => {
  it('is clearly labeled as a demo and is read-only', () => {
    render(<DemoPage />);

    expect(screen.getByText('DEMO')).toBeInTheDocument();
    expect(screen.getByText('Estech Demo Workspace')).toBeInTheDocument();
    expect(screen.getByText(/Read-only demo with sample data/)).toBeInTheDocument();
  });

  it('renders sample leads, follow-ups, documents, and Business Brain', () => {
    render(<DemoPage />);

    expect(screen.getAllByText('Acme Design Co.').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Northwind Consulting').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Brightline IT').length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('Send proposal')).toBeInTheDocument();
    expect(screen.getByText('Follow-up call')).toBeInTheDocument();

    expect(screen.getByText('Acme Design Proposal')).toBeInTheDocument();
    expect(screen.getAllByText('Northwind Retainer Agreement').length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('Services: Web design, branding, SEO')).toBeInTheDocument();
  });

  it('provides sign in and create account routes', () => {
    render(<DemoPage />);

    expect(screen.getByRole('link', { name: /Sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create account/i })).toBeInTheDocument();
  });

  it('has no write forms or mutation buttons', () => {
    render(<DemoPage />);

    // No input fields that would create/modify real records.
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    // No delete/destructive actions.
    expect(screen.queryByText(/delete/i)).not.toBeInTheDocument();
  });
});
