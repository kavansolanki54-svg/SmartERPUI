import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../services/api';

const SignUp = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await signup(formData.companyName, formData.fullName, formData.email, formData.password, formData.confirmPassword);

      if (response.success) {
        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError('A network error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Left Panel - Branding */}
      <div className="auth-panel-left" style={{ justifyContent: 'space-between', padding: '48px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '8px', padding: '4px' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23003fb1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>'; }} />
          </div>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>SmartERP</span>
        </div>

        <div style={{ maxWidth: '480px' }}>
          <h1 className="auth-heading" style={{ textAlign: 'left', fontSize: '42px', lineHeight: '1.2' }}>
            Scale your enterprise with <br /><span style={{ opacity: 0.8 }}>intelligent</span> automation.
          </h1>
          <p className="auth-subheading" style={{ textAlign: 'left', marginBottom: '40px' }}>
            Join over 2,500 global organizations using SmartERP to streamline workflows, unify data silos, and drive operational excellence through real-time business intelligence.
          </p>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#fff' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '14px' }}>Advanced Analytics</h4>
              </div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: '1.4' }}>Real-time insights for better decision making.</p>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#fff' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '14px' }}>Bank-Grade Security</h4>
              </div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: '1.4' }}>Enterprise-level encryption and compliance.</p>
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ display: 'flex' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ccc', border: '2px solid var(--color-primary)', marginLeft: '-8px' }}></div>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#bbb', border: '2px solid var(--color-primary)', marginLeft: '-8px' }}></div>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#aaa', border: '2px solid var(--color-primary)', marginLeft: '-8px' }}></div>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fff', border: '2px solid var(--color-primary)', marginLeft: '-8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--color-primary)', fontWeight: 'bold' }}>+5k</div>
            </div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Trusted by teams from startups to Fortune 500.</div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="auth-panel-right">
        <div className="auth-form-container" style={{ maxWidth: '500px' }}>
          <h2 className="text-headline-md" style={{ color: 'var(--color-on-surface)', marginBottom: '8px' }}>Create your account</h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && (
              <div style={{ padding: '12px', backgroundColor: 'var(--color-error-container)', color: 'var(--color-on-error-container)', borderRadius: 'var(--radius-default)', fontSize: '14px' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: '12px', backgroundColor: 'var(--color-surface-container-low)', color: 'var(--color-primary)', borderRadius: 'var(--radius-default)', fontSize: '14px', border: '1px solid var(--color-primary-fixed)' }}>
                {success}
              </div>
            )}

            <div>
              <label className="input-label" htmlFor="fullName">Full Name</label>
              <div className="input-with-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '36px' }}
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label" htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: '36px' }}
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label" htmlFor="companyName">Company Name</label>
              <div className="input-with-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '36px' }}
                  placeholder="Acme Inc."
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="input-label" htmlFor="password">Password</label>
                <div className="input-with-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="input-field"
                    style={{ paddingLeft: '36px' }}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="input-label" htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-with-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                  </svg>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    className="input-field"
                    style={{ paddingLeft: '36px' }}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <input type="checkbox" id="terms" required style={{ width: '16px', height: '16px', marginTop: '2px', borderRadius: '4px', border: '1px solid var(--color-outline-variant)' }} />
              <label htmlFor="terms" style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', lineHeight: '1.4' }}>
                I agree to the <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Privacy Policy</a>.
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', fontSize: '15px' }} disabled={loading}>
              {loading ? 'Registering...' : 'Register Account ➔'}
            </button>
          </form>

          <div style={{ marginTop: '48px', textAlign: 'center', fontSize: '14px', color: 'var(--color-on-surface-variant)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '600' }}>Log in</Link>
          </div>

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '12px', color: 'var(--color-outline)' }}>
            © 2024 SmartERP Solutions Inc. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
