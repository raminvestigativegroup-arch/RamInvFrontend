import React from 'react';
import { Button } from '../DesignSystem';

interface StickyCTAProps {
  showSticky: boolean;
}

export default function StickyCTA({ showSticky }: StickyCTAProps) {
  return (
    <div style={{
      position: 'fixed',
      left: '20px',
      right: '20px',
      bottom: '24px',
      zIndex: 70,
      transform: showSticky ? 'translateY(0)' : 'translateY(140%)',
      opacity: showSticky ? 1 : 0,
      transition: 'transform 0.45s var(--ease-out), opacity 0.35s',
      width: 'auto',
      maxWidth: '640px',
      margin: '0 auto',
      boxSizing: 'border-box',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px 20px',
      padding: '14px 16px 14px 24px',
      borderRadius: '999px',
      background: 'rgba(7,26,49,0.88)',
      backdropFilter: 'blur(20px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.14)',
      boxShadow: '0 24px 60px rgba(0,0,0,.4)'
    }}>
      <span style={{ fontSize: '14.5px', fontWeight: 500, color: '#fff' }}>Need coverage fast? Talk to a licensed manager today.</span>
      <Button size="md" onClick={() => document.getElementById('contact')?.scrollIntoView()}>
        Get a Free Quote
      </Button>
    </div>
  );
}
