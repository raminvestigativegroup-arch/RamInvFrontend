import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer id="footer" style={{ background: '#071A31', padding: 'clamp(64px,7vw,96px) 32px 40px', scrollMarginTop: '90px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1.3fr) repeat(auto-fit, minmax(140px, 1fr))', gap: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img 
                src="/logo.png" 
                alt="RAM Investigative Group" 
                style={{ height: '42px', width: 'auto', display: 'block', filter: 'brightness(0) invert(1)' }} 
              />
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.65, color: 'rgba(255,255,255,.6)', margin: '20px 0 0', maxWidth: '300px' }}>
              Professional security solutions powered by modern technology. Licensed, bonded, and insured.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px', fontSize: '14px', color: 'rgba(255,255,255,.6)' }}>
              <span>1200 Corporate Center Dr, Suite 400</span>
              <a href="tel:+18005550142" style={{ color: 'rgba(255,255,255,.78)' }}>(800) 555-0142</a>
              <a href="mailto:info@raminvestigative.com" style={{ color: 'rgba(255,255,255,.78)' }}>info@raminvestigative.com</a>
              <a href="#top" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 600 }}>LinkedIn</a>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.42)' }}>Company</span>
            <a href="#about" style={{ fontSize: '14px', color: 'rgba(255,255,255,.68)' }}>About RAM</a>
            <a href="#contact" style={{ fontSize: '14px', color: 'rgba(255,255,255,.68)' }}>Contact</a>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.42)' }}>Services</span>
            <a href="#services" style={{ fontSize: '14px', color: 'rgba(255,255,255,.68)' }}>Guard services</a>
            <a href="#services" style={{ fontSize: '14px', color: 'rgba(255,255,255,.68)' }}>Mobile patrol</a>
            <a href="#services" style={{ fontSize: '14px', color: 'rgba(255,255,255,.68)' }}>Investigations</a>
            <a href="#services" style={{ fontSize: '14px', color: 'rgba(255,255,255,.68)' }}>Executive protection</a>
          </div>
          


          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.42)' }}>Resources</span>
            <a href="#industries" style={{ fontSize: '14px', color: 'rgba(255,255,255,.68)' }}>Industries</a>
            <a href="#about" style={{ fontSize: '14px', color: 'rgba(255,255,255,.68)' }}>Compliance</a>
            <Link to="/privacy-policy" style={{ fontSize: '14px', color: 'rgba(255,255,255,.68)' }}>Privacy policy</Link>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginTop: '56px', borderTop: '1px solid rgba(255,255,255,.10)', paddingTop: '24px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.45)' }}>© 2026 RAM Investigative Group Inc. All rights reserved.</span>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.45)' }}>License #PPO-14238 · #PI-8842</span>
        </div>
      </div>
    </footer>
  );
}
