import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy - DeRadar",
  description: "Privacy Policy for DeRadar - Decentralized Aircraft Tracking",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to DeRadar
        </Link>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 shadow-2xl">
          <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-slate-400 mb-8">Last updated: November 25, 2025</p>

          <div className="prose prose-invert prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p className="text-slate-300 mb-4">
                Welcome to DeRadar. We are committed to protecting your privacy and ensuring transparency
                in how we handle data. This Privacy Policy explains our practices regarding the collection,
                use, and disclosure of information when you use our decentralized aircraft tracking service.
              </p>
              <p className="text-slate-300">
                DeRadar is built on decentralized technologies (Ar.io & Arweave), which fundamentally
                changes how data is stored and managed compared to traditional centralized services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold text-cyan-400 mb-3">2.1 Aircraft Tracking Data</h3>
              <p className="text-slate-300 mb-4">
                DeRadar displays publicly available aircraft tracking information, including:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Aircraft identification codes (ICAO addresses, flight numbers)</li>
                <li>Position data (latitude, longitude, altitude)</li>
                <li>Flight parameters (speed, heading, vertical rate)</li>
                <li>Aircraft type and registration information</li>
                <li>Origin and destination airports</li>
              </ul>
              <p className="text-slate-300 mb-4">
                This data is publicly broadcast by aircraft via ADS-B (Automatic Dependent Surveillance-Broadcast)
                and is collected by community-operated receivers worldwide.
              </p>

              <h3 className="text-xl font-semibold text-cyan-400 mb-3">2.2 Usage Information</h3>
              <p className="text-slate-300 mb-4">
                We may collect anonymous usage statistics through our analytics provider, including:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Page views and navigation patterns</li>
                <li>Browser type and version</li>
                <li>Device information and screen resolution</li>
                <li>Approximate geographic location (country/region level)</li>
                <li>Referral sources</li>
              </ul>

              <h3 className="text-xl font-semibold text-cyan-400 mb-3">2.3 Local Storage</h3>
              <p className="text-slate-300 mb-4">
                The DeRadar application uses browser local storage to save your preferences, including:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Map view settings (position, zoom level)</li>
                <li>Display preferences and filters</li>
                <li>Theme settings (dark/light mode)</li>
                <li>Mini app settings and configurations</li>
              </ul>
              <p className="text-slate-300">
                This data is stored locally on your device and is not transmitted to our servers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Information</h2>
              <p className="text-slate-300 mb-4">We use collected information for the following purposes:</p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Providing real-time and historical aircraft tracking services</li>
                <li>Improving the functionality and performance of DeRadar</li>
                <li>Understanding usage patterns to enhance user experience</li>
                <li>Maintaining and troubleshooting technical issues</li>
                <li>Complying with legal obligations and regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Decentralized Data Storage</h2>
              <p className="text-slate-300 mb-4">
                DeRadar leverages the Arweave network for permanent, decentralized data storage:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>
                  Historical aircraft tracking data is stored on the Arweave blockchain, which is
                  a permanent, immutable, and decentralized storage network
                </li>
                <li>
                  Once data is stored on Arweave, it cannot be deleted or modified - this is a
                  fundamental characteristic of blockchain technology
                </li>
                <li>
                  Data stored on Arweave is publicly accessible and replicated across multiple nodes
                  in the network
                </li>
                <li>
                  We use Ar.io gateways to access and retrieve data from the Arweave network
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-slate-300 mb-4">
                DeRadar does not sell your personal information. We may share data in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>
                  <strong className="text-white">Public Data:</strong> Aircraft tracking data displayed on DeRadar
                  is already publicly available and may be accessed by anyone
                </li>
                <li>
                  <strong className="text-white">Service Providers:</strong> We may share data with trusted third-party
                  service providers who assist in operating our service (e.g., analytics, hosting)
                </li>
                <li>
                  <strong className="text-white">Legal Requirements:</strong> We may disclose information if required
                  by law or to protect the rights and safety of DeRadar, our users, or others
                </li>
                <li>
                  <strong className="text-white">Decentralized Network:</strong> Data stored on Arweave is automatically
                  replicated across the decentralized network and is publicly accessible
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Cookies and Tracking Technologies</h2>
              <p className="text-slate-300 mb-4">
                DeRadar uses minimal cookies and similar technologies:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>
                  <strong className="text-white">Analytics Cookies:</strong> We use analytics tools to understand
                  how visitors use DeRadar
                </li>
                <li>
                  <strong className="text-white">Functional Storage:</strong> Browser local storage is used to
                  remember your preferences
                </li>
              </ul>
              <p className="text-slate-300">
                You can control cookies through your browser settings. However, disabling cookies may limit
                certain functionality of DeRadar.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Data Security</h2>
              <p className="text-slate-300 mb-4">
                We implement reasonable security measures to protect information:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>HTTPS encryption for all data transmission</li>
                <li>Secure hosting infrastructure</li>
                <li>Regular security assessments and updates</li>
                <li>
                  The decentralized nature of Arweave provides additional security through distributed storage
                  and cryptographic verification
                </li>
              </ul>
              <p className="text-slate-300">
                However, no method of transmission or storage is 100% secure. We cannot guarantee absolute
                security of data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Your Rights and Choices</h2>
              <p className="text-slate-300 mb-4">You have the following rights regarding your data:</p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>
                  <strong className="text-white">Access:</strong> Request information about data we hold
                </li>
                <li>
                  <strong className="text-white">Local Data:</strong> Clear your local storage through browser settings
                </li>
                <li>
                  <strong className="text-white">Opt-out:</strong> Disable analytics through browser extensions or settings
                </li>
              </ul>
              <p className="text-slate-300 mb-4">
                <strong className="text-white">Important Note:</strong> Due to the immutable nature of blockchain
                technology, data stored on the Arweave network cannot be deleted or modified once stored.
                This is a fundamental characteristic of decentralized permanent storage.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">9. Children&apos;s Privacy</h2>
              <p className="text-slate-300">
                DeRadar does not knowingly collect information from children under 13 years of age.
                If you believe a child has provided us with personal information, please contact us
                so we can take appropriate action.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">10. International Data Transfers</h2>
              <p className="text-slate-300 mb-4">
                DeRadar operates globally and data may be processed in various countries:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>
                  The Arweave network is distributed across nodes worldwide, meaning data may be
                  stored and accessed from multiple jurisdictions
                </li>
                <li>
                  We ensure appropriate safeguards are in place when transferring data internationally
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">11. Third-Party Services</h2>
              <p className="text-slate-300 mb-4">
                DeRadar integrates with third-party services and links:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Arweave blockchain network</li>
                <li>Ar.io gateway services</li>
                <li>Analytics providers</li>
                <li>External mini apps (SkyQuery etc.)</li>
              </ul>
              <p className="text-slate-300">
                These third parties have their own privacy policies. We are not responsible for their
                privacy practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-slate-300">
                We may update this Privacy Policy from time to time. Changes will be posted on this page
                with an updated &quot;Last updated&quot; date. We encourage you to review this policy
                periodically. Continued use of DeRadar after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">13. Contact Us</h2>
              <p className="text-slate-300 mb-4">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-slate-300 mb-2">
                  <strong className="text-white">Derad Network</strong>
                </p>
                <p className="text-slate-300 mb-2">
                  Website:{" "}
                  <a
                    href="https://deradar.derad.network"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    deradar.derad.network
                  </a>
                </p>
                <p className="text-slate-300">
                  GitHub:{" "}
                  <a
                    href="https://github.com/deradnet"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    github.com/deradnet
                  </a>
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">14. Legal Basis for Processing (GDPR)</h2>
              <p className="text-slate-300 mb-4">
                For users in the European Economic Area (EEA), we process personal data based on:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>
                  <strong className="text-white">Legitimate Interest:</strong> Operating and improving DeRadar service
                </li>
                <li>
                  <strong className="text-white">Consent:</strong> When you accept cookies or voluntarily provide information
                </li>
                <li>
                  <strong className="text-white">Legal Obligation:</strong> When required to comply with applicable laws
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">15. Acceptance of This Policy</h2>
              <p className="text-slate-300">
                By using DeRadar, you acknowledge that you have read and understood this Privacy Policy
                and agree to its terms. If you do not agree with this policy, please do not use DeRadar.
              </p>
            </section>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to DeRadar
          </Link>
        </div>
      </div>
    </div>
  );
}
