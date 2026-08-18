import React from 'react';
import { RevealWrapper } from '../utils/RevealWrapper';

const BRANDS = [
  { name: "Brand 4", image: "/logo-4.jpeg" },
  { name: "Brand 5", image: "/logo-5.jpeg" },
  { name: "Brand 6", image: "/logo-6.jpeg" },
  { name: "Brand 7", image: "/logo-7.jpeg" },
  { name: "Brand 8", image: "/logo-8.jpeg" },
  { name: "Brand 9", image: "/logo-9.jpeg" }
];

export default function Brands() {
  return (
    <section id="brands" style={{ padding: 'clamp(80px,9vw,132px) 32px', background: 'linear-gradient(135deg, #FCFDFE 0%, #F5F8FA 100%)', borderTop: '1px solid #EEF2F7', borderBottom: '1px solid #EEF2F7', scrollMarginTop: '90px', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative background blur elements for premium look */}
      <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'rgba(212,175,55,0.04)', filter: 'blur(80px)', borderRadius: '50%', top: '-50px', right: '-50px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '400px', height: '400px', background: 'rgba(10,35,66,0.02)', filter: 'blur(100px)', borderRadius: '50%', bottom: '-100px', left: '-100px', pointerEvents: 'none' }} />

      <style>{`
        .brands-split-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
          align-items: center;
          max-width: 1280px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        @media (min-width: 1024px) {
          .brands-split-container {
            grid-template-columns: 5fr 7fr;
            gap: 80px;
          }
        }
        .brand-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        @media (min-width: 640px) {
          .brand-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }
        }
        .brand-logo-card {
          background: #FFFFFF;
          border: 1px solid #EAF0F6;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 130px;
          box-shadow: 0 10px 25px rgba(10,35,66,0.02);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        /* Premium corner hover indicators */
        .brand-logo-card::before, .brand-logo-card::after {
          content: '';
          position: absolute;
          width: 8px;
          height: 8px;
          border-color: var(--accent, #D4AF37);
          border-style: solid;
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .brand-logo-card::before {
          top: 12px;
          left: 12px;
          border-width: 1.5px 0 0 1.5px;
          transform: translate(-3px, -3px);
        }
        .brand-logo-card::after {
          bottom: 12px;
          right: 12px;
          border-width: 0 1.5px 1.5px 0;
          transform: translate(3px, 3px);
        }
        .brand-logo-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 35px rgba(10,35,66,0.07);
          border-color: rgba(212,175,55,0.25);
          background: #FFFFFF;
        }
        .brand-logo-card:hover::before, .brand-logo-card:hover::after {
          opacity: 1;
          transform: translate(0, 0);
        }
        .brand-logo-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .brand-logo-card:hover .brand-logo-img {
          transform: scale(1.05);
        }
      `}</style>

      <div className="brands-split-container">
        {/* Left Column: Premium Text block */}
        <RevealWrapper>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '11px', 
              fontWeight: 700, 
              letterSpacing: '0.18em', 
              textTransform: 'uppercase', 
              color: 'var(--accent, #D4AF37)', 
              background: 'rgba(212,175,55,0.08)',
              padding: '6px 12px',
              borderRadius: '999px',
              border: '1px solid rgba(212,175,55,0.18)',
              marginBottom: '20px'
            }}>
              <span style={{ width: '6px', height: '6px', background: 'var(--accent, #D4AF37)', borderRadius: '50%' }} />
              Registered Trademarks
            </span>
            <h2 style={{ 
              fontFamily: 'var(--font-display)', 
              fontWeight: 700, 
              fontSize: 'clamp(32px,3.2vw,44px)', 
              lineHeight: 1.15, 
              letterSpacing: '-0.02em', 
              color: '#0A2342', 
              margin: 0, 
              textWrap: 'balance' 
            }}>
              Our Other Official Logos
            </h2>
            <div style={{ width: '56px', height: '3.5px', background: 'var(--accent, #D4AF37)', marginTop: '22px', borderRadius: '99px' }} />
            <p style={{ 
              fontSize: '16px', 
              lineHeight: 1.7, 
              color: '#3F4A5A', 
              margin: '24px 0 0',
              fontWeight: 450
            }}>
              RAM Investigative Group operates and delivers security services across the country under these alternate logos and trademarks. These designs and registered brand marks belong directly to our national service operation.
            </p>
          </div>
        </RevealWrapper>

        {/* Right Column: Grid of Cards */}
        <div className="brand-grid">
          {BRANDS.map((brand, idx) => (
            <RevealWrapper key={idx}>
              <div className="brand-logo-card">
                <img 
                  src={brand.image} 
                  alt={brand.name} 
                  className="brand-logo-img"
                />
              </div>
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}
