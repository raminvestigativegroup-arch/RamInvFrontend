import React from 'react';
import { RevealWrapper } from '../utils/RevealWrapper';
import { Counter } from '../Counter';

interface StatsDividerProps {
  animateCounters?: boolean;
}

export default function StatsDivider({ animateCounters = true }: StatsDividerProps) {
  const statsList = [
    { label: "Security professionals", val: "500+" },
    { label: "Protected sites", val: "100+" },
    { label: "Monitoring & dispatch", val: "24/7", static: true },
    { label: "Client satisfaction", val: "99%" },
    { label: "Years experience", val: "15+" }
  ];

  return (
    <section style={{ padding: 'clamp(72px,8vw,110px) 32px', background: '#fff' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '24px' }}>
        {statsList.map((item, idx) => (
          <RevealWrapper key={item.label} delay={idx * 30}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '20px', borderLeft: '2px solid rgba(212,175,55,.5)' }}>
              {animateCounters && !item.static ? (
                <Counter value={item.val} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(38px,3.6vw,50px)', color: '#0A2342', lineHeight: 1 }} />
              ) : (
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(38px,3.6vw,50px)', color: '#0A2342', lineHeight: 1 }}>{item.val}</span>
              )}
              <span style={{ fontSize: '14px', color: '#6B7684' }}>{item.label}</span>
            </div>
          </RevealWrapper>
        ))}
      </div>
    </section>
  );
}
