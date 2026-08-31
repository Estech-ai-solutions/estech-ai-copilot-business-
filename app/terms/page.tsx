export const metadata = {
  title: 'Terms of Service | Estech AI Business Copilot',
  description: 'Terms of service for Estech AI Business Copilot.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-text-body">
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <h1 className="text-2xl font-semibold text-text-heading mb-6">Terms of Service</h1>
        <div className="space-y-4 text-sm text-text-muted leading-relaxed">
          <p>
            These Terms of Service govern your use of Estech AI Business Copilot. By creating an account or using the service, you agree to these terms.
          </p>

          <h2 className="text-base font-semibold text-text-heading mt-6 mb-2">Acceptable Use</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the service in compliance with applicable laws and regulations.</li>
            <li>Do not attempt to gain unauthorized access to the service or other users&apos; data.</li>
            <li>Do not use the service to generate harmful, illegal, or abusive content.</li>
            <li>Respect the limits of your plan during the limited-time free launch.</li>
          </ul>

          <h2 className="text-base font-semibold text-text-heading mt-6 mb-2">Service Description</h2>
          <p>
            Estech provides AI-assisted tools for small businesses, including lead management, communication drafting, document creation, knowledge storage, and content generation. Features and availability may change during the early-access period.
          </p>

          <h2 className="text-base font-semibold text-text-heading mt-6 mb-2">Limitation of Liability</h2>
          <p>
            Estech is provided on an as-is basis during the early-access launch. We do not guarantee uninterrupted or error-free operation. To the fullest extent permitted by law, Estech is not liable for indirect, incidental, or consequential damages arising from your use of the service.
          </p>

          <h2 className="text-base font-semibold text-text-heading mt-6 mb-2">Termination</h2>
          <p>
            We may suspend or terminate access if the terms are violated or if the service is discontinued. You may stop using the service at any time.
          </p>

          <h2 className="text-base font-semibold text-text-heading mt-6 mb-2">Changes</h2>
          <p>
            We may update these terms as the product evolves. Continued use after changes constitutes acceptance of the updated terms.
          </p>

          <h2 className="text-base font-semibold text-text-heading mt-6 mb-2">Contact</h2>
          <p>
            For terms questions, contact us at business@estech-ai.com.
          </p>
        </div>
      </div>
    </div>
  );
}
