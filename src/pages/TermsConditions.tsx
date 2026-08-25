import React, { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function TermsConditions() {
  // Scroll to top when loading this page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as any });
  }, []);

  return (
    <div className="landing-page-theme" style={{ fontFamily: 'var(--font-body)', color: '#1F2937', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* Page Hero */}
      <section style={{ background: 'linear-gradient(135deg, #071A31 0%, #0d284a 100%)', padding: '80px 32px 64px', color: '#fff', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Terms &amp; Conditions
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', fontWeight: 500 }}>
            Last Updated: August 25, 2026
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main style={{ flex: '1 0 auto', maxWidth: '864px', width: '100%', margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', lineHeight: 1.65, fontSize: '15px', color: '#4B5563' }}>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#071A31', marginBottom: '16px' }}>1. Acceptance of Terms</h2>
            <p style={{ marginBottom: '12px' }}>
              By downloading, installing, or using the SecurePro mobile application (the "App") developed and operated by RAM Investigative Group Inc. ("RAM", "we", "us", or "our"), you agree to be bound by these Terms &amp; Conditions ("Terms"). If you do not agree to these Terms, do not use the App.
            </p>
            <p>
              These Terms apply to all users of the App, including security guards, field managers, and any other personnel authorized by RAM to access the platform. Use of the App is limited to authorized employees and contractors of RAM Investigative Group Inc.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#071A31', marginBottom: '16px' }}>2. Description of Service</h2>
            <p style={{ marginBottom: '12px' }}>
              The SecurePro mobile application provides the following professional security management services:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Shift Management:</strong> View assigned schedules, clock in and out of shifts, and receive real-time schedule updates.</li>
              <li><strong>Location Tracking:</strong> Submit GPS-based location data during active patrol shifts for supervisor oversight and operational safety.</li>
              <li><strong>Incident Reporting:</strong> Document and submit incident reports including text descriptions, photographs, and time-stamped metadata.</li>
              <li><strong>Compliance Documentation:</strong> Upload and manage required professional documents such as security licenses, state IDs, and training certifications.</li>
              <li><strong>Push Notifications:</strong> Receive operational alerts, schedule changes, and critical incident notifications in real-time.</li>
              <li><strong>Account Management:</strong> Update your personal profile, change passwords, and manage your account settings.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#071A31', marginBottom: '16px' }}>3. Account Registration and Security</h2>
            <p style={{ marginBottom: '12px' }}>
              Access to the App requires an account created and provisioned by RAM Investigative Group Inc. administration. By using your account, you agree to:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Keep your login credentials strictly confidential and not share your password with any other person.</li>
              <li>Notify your manager or system administrator immediately if you suspect unauthorized access to your account.</li>
              <li>Use the App only on devices you personally own or control, and only for legitimate professional duties.</li>
              <li>Accept that your account is personal and non-transferable; you may not allow others to use your credentials.</li>
              <li>Understand that RAM Investigative Group Inc. reserves the right to disable your account at any time if any Terms are breached.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#071A31', marginBottom: '16px' }}>4. Location Data and Monitoring</h2>
            <p style={{ marginBottom: '12px' }}>
              When you use the App during an active shift, the App collects your GPS location data. You acknowledge and agree that:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Location tracking is an essential part of the security guard operations platform and is required for active shifts.</li>
              <li>Your location data is transmitted securely to RAM's servers and is only accessible to authorized managers and administrators.</li>
              <li>Location data is used exclusively for operational purposes including shift verification, patrol monitoring, and incident response.</li>
              <li>You have granted the App location permissions in your device settings. Revoking these permissions may prevent the App from functioning correctly during active shifts.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#071A31', marginBottom: '16px' }}>5. Acceptable Use Policy</h2>
            <p style={{ marginBottom: '12px' }}>
              You agree to use the App only for its intended professional purposes. The following activities are strictly prohibited:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Submitting false, fraudulent, or misleading incident reports, attendance records, or location data.</li>
              <li>Attempting to bypass, reverse-engineer, or tamper with the App's security mechanisms, APIs, or authentication systems.</li>
              <li>Uploading content that is defamatory, obscene, hateful, or in violation of applicable laws.</li>
              <li>Using the App to collect information about other users without authorization.</li>
              <li>Interfering with or disrupting the integrity, performance, or availability of the App or its backend services.</li>
              <li>Clocking in or submitting attendance records while not physically present at the assigned post or site.</li>
            </ul>
            <p>
              Violations of this Acceptable Use Policy may result in immediate account suspension, termination of employment, or legal action as appropriate.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#071A31', marginBottom: '16px' }}>6. Account Deletion</h2>
            <p style={{ marginBottom: '12px' }}>
              You may request deletion of your mobile account at any time through the App settings. Upon deletion, the following will occur:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Your account will be soft-deleted from the system; your operational history (schedules, incidents, attendance logs) is retained for compliance and audit purposes as required by law.</li>
              <li>All active login sessions and push notification tokens will be immediately invalidated.</li>
              <li>Your email address and phone number will be anonymized so they can be used for future account registrations.</li>
              <li><strong>Accounts with active or upcoming schedule assignments cannot be deleted.</strong> Contact your manager to remove you from active schedules before requesting deletion.</li>
              <li>Managers assigned to active sites cannot delete their accounts until the site assignment is resolved by an administrator.</li>
            </ul>
            <p>
              Account deletion is permanent and cannot be undone. If you wish to regain access after deletion, a new account must be provisioned by RAM administration.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#071A31', marginBottom: '16px' }}>7. Push Notifications</h2>
            <p>
              By using the App, you consent to receiving push notifications for operational alerts including shift assignments, schedule changes, incident escalations, and other security operations communications. You may manage notification preferences within your device settings. Disabling notifications may impact your ability to receive time-sensitive operational updates and may affect job performance.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#071A31', marginBottom: '16px' }}>8. Intellectual Property</h2>
            <p>
              The SecurePro App and all its original content, features, functionality, and underlying software are and will remain the exclusive property of RAM Investigative Group Inc. You may not copy, modify, distribute, sell, or lease any part of the App or its content without explicit written consent from RAM Investigative Group Inc.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#071A31', marginBottom: '16px' }}>9. Disclaimer of Warranties</h2>
            <p style={{ marginBottom: '12px' }}>
              The App is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. RAM Investigative Group Inc. does not warrant that:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>The App will be uninterrupted, error-free, or free of viruses or other harmful components.</li>
              <li>The information provided through the App is accurate, complete, or current at all times.</li>
              <li>Any defects in the App will be corrected within a specific timeframe.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#071A31', marginBottom: '16px' }}>10. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, RAM Investigative Group Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the App, including but not limited to data loss, service interruptions, or unauthorized access to your account resulting from your failure to maintain credential security.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#071A31', marginBottom: '16px' }}>11. Modifications to Terms</h2>
            <p>
              RAM Investigative Group Inc. reserves the right to modify these Terms at any time. When we make material changes, we will update the "Last Updated" date at the top of this page and, where appropriate, notify users via push notification or in-app message. Your continued use of the App following any changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#071A31', marginBottom: '16px' }}>12. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the State of New York, United States, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved exclusively in the state or federal courts located in Nassau or Suffolk County, New York.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#071A31', marginBottom: '16px' }}>13. Contact Us</h2>
            <p style={{ marginBottom: '12px' }}>
              If you have questions, concerns, or requests relating to these Terms &amp; Conditions, please contact us:
            </p>
            <div style={{ background: '#F9FAFB', borderLeft: '4px solid #071A31', padding: '16px 20px', borderRadius: '0 8px 8px 0', fontSize: '14px', color: '#374151' }}>
              <strong style={{ display: 'block', color: '#071A31', marginBottom: '4px' }}>RAM Investigative Group Inc.</strong>
              <span>22 Argyle Square Babylon, N.Y. 11702</span><br />
              <span>Email: <a href="mailto:Patrick@RamInvestigation.com" style={{ color: '#0056b3', textDecoration: 'underline' }}>Patrick@RamInvestigation.com</a></span><br />
              <span>Phone: (631) 314-4180 (Office) / (631) 766-4676 (Cell)</span>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
