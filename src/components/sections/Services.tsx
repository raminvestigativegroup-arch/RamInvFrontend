import React from 'react';
import { RevealWrapper } from '../utils/RevealWrapper';

export default function Services() {
  const servicesList = [
    {
      title: "Security Guard Services",
      desc: "Armed and unarmed officers for fixed posts, lobbies, and perimeters — supervised on every shift.",
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>
    },
    {
      title: "Mobile Patrol",
      desc: "Marked vehicle patrols with randomized routes, GPS-stamped checkpoints, and photo verification.",
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 16V11l2-5h9l3 5h3v5" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>
    },
    {
      title: "Private Investigation",
      desc: "Licensed investigators for surveillance, due diligence, fraud, and workplace misconduct cases.",
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="6" /><path d="M15.5 15.5L21 21" /></svg>
    },
    {
      title: "Executive Protection",
      desc: "Discreet close protection and secure transport for leadership, boards, and visiting delegations.",
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.2" /><path d="M5 20c0-3.4 3.1-5.5 7-5.5s7 2.1 7 5.5" /></svg>
    },
    {
      title: "Construction Security",
      desc: "Material theft prevention, access logs, and after-hours coverage for active job sites.",
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13a8 8 0 0116 0" /><path d="M3 13h18v3H3z" /><path d="M12 5V3" /></svg>
    },
    {
      title: "Fire Watch",
      desc: "Code-compliant fire watch during system outages, hot work, and impairment periods.",
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c3 4 5 6 5 9a5 5 0 01-10 0c0-3 2-5 5-9z" /><path d="M12 20v1" /></svg>
    },
    {
      title: "Event Security",
      desc: "Crowd management, credentialing, and screening for corporate and public events.",
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8a2 2 0 002-2h12a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H6a2 2 0 00-2-2v-2a2 2 0 000-4z" /><path d="M12 8v8" /></svg>
    },
    {
      title: "Alarm Response",
      desc: "Verified on-site response to alarm activations, with written disposition on every call.",
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 16V11a6 6 0 10-12 0v5l-2 2h16z" /><path d="M10 21h4" /></svg>
    },
    {
      title: "Loss Prevention",
      desc: "Retail shrink reduction through uniformed deterrence, plainclothes coverage, and reporting.",
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" /><circle cx="12" cy="12" r="2.6" /></svg>
    },
    {
      title: "Access Control",
      desc: "Staffed entry points, visitor management, badge auditing, and contractor screening.",
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 118 0v3" /><path d="M12 14v2" /></svg>
    }
  ];

  return (
    <section id="services" style={{ padding: 'clamp(80px,9vw,132px) 32px', background: '#fff', scrollMarginTop: '90px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <RevealWrapper>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '32px', alignItems: 'end', marginBottom: '56px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)' }}>Services</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(34px,3.4vw,48px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#0A2342', margin: '16px 0 0', maxWidth: '620px', textWrap: 'balance' }}>
                A complete security program, staffed and supervised end to end.
              </h2>
            </div>
            <p style={{ fontSize: '16.5px', lineHeight: 1.65, color: '#3F4A5A', margin: 0, maxWidth: '440px', justifySelf: 'end' }}>
              Every assignment is scoped by a licensed supervisor, deployed with vetted officers, and monitored from our 24/7 operations center.
            </p>
          </div>
        </RevealWrapper>

        {/* Services Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(292px,1fr))', gap: '20px' }}>
          {servicesList.map((srv, idx) => (
            <RevealWrapper key={srv.title} delay={idx * 30}>
              <div className="service-card-lift">
                <span style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(10,35,66,0.06)', color: '#0A2342', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {srv.icon}
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '20px', color: '#0A2342', margin: '20px 0 8px' }}>{srv.title}</h3>
                <p style={{ fontSize: '14.5px', lineHeight: 1.6, color: '#3F4A5A', margin: '0 0 18px' }}>{srv.desc}</p>
                <a href="#contact" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '13.5px', fontWeight: 600, color: '#0A2342' }}>
                  Learn more <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
                </a>
              </div>
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}
