import React from 'react';
import { RevealWrapper } from '../utils/RevealWrapper';

export default function Process() {
  const steps = [
    { num: "01", title: "Consultation", desc: "A licensed manager scopes risk, hours, and coverage needs — no cost." },
    { num: "02", title: "Site assessment", desc: "On-site walkthrough documenting vulnerabilities, lighting, and access points." },
    { num: "03", title: "Custom security plan", desc: "Written post orders, staffing model, and escalation tree built for your site." },
    { num: "04", title: "Guard deployment", desc: "Vetted officers matched to the post, briefed and supervised from day one." },
    { num: "05", title: "Live monitoring", desc: "GPS check-ins and dispatch oversight on every shift, around the clock." },
    { num: "06", title: "Continuous reporting", desc: "Daily activity logs, incident reports, and quarterly program reviews." }
  ];

  return (
    <section style={{ padding: 'clamp(80px,9vw,132px) 32px', background: '#F8FAFC', borderTop: '1px solid #EEF2F7', borderBottom: '1px solid #EEF2F7' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <RevealWrapper>
          <div style={{ maxWidth: '620px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)' }}>Process</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(34px,3.4vw,48px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#0A2342', margin: '16px 0 0', textWrap: 'balance' }}>
              From first call to continuous reporting in six steps.
            </h2>
          </div>
        </RevealWrapper>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '20px', marginTop: '52px' }}>
          {steps.map((p, idx) => (
            <RevealWrapper key={p.num} delay={idx * 30}>
              <div className="process-card">
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', letterSpacing: '0.06em', color: 'var(--accent)' }}>{p.num}</span>
                <span className="process-title" style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '18px', marginTop: '12px' }}>{p.title}</span>
                <p className="process-desc" style={{ fontSize: '13.5px', lineHeight: 1.6, margin: '8px 0 0' }}>{p.desc}</p>
              </div>
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}
