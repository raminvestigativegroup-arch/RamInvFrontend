import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Hero from '@/components/sections/Hero';
import TrustBar from '@/components/sections/TrustBar';
import Services from '@/components/sections/Services';
import WhyRam from '@/components/sections/WhyRam';
import Industries from '@/components/sections/Industries';
import Process from '@/components/sections/Process';
import StatsDivider from '@/components/sections/StatsDivider';
import Testimonials from '@/components/sections/Testimonials';
import ContactForm from '@/components/sections/ContactForm';
import Footer from '@/components/layout/Footer';
import StickyCTA from '@/components/layout/StickyCTA';

export default function LandingPage() {
  const [showSticky, setShowSticky] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 900) {
        setShowSticky(true);
      } else {
        setShowSticky(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [location.hash]);

  return (
    <div className="landing-page-theme" style={{ fontFamily: 'var(--font-body)', color: '#1F2937', background: '#fff', overflowX: 'hidden' }}>
      <Header />
      <Hero animateCounters={true} />
      <TrustBar />
      <Services />
      <WhyRam />
      <Industries />
      <Process />
      <StatsDivider animateCounters={true} />
      <Testimonials />
      <ContactForm />
      <Footer />
      <StickyCTA showSticky={showSticky} />
    </div>
  );
}
