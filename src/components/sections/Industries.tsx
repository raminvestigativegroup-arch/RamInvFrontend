import React from 'react';
import { RevealWrapper } from '../utils/RevealWrapper';

export default function Industries() {
  const industriesList = [
    {
      name: "Healthcare",
      desc: "De-escalation, ER coverage, HIPAA-aware protocols",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A2342" strokeWidth="1.75" strokeLinecap="round"><path d="M12 7v10M7 12h10" /><rect x="3" y="3" width="18" height="18" rx="3" /></svg>
    },
    {
      name: "Retail",
      desc: "Shrink control, ORC deterrence, mall coverage",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A2342" strokeWidth="1.75" strokeLinecap="round"><path d="M4 6h16l-1.6 9H6.6z" /><circle cx="9" cy="19" r="1.4" /><circle cx="17" cy="19" r="1.4" /></svg>
    },
    {
      name: "Commercial",
      desc: "Lobby ambassadors, tenant services, after hours",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A2342" strokeWidth="1.75" strokeLinecap="round"><path d="M4 21V6l8-3v18" /><path d="M12 10h8v11" /><path d="M7 9h2M7 13h2M16 14h2" /></svg>
    },
    {
      name: "Construction",
      desc: "Copper & equipment theft, access logs, night watch",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A2342" strokeWidth="1.75" strokeLinecap="round"><path d="M4 20V8l10-3v3" /><path d="M14 8h6v12" /><path d="M4 20h16" /></svg>
    },
    {
      name: "Industrial",
      desc: "Gate control, safety escorts, contractor screening",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A2342" strokeWidth="1.75" strokeLinecap="round"><path d="M3 20V11l5 3V11l5 3V7l8 4v9z" /></svg>
    },
    {
      name: "Education",
      desc: "Campus patrol, event coverage, visitor screening",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A2342" strokeWidth="1.75" strokeLinecap="round"><path d="M4 6h7v13H4z" /><path d="M13 6h7v13h-7z" /><path d="M4 19h16" /></svg>
    },
    {
      name: "Residential",
      desc: "Gatehouse staffing, HOA patrol, concierge security",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A2342" strokeWidth="1.75" strokeLinecap="round"><path d="M4 11l8-6 8 6" /><path d="M6 11v9h12v-9" /></svg>
    },
    {
      name: "Government",
      desc: "Cleared officers, screening posts, audit reporting",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A2342" strokeWidth="1.75" strokeLinecap="round"><path d="M3 20h18" /><path d="M5 20V9M9 20V9M15 20V9M19 20V9" /><path d="M3 9l9-5 9 5" /></svg>
    },
    {
      name: "Warehousing",
      desc: "Dock supervision, trailer seals, inventory integrity",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A2342" strokeWidth="1.75" strokeLinecap="round"><path d="M3 8l9-4 9 4v12H3z" /><path d="M9 20v-7h6v7" /></svg>
    },
    {
      name: "Hospitality",
      desc: "Guest safety, night audit support, event control",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A2342" strokeWidth="1.75" strokeLinecap="round"><path d="M3 17v-4a3 3 0 013-3h12a3 3 0 013 3v4" /><path d="M3 17h18v3H3z" /><path d="M7 10V7h10v3" /></svg>
    }
  ];

  return (
    <section id="industries" style={{ padding: 'clamp(80px,9vw,132px) 32px', background: '#fff', scrollMarginTop: '90px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <RevealWrapper>
          <div style={{ maxWidth: '620px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)' }}>Industries</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(34px,3.4vw,48px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#0A2342', margin: '16px 0 0', textWrap: 'balance' }}>
              Programs built for the risk profile of your sector.
            </h2>
          </div>
        </RevealWrapper>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(228px,1fr))', gap: '16px', marginTop: '48px' }}>
          {industriesList.map((ind, idx) => (
            <RevealWrapper key={ind.name} delay={idx * 20}>
              <div className="industry-card-lift">
                {ind.icon}
                <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '16.5px', color: '#0A2342', marginTop: '16px' }}>{ind.name}</span>
                <span style={{ display: 'block', fontSize: '13px', color: '#6B7684', marginTop: '6px' }}>{ind.desc}</span>
              </div>
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}
