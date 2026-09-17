import React from 'react';
import { RevealWrapper } from '../utils/RevealWrapper';
import { ImageSlot } from '../ImageSlot';

const TESTIMONIALS = [
  {
    slotId: 'ram-t1',
    quote: 'Copper theft on our downtown build dropped to zero in the first month. The nightly photo logs are what finally satisfied our insurer.',
    name: 'Marcus Delgado',
    role: 'Project Director, Halewood Construction',
  },
  {
    slotId: 'ram-t2',
    quote: 'Their officers de-escalate instead of escalate. Our ED incident reports are cleaner and our nursing staff actually feel supported.',
    name: 'Dr. Alina Vaziri',
    role: 'VP Operations, Meridian Health Network',
  },
  {
    slotId: 'ram-t3',
    quote: 'The client dashboard replaced a monthly PDF nobody trusted. I can pull an audit trail for any post, any hour, in seconds.',
    name: 'Grant Whitfield',
    role: 'Director of Asset Protection, Northline Retail',
  },
  {
    slotId: 'ram-t4',
    quote: 'We run three shifts across two distribution centers. RAM filled every post for eleven months straight — no last-minute scrambling, no unbilled gaps.',
    name: 'Priya Raghunathan',
    role: 'Regional Logistics Manager, Castlebridge Supply',
  },
  {
    slotId: 'ram-t5',
    quote: 'Campus security is half presence, half judgment. Their team knows which calls need a report and which need a conversation — that distinction matters to our students.',
    name: 'Teresa Okonjo',
    role: 'Dean of Campus Safety, Warrenfield College',
  },
  {
    slotId: 'ram-t6',
    quote: 'Two after-hours incidents last quarter, both handled before our on-call manager reached the building. Resident complaints about the garage are down to none.',
    name: 'Sean Mulvaney',
    role: 'Head of Property Operations, Corbin & Vale Residential',
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" style={{ padding: 'clamp(80px,9vw,132px) 32px', background: 'linear-gradient(180deg,#FFFFFF,#F8FAFC)', borderTop: '1px solid #EEF2F7' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <RevealWrapper>
          <div style={{ maxWidth: '620px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)' }}>Client results</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(34px,3.4vw,48px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#0A2342', margin: '16px 0 0', textWrap: 'balance' }}>
              Why security directors stay with RAM.
            </h2>
          </div>
        </RevealWrapper>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '24px', marginTop: '48px' }}>

          {TESTIMONIALS.map((t, index) => (
            <RevealWrapper key={t.slotId} delay={index * 60}>
              <div className="testimonial-card" style={{ borderRadius: '18px', padding: '32px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', gap: '3px', color: 'var(--accent)' }}>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.6 7 .8-5 4.8 1.3 7-6.3-3.5-6.3 3.5L7 14.2 2 9.4l7-.8z" /></svg>
                  ))}
                </div>
                <p className="testimonial-quote" style={{ fontSize: '16.5px', lineHeight: 1.62, margin: '20px 0 0', flex: 1 }}>
                  "{t.quote}"
                </p>
                <div className="testimonial-meta" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '26px', paddingTop: '22px' }}>
                  <div style={{ width: '46px', height: '46px', flex: '0 0 auto' }}>
                    <ImageSlot id={t.slotId} shape="circle" placeholder="Headshot" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35 }}>
                    <span className="testimonial-name" style={{ fontSize: '14.5px', fontWeight: 600 }}>{t.name}</span>
                    <span className="testimonial-role" style={{ fontSize: '13px' }}>{t.role}</span>
                  </div>
                </div>
              </div>
            </RevealWrapper>
          ))}

        </div>
      </div>
    </section>
  );
}
