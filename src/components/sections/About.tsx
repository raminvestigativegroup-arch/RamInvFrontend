import React from 'react';
import { RevealWrapper } from '../utils/RevealWrapper';

const STRUCTURE = [
  { t: "24/7 Operations Center", d: "Coordinates security assignments, staffing, scheduling, and operational communications." },
  { t: "Dedicated Management", d: "Supervises assigned personnel and maintains communication with clients." },
  { t: "Field Supervision", d: "Ensures personnel follow post orders, client requirements, and company standards." },
  { t: "Incident Reporting", d: "Documents suspicious activity, security concerns, emergencies, and significant events." },
  { t: "Executive Oversight", d: "Maintains accountability through our New York headquarters and leadership team." }
];

export default function About() {
  return (
    <section id="about" style={{ padding: 'clamp(80px,9vw,132px) 32px', background: 'linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 100%)', borderTop: '1px solid #EEF2F7', scrollMarginTop: '90px' }}>
      <div style={{ maxWidth: 'var(--container-max, 1280px)', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))', gap: 'clamp(32px,5vw,72px)', alignItems: 'start' }}>
          {/* Left — company overview and mission */}
          <RevealWrapper>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)' }}>About R.I.G.</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(34px,3.4vw,48px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#0A2342', margin: '16px 0 0', maxWidth: '720px', textWrap: 'balance' }}>
                Professional security, investigations &amp; executive protection.
              </h2>
              <p style={{ fontSize: '16.5px', lineHeight: 1.65, color: '#3F4A5A', margin: '20px 0 0', maxWidth: '720px' }}>
                Ram Investigative Group Inc. (R.I.G.) is a professional security and private investigative firm headquartered in Babylon, New York. We provide comprehensive security solutions, investigative services, and executive protection to businesses, corporations, organizations, and private individuals throughout New York and across the United States through our established network of security professionals and licensed partners.
              </p>
              <p style={{ fontSize: '16.5px', lineHeight: 1.65, color: '#3F4A5A', margin: '16px 0 0', maxWidth: '720px' }}>
                Our company is built on a foundation of law enforcement experience, professionalism, operational accountability, and client-focused service. Rather than relying on a one-size-fits-all approach, we assess each assignment, identify appropriate personnel, establish clear operating procedures, and maintain management oversight throughout the engagement.
              </p>

              <div style={{ marginTop: '32px', maxWidth: '720px', padding: '22px 24px', borderLeft: '3px solid var(--accent)', background: '#fff', borderRadius: '0 14px 14px 0', boxShadow: 'var(--shadow-card)' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B7684' }}>Our Mission</span>
                <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#1F2937', fontWeight: 500, margin: '10px 0 0' }}>
                  To deliver professional, reliable, and accountable security services that protect our clients, their people, and their assets while establishing long-term relationships built on trust and performance.
                </p>
              </div>
            </div>
          </RevealWrapper>

          {/* Right — operational structure */}
          <RevealWrapper delay={60}>
            <div style={{ background: '#fff', border: '1px solid #E6EBF2', borderRadius: '20px', padding: 'clamp(24px,3vw,32px)', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden' }}>
              <span style={{ position: 'absolute', inset: '0 0 auto', height: '3px', background: 'var(--gradient-brand)' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B7684' }}>Our Operational Structure</span>
              <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#3F4A5A', margin: '12px 0 0' }}>
                What separates R.I.G. from a traditional security guard company is centralized operational oversight and accountability.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '24px' }}>
                {STRUCTURE.map((item, idx) => (
                  <div key={item.t} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <span style={{ flex: '0 0 auto', width: '30px', height: '30px', borderRadius: '9px', background: 'rgba(10,35,66,0.06)', color: '#0A2342', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '12.5px' }}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '16.5px', color: '#0A2342' }}>{item.t}</span>
                      <span style={{ display: 'block', fontSize: '14px', lineHeight: 1.55, color: '#3F4A5A', marginTop: '3px' }}>{item.d}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ height: '1px', background: '#EEF2F7', margin: '26px 0 22px' }} />
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '17px', lineHeight: 1.5, fontWeight: 600, color: '#0A2342', margin: 0 }}>
                “We don't just place security guards at locations. We manage the security operation and remain accountable for its performance.”
              </p>
            </div>
          </RevealWrapper>
        </div>
      </div>
    </section>
  );
}
