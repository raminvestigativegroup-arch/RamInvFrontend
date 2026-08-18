import React from 'react';
import { RevealWrapper } from '../utils/RevealWrapper';

const TEAM = [
  {
    name: "Patrick",
    title: "Chief Executive Officer (CEO)",
    image: "/CEO.png"
  },
  {
    name: "John Miller",
    title: "President",
    image: "/President.png"
  },
  {
    name: "Marcus Vance",
    title: "Operations Center Director",
    image: "/OCenterDirector.png"
  },
  {
    name: "Sarah Jenkins",
    title: "Business Development Manager",
    image: "/BDevManager.png"
  }
];

export default function Leadership() {
  return (
    <section id="leadership" style={{ padding: 'clamp(80px,9vw,132px) 32px', background: '#FFFFFF', borderTop: '1px solid #EEF2F7', scrollMarginTop: '90px' }}>
      <style>{`
        .team-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(10,35,66,0.1) !important;
        }
        .team-card:hover .team-image {
          transform: scale(1.04);
        }
      `}</style>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <RevealWrapper>
          <div style={{ maxWidth: '660px', marginBottom: '56px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)' }}>Leadership Team</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(34px,3.4vw,48px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#0A2342', margin: '16px 0 0', textWrap: 'balance' }}>
              The expertise directing your security.
            </h2>
            <p style={{ fontSize: '16.5px', lineHeight: 1.65, color: '#3F4A5A', margin: '20px 0 0' }}>
              Our executive team brings decades of combined field experience and tactical command to RAM Investigative Group.
            </p>
          </div>
        </RevealWrapper>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
          {TEAM.map((member, idx) => (
            <RevealWrapper key={idx}>
              <div 
                className="team-card"
                style={{ 
                  background: '#FFFFFF', 
                  border: '1px solid #E6EBF2', 
                  borderRadius: '16px', 
                  overflow: 'hidden', 
                  boxShadow: 'var(--shadow-card)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
              >
                <div style={{ overflow: 'hidden', position: 'relative', paddingTop: '100%', background: '#F8FAFC' }}>
                  <img 
                    src={member.image} 
                    alt={`${member.name} - ${member.title}`}
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      transition: 'transform 0.4s ease'
                    }}
                    className="team-image"
                  />
                </div>
                <div style={{ padding: '24px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: '#0A2342', margin: '0 0 6px' }}>
                    {member.name}
                  </h3>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', display: 'block', marginBottom: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {member.title}
                  </span>
                </div>
              </div>
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}
