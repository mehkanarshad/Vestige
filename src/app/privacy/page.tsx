import { PublicShell } from "@/components/layout/public-shell";
import { Footer } from "@/components/layout/footer";
import { SectionLabel } from "@/components/ui/section-label";
import { Divider } from "@/components/ui/divider";

interface PolicySectionProps {
  title: string;
  children: React.ReactNode;
}

function PolicySection({ title, children }: PolicySectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4 sm:gap-12 py-10">
      <h2 className="font-serif text-[1.1rem] text-vestige-espresso leading-snug pt-1">
        {title}
      </h2>
      <div className="space-y-4 t-body-md text-vestige-umber leading-relaxed">{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <PublicShell>
      <section className="py-section container-md">
        <SectionLabel className="mb-8">Legal</SectionLabel>
        <h1 className="t-display-xl text-vestige-ink mb-4 text-balance">Privacy Policy</h1>
        <p className="t-body-lg text-vestige-stone">Last updated: September 2026</p>
      </section>

      <Divider className="container-xl" />

      <section className="container-md pb-section divide-y divide-vestige-sand/60">
        <PolicySection title="Overview">
          <p>
            Vestige is built on the principle that your data serves you — not advertisers,
            not third parties. This policy explains what we collect, why we collect it, and
            how you can control it.
          </p>
          <p>
            Vestige was created for the YouCam API Hackathon 2026. This policy applies to
            all data processed within the application.
          </p>
        </PolicySection>

        <PolicySection title="What we collect">
          <p>
            <strong className="font-medium text-vestige-espresso">Account data.</strong>{" "}
            Your name and email address, used only to identify your account and send
            essential service communications.
          </p>
          <p>
            <strong className="font-medium text-vestige-espresso">Photos.</strong>{" "}
            Photos you upload are sent to the YouCam Skin Analysis API and YouCam Virtual
            Try-On API for processing. We store a reference to the session photo during
            an active session. We do not permanently store raw photos on our servers.
          </p>
          <p>
            <strong className="font-medium text-vestige-espresso">Skin analysis results.</strong>{" "}
            Structured data returned by YouCam — skin tone, undertone, skin type, and
            concern scores — is stored against your style profile to enable personalisation
            across sessions.
          </p>
          <p>
            <strong className="font-medium text-vestige-espresso">Session data.</strong>{" "}
            Your styling intention, AI-generated recommendations, the outfit you selected,
            the virtual try-on result, and your feedback are stored per session.
          </p>
          <p>
            <strong className="font-medium text-vestige-espresso">Style Profile.</strong>{" "}
            An aggregated model derived from your sessions: preferred styles, avoided
            patterns, colour palette, and style evolution snapshots.
          </p>
        </PolicySection>

        <PolicySection title="What we do not collect">
          <ul className="space-y-2 list-none">
            {[
              "Biometric identifiers beyond skin analysis results",
              "Location data",
              "Device identifiers or fingerprints",
              "Behavioural tracking across third-party sites",
              "Payment information (no purchases occur in-app)",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-2 w-1 h-1 rounded-full bg-vestige-gold flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </PolicySection>

        <PolicySection title="Third-party APIs">
          <p>
            <strong className="font-medium text-vestige-espresso">YouCam Perfect.</strong>{" "}
            Photos are transmitted to YouCam's Skin Analysis and Virtual Try-On APIs
            for processing. YouCam's own privacy policy governs their handling of that
            data. We transmit only what is required for the feature to function.
          </p>
          <p>
            <strong className="font-medium text-vestige-espresso">OpenAI.</strong>{" "}
            Your skin analysis summary, styling intention, and style profile are
            included in prompts sent to the OpenAI API to generate recommendations.
            No personally identifiable information (name, email, photo) is included
            in these prompts. OpenAI's usage policies apply.
          </p>
        </PolicySection>

        <PolicySection title="Data retention">
          <p>
            Session data is retained for as long as your account exists. You may delete
            your account at any time from your Account settings page, which permanently
            removes all associated sessions, feedback, and your style profile.
          </p>
          <p>
            Style Evolution snapshots are retained as part of your profile history.
            Deleting your account removes these permanently and irreversibly.
          </p>
        </PolicySection>

        <PolicySection title="Your rights">
          <p>You have the right to:</p>
          <ul className="space-y-2 list-none">
            {[
              "Access all data associated with your account",
              "Export your style profile and session history",
              "Correct inaccurate account data",
              "Delete your account and all associated data",
              "Object to any processing beyond what is strictly necessary",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-2 w-1 h-1 rounded-full bg-vestige-gold flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-2">
            To exercise any of these rights, use the Account settings page or contact
            the project team.
          </p>
        </PolicySection>

        <PolicySection title="Security">
          <p>
            Passwords are hashed using bcrypt with a cost factor of 12. Sessions are
            managed via signed JWT tokens. API keys are stored as environment variables
            and never exposed to the client.
          </p>
          <p>
            The database is a local SQLite file in the demonstration environment. In a
            production deployment, this would be replaced with an encrypted, managed
            database service.
          </p>
        </PolicySection>

        <PolicySection title="Changes">
          <p>
            If this policy changes materially, we will update the date at the top of
            this page and, where appropriate, notify you by email. Continued use of
            Vestige after a policy change constitutes acceptance of the revised terms.
          </p>
        </PolicySection>
      </section>

      <Footer />
    </PublicShell>
  );
}
