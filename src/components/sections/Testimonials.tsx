import React from 'react';
import { RevealWrapper } from '../utils/RevealWrapper';
import { ImageSlot } from '../ImageSlot';

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
          
          {/* Testimonial 1 */}
          <RevealWrapper>
            <div style={{ background: '#fff', border: '1px solid #E6EBF2', borderRadius: '18px', padding: '32px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', gap: '3px', color: 'var(--accent)' }}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.6 7 .8-5 4.8 1.3 7-6.3-3.5-6.3 3.5L7 14.2 2 9.4l7-.8z" /></svg>
                ))}
              </div>
              <p style={{ fontSize: '16.5px', lineHeight: 1.62, color: '#1F2937', margin: '20px 0 0', flex: 1 }}>
                "Copper theft on our downtown build dropped to zero in the first month. The nightly photo logs are what finally satisfied our insurer."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '26px', paddingTop: '22px', borderTop: '1px solid #EEF2F7' }}>
                <div style={{ width: '46px', height: '46px', flex: '0 0 auto' }}>
                  <ImageSlot id="ram-t1" shape="circle" placeholder="Headshot" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35 }}>
                  <span style={{ fontSize: '14.5px', fontWeight: 600, color: '#0A2342' }}>Marcus Delgado</span>
                  <span style={{ fontSize: '13px', color: '#6B7684' }}>Project Director, Halewood Construction</span>
                </div>
              </div>
            </div>
          </RevealWrapper>

          {/* Testimonial 2 */}
          <RevealWrapper delay={60}>
            <div style={{ background: '#fff', border: '1px solid #E6EBF2', borderRadius: '18px', padding: '32px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', gap: '3px', color: 'var(--accent)' }}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.6 7 .8-5 4.8 1.3 7-6.3-3.5-6.3 3.5L7 14.2 2 9.4l7-.8z" /></svg>
                ))}
              </div>
              <p style={{ fontSize: '16.5px', lineHeight: 1.62, color: '#1F2937', margin: '20px 0 0', flex: 1 }}>
                "Their officers de-escalate instead of escalate. Our ED incident reports are cleaner and our nursing staff actually feel supported."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '26px', paddingTop: '22px', borderTop: '1px solid #EEF2F7' }}>
                <div style={{ width: '46px', height: '46px', flex: '0 0 auto' }}>
                  <ImageSlot id="ram-t2" shape="circle" placeholder="Headshot" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35 }}>
                  <span style={{ fontSize: '14.5px', fontWeight: 600, color: '#0A2342' }}>Dr. Alina Vaziri</span>
                  <span style={{ fontSize: '13px', color: '#6B7684' }}>VP Operations, Meridian Health Network</span>
                </div>
              </div>
            </div>
          </RevealWrapper>

          {/* Testimonial 3 */}
          <RevealWrapper delay={120}>
            <div style={{ background: '#0A2342', border: '1px solid #0A2342', borderRadius: '18px', padding: '32px', boxShadow: '0 24px 48px rgba(10,35,66,.22)', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', gap: '3px', color: 'var(--accent)' }}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.6 7 .8-5 4.8 1.3 7-6.3-3.5-6.3 3.5L7 14.2 2 9.4l7-.8z" /></svg>
                ))}
              </div>
              <p style={{ fontSize: '16.5px', lineHeight: 1.62, color: '#fff', margin: '20px 0 0', flex: 1 }}>
                "The client dashboard replaced a monthly PDF nobody trusted. I can pull an audit trail for any post, any hour, in seconds."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '26px', paddingTop: '22px', borderTop: '1px solid rgba(255,255,255,.14)' }}>
                <div style={{ width: '46px', height: '46px', flex: '0 0 auto' }}>
                  <ImageSlot id="ram-t3" shape="circle" placeholder="Headshot" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35 }}>
                  <span style={{ fontSize: '14.5px', fontWeight: 600, color: '#fff' }}>Grant Whitfield</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.6)' }}>Director of Asset Protection, Northline Retail</span>
                </div>
              </div>
            </div>
          </RevealWrapper>

        </div>
      </div>
    </section>
  );
}
