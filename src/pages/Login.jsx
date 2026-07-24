import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(email, password);

      if (response.success) {
        auth.login(response.data.user, response.data.accessToken);
        navigate('/');
      } else {
        setError(response.message || 'Login failed. Please check your credentials.');
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
      <div className="auth-panel-left">
        <div className="auth-panel-content">
          <div className="auth-logo-box">
            {/* Placeholder for the logo - you should place your logo.png in the public folder */}
            <img src="/logo.png" alt="SmartERP Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23003fb1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>'; }} />
          </div>

          <h1 className="auth-heading">Mastering Enterprise Efficiency</h1>
          <p className="auth-subheading">
            The ultimate high-fidelity ERP solution for modern businesses.
            Manage finances, logistics, and personnel through a single unified
            interface designed for precision.
          </p>
        </div>

        <div className="auth-footer-left">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          Enterprise-grade encryption active
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="auth-panel-right">
        <div className="auth-form-container">
          <h2 className="text-headline-md" style={{ color: 'var(--color-on-surface)', marginBottom: '8px' }}>Welcome Back</h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '32px' }}>
            Please enter your credentials to access your workspace.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && (
              <div style={{ padding: '12px', backgroundColor: 'var(--color-error-container)', color: 'var(--color-on-error-container)', borderRadius: 'var(--radius-default)', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <div>
              <label className="input-label" htmlFor="email">Email or Username</label>
              <div className="input-with-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  id="email"
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: '36px' }}
                  placeholder="e.g. john.doe@smarterp.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="input-label" htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '12px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '600' }}>Forgot password?</Link>
              </div>
              <div className="input-with-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  style={{ paddingLeft: '36px', paddingRight: '36px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="keep-logged" style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1px solid var(--color-outline-variant)' }} />
              <label htmlFor="keep-logged" style={{ fontSize: '14px', color: 'var(--color-on-surface-variant)' }}>Keep me logged in for 30 days</label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', fontSize: '15px' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '14px', color: 'var(--color-on-surface-variant)' }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '600' }}>Request Access</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
