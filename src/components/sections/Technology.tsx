import React from 'react';
import { RevealWrapper } from '../utils/RevealWrapper';
import { ImageSlot } from '../ImageSlot';

export default function Technology() {
  return (
    <section id="technology" style={{ padding: 'clamp(80px,9vw,132px) 32px', background: 'linear-gradient(180deg,#071A31 0%,#0A2342 55%,#0E2A4E 100%)', position: 'relative', overflow: 'hidden', scrollMarginTop: '90px' }}>
      <span style={{ position: 'absolute', left: '-10%', top: '-10%', width: '640px', height: '640px', borderRadius: '999px', background: 'radial-gradient(circle,rgba(212,175,55,0.16),transparent 65%)', pointerEvents: 'none' }} />
      <span style={{ position: 'absolute', right: '-8%', bottom: '-20%', width: '720px', height: '720px', borderRadius: '999px', background: 'radial-gradient(circle,rgba(120,170,255,0.14),transparent 65%)', pointerEvents: 'none' }} />
      
      <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative' }}>
        <RevealWrapper>
          <div style={{ maxWidth: '700px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)' }}>Technology</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(34px,3.4vw,48px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#fff', margin: '16px 0 0', textWrap: 'balance' }}>
              A security company that runs like a software platform.
            </h2>
            <p style={{ fontSize: '17px', lineHeight: 1.65, color: 'rgba(255,255,255,0.72)', margin: '20px 0 0' }}>
              Guards check in on the RAM mobile app. Supervisors dispatch from the manager console. You see the same data — live — in the back-office dashboard.
            </p>
          </div>
        </RevealWrapper>

        {/* Operations Console Mockup */}
        <RevealWrapper>
          <div style={{ position: 'relative', marginTop: '64px', perspective: '1800px' }}>
            <div style={{ borderRadius: '18px', overflow: 'hidden', background: '#0B1A2E', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 50px 90px rgba(0,0,0,0.45)', transform: 'rotateX(3deg)' }}>
              
              {/* Header Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 18px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,.22)' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,.22)' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,.22)' }} />
                <span style={{ marginLeft: '14px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>RAM Operations Console — Live Monitoring</span>
              </div>
              
              {/* Dashboard body */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,208px) minmax(0,1fr)', minHeight: '440px' }}>
                
                {/* Left Sidebar */}
                <div style={{ padding: '22px 18px', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)', marginBottom: '8px' }}>Operations</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.10)', fontSize: '13px', fontWeight: 600, color: '#fff' }}>Live map</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.62)' }}>Attendance</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.62)' }}>Incidents</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.62)' }}>Photo verification</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.62)' }}>Compliance</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.62)' }}>Reports</span>
                  
                  <div style={{ marginTop: 'auto', padding: '14px', borderRadius: '12px', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.28)', fontSize: '12px', lineHeight: 1.5, color: 'rgba(255,255,255,0.78)' }}>
                    Dispatch desk<br /><span style={{ color: 'var(--accent)', fontWeight: 600 }}>Online · 3 supervisors</span>
                  </div>
                </div>
                
                {/* Right Dashboard grid */}
                <div style={{ padding: '26px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px' }}>
                    <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.55)' }}>Officers on shift</span>
                      <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '26px', color: '#fff', marginTop: '6px' }}>214</span>
                    </div>
                    <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.55)' }}>On-time check-ins</span>
                      <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '26px', color: '#fff', marginTop: '6px' }}>99.2%</span>
                    </div>
                    <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.55)' }}>Open incidents</span>
                      <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '26px', color: 'var(--accent)', marginTop: '6px' }}>2</span>
                    </div>
                    <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.55)' }}>Avg response</span>
                      <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '26px', color: '#fff', marginTop: '6px' }}>4m</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '18px', flex: 1 }}>
                    
                    {/* Completion Chart */}
                    <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#fff' }}>Checkpoint completion · 7 days</span>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '130px', marginTop: 'auto' }}>
                        <span style={{ flex: 1, height: '52%', borderRadius: '6px 6px 0 0', background: 'rgba(255,255,255,0.22)' }} />
                        <span style={{ flex: 1, height: '68%', borderRadius: '6px 6px 0 0', background: 'rgba(255,255,255,0.22)' }} />
                        <span style={{ flex: 1, height: '61%', borderRadius: '6px 6px 0 0', background: 'rgba(255,255,255,0.22)' }} />
                        <span style={{ flex: 1, height: '80%', borderRadius: '6px 6px 0 0', background: 'rgba(255,255,255,0.22)' }} />
                        <span style={{ flex: 1, height: '72%', borderRadius: '6px 6px 0 0', background: 'rgba(255,255,255,0.22)' }} />
                        <span style={{ flex: 1, height: '94%', borderRadius: '6px 6px 0 0', background: 'var(--accent)' }} />
                        <span style={{ flex: 1, height: '88%', borderRadius: '6px 6px 0 0', background: 'rgba(212,175,55,0.45)' }} />
                      </div>
                    </div>
                    
                    {/* Radar sweep map */}
                    <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#fff' }}>Site coverage map</span>
                      <div style={{ position: 'relative', marginTop: '14px', height: '130px', borderRadius: '10px', background: 'linear-gradient(rgba(255,255,255,0.05),rgba(255,255,255,0.02))', overflow: 'hidden' }}>
                        <svg width="100%" height="130" viewBox="0 0 300 130" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1"><path d="M0 32h300M0 66h300M0 100h300M60 0v130M140 0v130M220 0v130" /></svg>
                        <span style={{ position: 'absolute', left: '16%', top: '58%', width: '10px', height: '10px', borderRadius: '999px', background: '#16A34A', boxShadow: '0 0 0 6px rgba(22,163,74,.18)' }} />
                        <span style={{ position: 'absolute', left: '44%', top: '26%', width: '10px', height: '10px', borderRadius: '999px', background: '#16A34A', boxShadow: '0 0 0 6px rgba(22,163,74,.18)' }} />
                        <span style={{ position: 'absolute', left: '70%', top: '64%', width: '10px', height: '10px', borderRadius: '999px', background: 'var(--accent)', boxShadow: '0 0 0 6px rgba(212,175,55,.18)' }} />
                        <span style={{ position: 'absolute', left: '86%', top: '34%', width: '10px', height: '10px', borderRadius: '999px', background: '#16A34A', boxShadow: '0 0 0 6px rgba(22,163,74,.18)' }} />
                        <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.16),transparent)', animation: 'ramSweep 5s linear infinite' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Guard Mobile App Overlay */}
            <div style={{ position: 'absolute', right: '-8px', bottom: '-56px', width: '236px', borderRadius: '26px', background: '#0A1524', border: '1px solid rgba(255,255,255,0.16)', boxShadow: '0 40px 70px rgba(0,0,0,0.5)', padding: '12px', animation: 'ramFloat 8s ease-in-out infinite' }}>
              <div style={{ borderRadius: '18px', background: 'linear-gradient(180deg,#12233C,#0B1A2E)', padding: '18px 16px' }}>
                <span style={{ display: 'block', fontSize: '10.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>Guard app</span>
                <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '17px', color: '#fff', marginTop: '8px' }}>Shift check-in</span>
                <div style={{ marginTop: '14px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '30px', height: '30px', borderRadius: '999px', background: 'rgba(22,163,74,0.2)', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{ margin: 'auto' }}>
                      <path d="M5 13l4 4 10-10" />
                    </svg>
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>GPS verified</span>
                    <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.5)' }}>Gate 3 · 06:58</span>
                  </div>
                </div>
                <div style={{ marginTop: '10px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.07)' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>Photo verification</span>
                  <div style={{ marginTop: '8px', height: '64px', borderRadius: '8px', overflow: 'hidden' }}>
                    <ImageSlot id="ram-app-photo" shape="rounded" radius="8" placeholder="Site photo" />
                  </div>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '12px', height: '38px', borderRadius: '999px', background: 'var(--accent)', color: '#1F2937', fontSize: '12.5px', fontWeight: 600 }}>Submit patrol log</span>
              </div>
            </div>
          </div>
        </RevealWrapper>

        {/* Technology Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '20px', marginTop: '96px' }}>
          <div style={{ padding: '22px', borderRadius: '16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '17px', color: '#fff' }}>Guard mobile app</span>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'rgba(255,255,255,0.66)', margin: '10px 0 0' }}>GPS check-in, checkpoint scanning, photo capture, incident forms offline-capable.</p>
          </div>
          <div style={{ padding: '22px', borderRadius: '16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '17px', color: '#fff' }}>Manager console</span>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'rgba(255,255,255,0.66)', margin: '10px 0 0' }}>Scheduling, coverage gaps, live dispatch, and escalation trees by site.</p>
          </div>
          <div style={{ padding: '22px', borderRadius: '16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '17px', color: '#fff' }}>Back Office Console</span>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'rgba(255,255,255,0.66)', margin: '10px 0 0' }}>Everything is managed by back office team, Severity-routed alerts by SMS, email, Live tracking.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
