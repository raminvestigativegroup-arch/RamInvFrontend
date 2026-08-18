import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

export default function Footer() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetHash: string) => {
    if (location.pathname !== '/') {
      e.preventDefault();
      navigate('/' + targetHash);
    } else {
      e.preventDefault();
      const id = targetHash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', targetHash);
      }
    }
  };

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
              <span>22 Argyle Square Babylon, N.Y. 11702</span>
              <a href="tel:+16313144180" style={{ color: 'rgba(255,255,255,.78)' }}>Office: (631) 314-4180</a>
              <a href="tel:+16317664676" style={{ color: 'rgba(255,255,255,.78)' }}>Cell: (631) 766-4676</a>
              <a href="mailto:Patrick@RamInvestigation.com" style={{ color: 'rgba(255,255,255,.78)' }}>Patrick@RamInvestigation.com</a>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <a href="https://www.facebook.com/share/1HuVPTFC4W/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>Facebook</a>
                <a href="https://www.linkedin.com/company/raminvestigation" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>LinkedIn</a>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.42)' }}>Company</span>
            <a href="#about" onClick={(e) => handleNavClick(e, '#about')} style={{ fontSize: '14px', color: 'rgba(255,255,255,.68)' }}>About RAM</a>
            <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')} style={{ fontSize: '14px', color: 'rgba(255,255,255,.68)' }}>Contact</a>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.42)' }}>Services</span>
            <a href="#services" onClick={(e) => handleNavClick(e, '#services')} style={{ fontSize: '14px', color: 'rgba(255,255,255,.68)' }}>Guard services</a>
            <a href="#services" onClick={(e) => handleNavClick(e, '#services')} style={{ fontSize: '14px', color: 'rgba(255,255,255,.68)' }}>Mobile patrol</a>
            <a href="#services" onClick={(e) => handleNavClick(e, '#services')} style={{ fontSize: '14px', color: 'rgba(255,255,255,.68)' }}>Investigations</a>
            <a href="#services" onClick={(e) => handleNavClick(e, '#services')} style={{ fontSize: '14px', color: 'rgba(255,255,255,.68)' }}>Executive protection</a>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.42)' }}>Resources</span>
            <a href="#industries" onClick={(e) => handleNavClick(e, '#industries')} style={{ fontSize: '14px', color: 'rgba(255,255,255,.68)' }}>Industries</a>
            <a href="#about" onClick={(e) => handleNavClick(e, '#about')} style={{ fontSize: '14px', color: 'rgba(255,255,255,.68)' }}>Compliance</a>
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
