import React from 'react';
import { Button } from '../DesignSystem';
import { Counter } from '../Counter';

interface HeroProps {
  animateCounters?: boolean;
}

export default function Hero({ animateCounters = true }: HeroProps) {
  return (
    <section id="top" style={{
      position: 'relative',
      background: 'radial-gradient(1100px 620px at 12% -12%,rgba(30,58,95,0.12),transparent 62%),radial-gradient(900px 520px at 96% 4%,rgba(212,175,55,0.13),transparent 60%),linear-gradient(180deg,#FFFFFF 0%,#F8FAFC 100%)',
      padding: 'clamp(32px,4vw,64px) 32px clamp(48px,5vw,80px)',
      scrollMarginTop: '78px',
      overflow: 'hidden'
    }}>
      {/* 2-column hero: text left, image right — both visible on first paint */}
      <div className="hero-grid" style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* Left — text content */}
        <div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', padding: '7px 14px 7px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(10,35,66,0.10)', backdropFilter: 'blur(10px)', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.02em', color: '#0A2342', boxShadow: '0 2px 10px rgba(10,35,66,.05)' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '999px', background: '#16A34A', animation: 'ramPulse 2.4s ease-out infinite' }} />
            Licensed · Bonded · Insured — 24/7 Dispatch Active
          </span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(36px,3.8vw,60px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: '#0A2342', margin: '20px 0 0', textWrap: 'balance' }}>
            Protecting People, Property &amp; Businesses with Confidence.
          </h1>
          <p style={{ fontSize: 'clamp(16px,1.2vw,18px)', lineHeight: 1.62, color: '#3F4A5A', margin: '20px 0 0', textWrap: 'pretty' }}>
            Professional security guards, mobile patrol, investigative services, and workforce management solutions backed by modern technology.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '28px' }}>
            <Button size="lg" onClick={() => document.getElementById('contact')?.scrollIntoView()}>
              Request a Free Consultation
            </Button>
            <Button variant="outline" size="lg" onClick={() => document.getElementById('services')?.scrollIntoView()}>
              Explore Services
            </Button>
          </div>
          {/* Stat Counters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginTop: '36px', paddingTop: '28px', borderTop: '1px solid rgba(10,35,66,0.10)' }}>
            {[
              ['500+', 'Security professionals'],
              ['100+', 'Protected sites'],
              ['24/7', 'Live monitoring'],
              ['15+', 'Years experience']
            ].map(([val, label]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {animateCounters && val !== '24/7' ? (
                  <Counter value={val} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px', color: '#0A2342', lineHeight: 1 }} />
                ) : (
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px', color: '#0A2342', lineHeight: 1 }}>{val}</span>
                )}
                <span style={{ fontSize: '12px', color: '#6B7684' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — hero image, always visible, correct 3:2 ratio for 1536×1024 PNG */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '3 / 2', borderRadius: '24px', overflow: 'hidden', background: '#071A31', boxShadow: '0 40px 80px rgba(10,35,66,0.22)' }}>
          {/* Direct img — bypasses async state-file fetch for guaranteed render */}
          <img
            src="/d80e41119df43c738b0498a948f1af8a0a68287c1810a51d1567cfbeae5a5e3a.png"
            alt="RAM Investigative Group security officer on patrol at a commercial building"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,rgba(7,26,49,0.35) 0%,rgba(7,26,49,0.0) 50%,rgba(7,26,49,0.40) 100%)', pointerEvents: 'none' }} />
        </div>
      </div>
    </section>
  );
}
