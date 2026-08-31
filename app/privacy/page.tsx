export const metadata = {
  title: 'Privacy Policy | Estech AI Business Copilot',
  description: 'Privacy policy for Estech AI Business Copilot.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-text-body">
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <h1 className="text-2xl font-semibold text-text-heading mb-6">Privacy Policy</h1>
        <div className="space-y-4 text-sm text-text-muted leading-relaxed">
          <p>
            Estech AI Business Copilot (&quot;Estech&quot;) helps small businesses manage leads, communications, documents, knowledge, and AI-assisted workflows.
          </p>
          <p>
            This Privacy Policy explains what information we collect, how we use it, and the choices you have. By using the service, you agree to the practices described below.
          </p>

          <h2 className="text-base font-semibold text-text-heading mt-6 mb-2">Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Account information such as name, email, and password.</li>
            <li>Workspace and business information you enter, including business details, knowledge entries, documents, tasks, and leads.</li>
            <li>Usage data such as feature usage, request logs, and error reports.</li>
            <li>AI interaction data including prompts, responses, and feedback when you use AI features.</li>
          </ul>

          <h2 className="text-base font-semibold text-text-heading mt-6 mb-2">How We Use Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide and improve the service.</li>
            <li>Generate AI-assisted responses, documents, and recommendations.</li>
            <li>Maintain security, prevent abuse, and troubleshoot issues.</li>
          </ul>

          <h2 className="text-base font-semibold text-text-heading mt-6 mb-2">Third-Party Services</h2>
          <p>
            Estech uses third-party providers for authentication, database storage, AI processing, and search. These providers may process data on our behalf to deliver the service. We do not sell your personal information.
          </p>

          <h2 className="text-base font-semibold text-text-heading mt-6 mb-2">Data Retention and Deletion</h2>
          <p>
            You can request account or workspace deletion by contacting support. Upon deletion, we will remove your account data and workspace content, subject to legal or backup retention requirements.
          </p>

          <h2 className="text-base font-semibold text-text-heading mt-6 mb-2">Your Rights</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access, update, or delete your account information.</li>
            <li>Request deletion of workspace data.</li>
            <li>Contact us with questions about this policy.</li>
          </ul>

          <h2 className="text-base font-semibold text-text-heading mt-6 mb-2">Contact</h2>
          <p>
            For privacy questions, contact us at business@estech-ai.com.
          </p>
        </div>
      </div>
    </div>
  );
}
