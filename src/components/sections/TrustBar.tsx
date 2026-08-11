import React from 'react';

export default function TrustBar() {
  return (
    <section style={{ padding: '40px 32px', borderTop: '1px solid #EEF2F7', borderBottom: '1px solid #EEF2F7', background: '#fff' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'clamp(24px,4vw,56px)', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6B7684', flex: '0 0 auto' }}>Trusted across</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'clamp(20px,3.5vw,48px)' }}>
          {['Commercial', 'Healthcare', 'Construction', 'Retail', 'Industrial', 'Government'].map(sector => (
            <span key={sector} style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '17px', color: '#0A2342', opacity: .62 }}>{sector}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
