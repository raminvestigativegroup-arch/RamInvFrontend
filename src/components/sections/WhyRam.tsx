import React, { useState } from 'react';
import { RevealWrapper } from '../utils/RevealWrapper';

const FEATURES = [
  {
    t: "Licensed Professionals",
    d: "Every officer is state-licensed, background-checked, drug-screened, and trained on your site's post orders before their first shift.",
    p: ["License and certification file per officer", "Post-order acknowledgement signatures", "Annual refresher training records"]
  },
  {
    t: "24/7 Dispatch",
    d: "A staffed operations center answers in under 60 seconds, day or night, and escalates by your rules — not a voicemail box.",
    p: ["Named escalation contacts by severity", "Sub-60-second answer target", "Shift-change coverage guarantee"]
  },
  {
    t: "GPS Tracking",
    d: "Patrol vehicles and officers report live position and checkpoint completion, so coverage is a fact rather than an assumption.",
    p: ["Live map of active units", "Timestamped checkpoint history", "Missed-checkpoint alerting"]
  },
  {
    t: "Live Incident Reporting",
    d: "Officers file structured incident reports from the mobile app while on scene, with photos and timestamps attached automatically.",
    p: ["Structured report per incident type", "Attached media and GPS stamp", "Same-shift delivery to your inbox"]
  },
  {
    t: "Digital Compliance",
    d: "Licensing, insurance, and training documentation stays current and audit-ready in one place — exportable whenever procurement asks.",
    p: ["Expiry tracking on all credentials", "Certificate of insurance on demand", "Audit-ready export in one click"]
  },
  {
    t: "Photo Verification",
    d: "Check-ins and closing rounds require geo-tagged photos, giving you visual proof of presence and site condition.",
    p: ["Geo-tagged photo per checkpoint", "Before/after condition capture", "Tamper-evident timestamps"]
  },
  {
    t: "Analytics Dashboard",
    d: "Trends across attendance, incidents, and response time show where risk is concentrating and where hours can be reallocated.",
    p: ["Attendance and punctuality trends", "Incident heat by site and hour", "Quarterly program review deck"]
  }
];

export default function WhyRam() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section id="about" style={{ padding: 'clamp(80px,9vw,132px) 32px', background: 'linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 100%)', borderTop: '1px solid #EEF2F7', scrollMarginTop: '90px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <RevealWrapper>
          <div style={{ maxWidth: '660px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)' }}>Why RAM</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(34px,3.4vw,48px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#0A2342', margin: '16px 0 0', textWrap: 'balance' }}>
              Accountability you can audit, not just promises.
            </h2>
            <p style={{ fontSize: '16.5px', lineHeight: 1.65, color: '#3F4A5A', margin: '20px 0 0' }}>
              Select a capability to see how it works on the ground and what your team receives in reporting.
            </p>
          </div>
        </RevealWrapper>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: '32px', marginTop: '48px', alignItems: 'start' }}>
          {/* Tabs List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {FEATURES.map((feat, index) => {
              const isActive = activeFeature === index;
              return (
                <button
                  key={feat.t}
                  type="button"
                  onClick={() => setActiveFeature(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    padding: '16px 18px',
                    borderRadius: '12px',
                    border: isActive ? '1px solid rgba(10,35,66,.18)' : '1px solid transparent',
                    background: isActive ? '#fff' : 'transparent',
                    boxShadow: isActive ? '0 8px 24px rgba(10,35,66,.08)' : 'none',
                    color: isActive ? '#0A2342' : '#3F4A5A',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: '17px',
                    transition: 'background .25s, box-shadow .25s, color .25s, border-color .25s'
                  }}
                >
                  <span>{feat.t}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    style={{
                      opacity: isActive ? 1 : 0.35,
                      color: isActive ? 'var(--accent)' : 'currentColor',
                      transition: 'color 0.2s, opacity 0.2s'
                    }}
                  >
                    <path d="M5 12h13M13 6l6 6-6 6" />
                  </svg>
                </button>
              );
            })}
          </div>

          {/* Tab Pane Display */}
          <div style={{ background: '#fff', border: '1px solid #E6EBF2', borderRadius: '20px', padding: '32px', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', inset: '0 0 auto', height: '3px', background: 'var(--gradient-brand)' }} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '999px', background: 'rgba(10,35,66,0.06)', fontSize: '12px', fontWeight: 600, color: '#0A2342' }}>
              {FEATURES[activeFeature].t}
            </span>
            <p style={{ fontSize: '17px', lineHeight: 1.6, color: '#1F2937', margin: '20px 0 0', fontWeight: 500 }}>
              {FEATURES[activeFeature].d}
            </p>
            
            <div style={{ height: '1px', background: '#EEF2F7', margin: '26px 0' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B7684' }}>What you receive</span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {FEATURES[activeFeature].p.map((proof, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ flex: '0 0 auto', width: '20px', height: '20px', borderRadius: '999px', background: 'rgba(22,163,74,.12)', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" style={{ margin: 'auto' }}>
                      <path d="M5 13l4 4 10-10" />
                    </svg>
                  </span>
                  <span style={{ fontSize: '14.5px', lineHeight: 1.5, color: '#3F4A5A' }}>{proof}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
