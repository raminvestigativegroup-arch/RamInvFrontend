import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '../DesignSystem';

export default function Header() {
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

  const handleRequestConsultation = () => {
    if (location.pathname !== '/') {
      navigate('/#contact');
    } else {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 60,
      background: 'rgba(255,255,255,0.74)',
      backdropFilter: 'blur(20px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
      borderBottom: '1px solid rgba(10,35,66,0.08)'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '10px 32px', minHeight: '72px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 28px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', flex: '0 0 auto' }}>
          <img
            src="/logo.png"
            alt="RAM Investigative Group"
            style={{ height: '54px', width: 'auto', display: 'block', objectFit: 'contain', transform: 'translateY(-2px)' }}
          />
        </Link>
        <nav style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px', flex: '1 1 260px', minWidth: 0 }}>
          <a href="#top" onClick={(e) => handleNavClick(e, '#top')} className="nav-link" style={{ padding: '9px 14px', borderRadius: '999px', fontSize: '14px', fontWeight: 500, color: '#3F4A5A' }}>Home</a>
          <a href="#services" onClick={(e) => handleNavClick(e, '#services')} className="nav-link" style={{ padding: '9px 14px', borderRadius: '999px', fontSize: '14px', fontWeight: 500, color: '#3F4A5A' }}>Services</a>
          <a href="#industries" onClick={(e) => handleNavClick(e, '#industries')} className="nav-link" style={{ padding: '9px 14px', borderRadius: '999px', fontSize: '14px', fontWeight: 500, color: '#3F4A5A' }}>Industries</a>
          <a href="#about" onClick={(e) => handleNavClick(e, '#about')} className="nav-link" style={{ padding: '9px 14px', borderRadius: '999px', fontSize: '14px', fontWeight: 500, color: '#3F4A5A' }}>About</a>
          <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')} className="nav-link" style={{ padding: '9px 14px', borderRadius: '999px', fontSize: '14px', fontWeight: 500, color: '#3F4A5A' }}>Contact</a>
        </nav>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: '12px 14px', flex: '0 1 auto', minWidth: 0 }}>
          <a href="tel:+16313144180" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#0A2342', whiteSpace: 'nowrap' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M5 4h3l2 5-2 1a11 11 0 005 5l1-2 5 2v3a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
            </svg>
            (631) 314-4180
          </a>
          <Button variant="outline" size="md" onClick={handleRequestConsultation}>
            Client Portal
          </Button>
          <Button variant="filled" size="md" onClick={handleRequestConsultation}>
            Request a Free Consultation
          </Button>
        </div>
      </div>
    </header>
  );
}
