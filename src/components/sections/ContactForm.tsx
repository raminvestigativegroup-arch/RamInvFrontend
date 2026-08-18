import React, { useState } from 'react';
import { Button, Input } from '../DesignSystem';
import { RevealWrapper } from '../utils/RevealWrapper';
import api from '../../utils/api';
import { useToast } from '../../hooks/use-toast';

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    siteDetails: ''
  });

  const handleInputChange = (field: string, val: string) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Work email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid work email address';
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const digits = formData.phone.replace(/\D/g, '');
      if (digits.length !== 10) {
        newErrors.phone = 'Please enter a valid 10-digit US phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await api.post('/consultations', formData);
      if (response.data && response.data.success) {
        toast({
          title: "Request Submitted Successfully",
          description: `Thank you, ${formData.name}. A security manager will call you back shortly.`,
        });
        setFormData({ name: '', company: '', email: '', phone: '', siteDetails: '' });
      } else {
        const msg = response.data.message || 'Something went wrong. Please try again.';
        setErrorMsg(msg);
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: msg,
        });
      }
    } catch (err) {
      console.error('Failed to submit consultation:', err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (err as any).response?.data?.message || 'Failed to submit request. Please verify your fields and try again.';
      setErrorMsg(msg);
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" style={{ padding: 'clamp(80px,9vw,132px) 32px', background: 'radial-gradient(900px 500px at 85% 0%,rgba(212,175,55,0.14),transparent 60%),linear-gradient(135deg,#071A31 0%,#0A2342 60%,#16345B 100%)', scrollMarginTop: '90px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(380px,1fr))', gap: 'clamp(40px,5vw,72px)', alignItems: 'center' }}>
        
        {/* Left copy column */}
        <RevealWrapper>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(36px,3.8vw,54px)', lineHeight: 1.08, letterSpacing: '-0.02em', color: '#fff', margin: 0, textWrap: 'balance' }}>
              Ready to Secure Your Business?
            </h2>
            <p style={{ fontSize: '17.5px', lineHeight: 1.62, color: 'rgba(255,255,255,.72)', margin: '22px 0 0', maxWidth: '480px' }}>
              Speak with a licensed security manager today. Most consultations are scheduled within 24 hours, and quotes are itemized by post.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '34px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', padding: '9px 15px', borderRadius: '999px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', fontSize: '13px', color: 'rgba(255,255,255,.82)' }}>No obligation quote</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', padding: '9px 15px', borderRadius: '999px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', fontSize: '13px', color: 'rgba(255,255,255,.82)' }}>Licensed &amp; insured</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', padding: '9px 15px', borderRadius: '999px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', fontSize: '13px', color: 'rgba(255,255,255,.82)' }}>Coverage in 48 hours</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px', marginTop: '38px' }}>
              <a href="tel:+16313144180" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '22px', color: '#fff' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round"><path d="M5 4h3l2 5-2 1a11 11 0 005 5l1-2 5 2v3a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" /></svg>
                (631) 314-4180
              </a>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,.6)' }}>Dispatch answers 24/7</span>
            </div>
          </div>
        </RevealWrapper>

        {/* Right form card */}
        <RevealWrapper>
          <div style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '22px', padding: 'clamp(26px,3vw,38px)', boxShadow: '0 40px 80px rgba(0,0,0,.35)' }}>
            
            <form onSubmit={handleFormSubmit} noValidate>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '22px', color: '#0A2342' }}>Request a free consultation</span>
              <p style={{ fontSize: '14px', color: '#6B7684', margin: '8px 0 24px' }}>A security manager will call you back — typically the same business day.</p>
              
              {errorMsg && (
                <div style={{ color: '#DC2626', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', padding: '10px 14px', borderRadius: '8px', fontSize: '13.5px', marginBottom: '18px', fontWeight: 500 }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Input 
                    label="Full name" 
                    placeholder="Jordan Reyes" 
                    value={formData.name} 
                    onChange={(e) => {
                      handleInputChange('name', e.target.value);
                      if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                    }} 
                    style={errors.name ? { borderColor: '#DC2626' } : undefined}
                    disabled={loading} 
                  />
                  {errors.name && <span style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px', fontWeight: 500 }}>{errors.name}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Input 
                    label="Company" 
                    placeholder="Halewood Construction" 
                    value={formData.company} 
                    onChange={(e) => handleInputChange('company', e.target.value)} 
                    disabled={loading} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Input 
                    label="Work email" 
                    type="email" 
                    placeholder="jordan@company.com" 
                    value={formData.email} 
                    onChange={(e) => {
                      handleInputChange('email', e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }} 
                    style={errors.email ? { borderColor: '#DC2626' } : undefined}
                    disabled={loading} 
                  />
                  {errors.email && <span style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px', fontWeight: 500 }}>{errors.email}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Input 
                    label="Phone" 
                    type="tel" 
                    placeholder="(555) 010-2244" 
                    value={formData.phone} 
                    onChange={(e) => {
                      handleInputChange('phone', e.target.value);
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                    }} 
                    style={errors.phone ? { borderColor: '#DC2626' } : undefined}
                    disabled={loading} 
                  />
                  {errors.phone && <span style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px', fontWeight: 500 }}>{errors.phone}</span>}
                </div>
              </div>
              <div style={{ marginTop: '14px' }}>
                <Input label="Site type &amp; coverage needed" placeholder="e.g. 2 warehouses, overnight unarmed coverage" value={formData.siteDetails} onChange={(e) => handleInputChange('siteDetails', e.target.value)} disabled={loading} />
              </div>
              <div style={{ marginTop: '24px' }}>
                <Button size="lg" block={true} type="submit" disabled={loading}>
                  {loading ? 'Submitting Request...' : 'Request Quote'}
                </Button>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <Button variant="ghost" size="md" style={{ width: '50%' }} onClick={() => alert('Consultation scheduler opening soon!')} disabled={loading}>
                  Schedule Consultation
                </Button>
                <a href="tel:+16313144180" style={{ display: 'inline-flex', width: '50%', textDecoration: 'none' }}>
                  <Button variant="ghost" size="md" style={{ width: '100%' }} disabled={loading}>
                    Call Now
                  </Button>
                </a>
              </div>
              <p style={{ fontSize: '12px', lineHeight: 1.5, color: '#6B7684', margin: '16px 0 0' }}>
                By submitting you agree to be contacted about your security requirements. We never share your information.
              </p>
            </form>

          </div>
        </RevealWrapper>

      </div>
    </section>
  );
}
