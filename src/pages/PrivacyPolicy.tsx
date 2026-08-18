import React, { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', fontWeight: 500 }}>
            Last Updated: August 6, 2026
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main style={{ flex: '1 0 auto', maxWidth: '864px', width: '100%', margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', lineHeight: 1.65, fontSize: '15px', color: '#4B5563' }}>
          
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#071A31', marginBottom: '16px' }}>1. Introduction</h2>
            <p style={{ marginBottom: '12px' }}>
              Welcome to RAM Investigative Group Inc. ("RAM", "we", "us", or "our"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy describes how we collect, use, and share your personal information when you use our website, landing page, and professional security services.
            </p>
            <p>
              By accessing our website or utilizing our guard management and investigative services, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#071A31', marginBottom: '16px' }}>2. Information We Collect</h2>
            <p style={{ marginBottom: '12px' }}>
              We collect several types of information from and about users of our services, including:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Personal Identification Information:</strong> Name, work email address, telephone number, and company name when you request a free consultation or contact us.</li>
              <li><strong>Usage Data:</strong> Information about your website visit, including your IP address, browser type, referral source, pages viewed, and page response times.</li>
              <li><strong>Operational Security Data:</strong> For contracted guard operations, this includes schedule logs, guard location coordinates during patrols, check-in photos, and incident reports.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#071A31', marginBottom: '16px' }}>3. How We Use Your Information</h2>
            <p style={{ marginBottom: '12px' }}>
              We use the information we collect for various operational and analytical purposes:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>To schedule, coordinate, and deliver on-site guard and patrol operations.</li>
              <li>To respond to your consultation requests, answer inquiries, and provide customized security proposals.</li>
              <li>To verify guard locations, dispatch alerts, and compile incident logs.</li>
              <li>To maintain website performance, improve user experience, and analyze anonymous visitor metrics.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#071A31', marginBottom: '16px' }}>4. Security of Data</h2>
            <p>
              The security of your data is of paramount importance to us. We implement appropriate technical and organizational measures—including secure HTTPS data transit, strict token-based authentication gates, and restricted database layers—to safeguard your information against unauthorized access, alteration, or disclosure. However, please remember that no method of transmission over the Internet or electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#071A31', marginBottom: '16px' }}>5. Third-Party Service Providers</h2>
            <p>
              We may employ third-party companies and individuals to facilitate our services (such as SMTP mail delivery servers or cloud storage). These third parties have access to your personal information only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#071A31', marginBottom: '16px' }}>6. Contact Us</h2>
            <p style={{ marginBottom: '12px' }}>
              If you have any questions or feedback regarding this Privacy Policy, please contact our privacy compliance team:
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
