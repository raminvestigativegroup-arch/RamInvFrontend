import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button, Input } from '@/components/DesignSystem';
import { api } from '@/config/api';

export default function DeleteAccount() {
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as any });
  }, []);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reason, setReason] = useState('');
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both your email and password.');
      return;
    }
    if (!confirmDelete) {
      setError('You must confirm that you understand this action is permanent.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Authenticate mobile credentials (guard or manager)
      const loginRes = await api.auth.loginMobile({ email, password });
      
      if (!loginRes.data || !loginRes.data.success) {
        throw new Error(loginRes.data?.message || 'Authentication failed. Please check your credentials.');
      }

      const token = loginRes.data.accessToken;
      if (!token) {
        throw new Error('Did not receive active authentication token from the server.');
      }

      // 2. Perform account deletion with retrieved JWT token
      const deleteRes = await api.auth.deleteAccount(token);

      if (deleteRes.data && deleteRes.data.success) {
        setSuccess(true);
      } else {
        throw new Error(deleteRes.data?.message || 'Account deletion failed.');
      }
    } catch (err: any) {
      console.error('Delete account error:', err);
      // Retrieve friendly error message from API response
      const serverMessage = err.response?.data?.message || err.message || 'An unexpected error occurred. Please try again.';
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page-theme" style={{ fontFamily: 'var(--font-body)', color: '#1F2937', background: '#F9FAFB', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* Hero Section */}
      <section style={{ background: 'linear-gradient(135deg, #071A31 0%, #0d284a 100%)', padding: '64px 32px', color: '#fff', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4.5vw, 40px)', fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Delete Account Request
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', fontWeight: 500, maxWidth: '600px', margin: '0 auto' }}>
            Request deletion of your SecurePro guard or manager mobile account.
          </p>
        </div>
      </section>

      {/* Main Body */}
      <main style={{ flex: '1 0 auto', maxWidth: '600px', width: '100%', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ background: '#fff', padding: '36px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid rgba(10,35,66,0.06)' }}>
          {success ? (
            // Success Card
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ECFDF5',
                color: '#10B981',
                marginBottom: '24px'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#071A31', marginBottom: '12px' }}>
                Account Deleted Successfully
              </h2>
              <p style={{ color: '#4B5563', fontSize: '15px', lineHeight: 1.6, marginBottom: '28px' }}>
                Your account credentials and active sessions have been permanently removed. Your operational history (schedules, incident logs, etc.) is preserved for legal compliance and audit requirements.
              </p>
              <Button variant="filled" style={{ width: '100%' }} onClick={() => navigate('/')}>
                Back to Homepage
              </Button>
            </div>
          ) : (
            // Form Card
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: '#FEF2F2', borderLeft: '4px solid #EF4444', padding: '16px', borderRadius: '0 8px 8px 0' }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#991B1B', margin: '0 0 6px' }}>
                  Important Safety Notice
                </h3>
                <p style={{ fontSize: '13.5px', color: '#7F1D1D', margin: 0, lineHeight: 1.5 }}>
                  Deleting your account is permanent. This will invalidate all active sessions, unsubscribe you from push notifications, and release your credentials. You cannot delete your account if you are currently assigned to active shifts or managed sites.
                </p>
              </div>

              {error && (
                <div style={{ background: '#FFF5F5', border: '1px solid #FEB2B2', padding: '12px 16px', borderRadius: '8px', color: '#C53030', fontSize: '14px', fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <div>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="Enter your registered email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#3F4A5A' }}>
                  Reason for Deletion (Optional)
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 10px',
                    borderRadius: '10px',
                    border: '1.5px solid #D1D9E6',
                    fontFamily: 'var(--font-body, "Outfit", sans-serif)',
                    fontSize: '14.5px',
                    color: '#1F2937',
                    background: '#fff',
                    outline: 'none'
                  }}
                >
                  <option value="">Select a reason...</option>
                  <option value="no_longer_work">No longer working with RAM Investigative Group</option>
                  <option value="privacy">Privacy concerns</option>
                  <option value="app_issues">Experiencing technical issues with the app</option>
                  <option value="other">Other reason</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="confirmDelete"
                  checked={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.checked)}
                  disabled={loading}
                  style={{ marginTop: '4px', cursor: 'pointer' }}
                />
                <label htmlFor="confirmDelete" style={{ fontSize: '13.5px', color: '#4B5563', lineHeight: 1.5, cursor: 'pointer', userSelect: 'none' }}>
                  I confirm that I want to delete my account permanently and understand this action is irreversible.
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <Button variant="danger" type="submit" disabled={loading} block>
                  {loading ? 'Processing request...' : 'Permanently Delete Account'}
                </Button>
                <Button variant="outline" type="button" onClick={() => navigate('/')} disabled={loading} block>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
