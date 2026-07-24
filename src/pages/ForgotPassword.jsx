import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { requestForgotPasswordCode, verifyForgotPasswordOtp, resetForgotPassword } from '../services/api';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // Step 1: Email Request, Step 2: OTP Entry, Step 3: New Password
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await requestForgotPasswordCode(email);
      if (res.success) {
        toast.success(res.message || 'OTP code sent to your email.');
        setStep(2);
      } else {
        toast.error(res.message || 'Failed to request OTP code.');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyForgotPasswordOtp(email, otpCode);
      if (res.success) {
        toast.success('Code verified successfully.');
        setStep(3);
      } else {
        toast.error(res.message || 'Invalid or expired OTP code.');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetForgotPassword(email, newPassword, confirmPassword);
      if (res.success) {
        toast.success('Password reset successfully. You can log in now.');
        navigate('/login');
      } else {
        toast.error(res.message || 'Password reset failed.');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-surface-container-lowest, #f8f9fa)' }}>
      <div className="auth-panel-right" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div className="auth-form-container" style={{ maxWidth: '420px', width: '100%', backgroundColor: '#fff', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 className="text-headline-md" style={{ color: 'var(--color-on-surface)', marginBottom: '8px', fontSize: '24px', fontWeight: '700' }}>
              {step === 1 && 'Reset Password'}
              {step === 2 && 'Enter Code'}
              {step === 3 && 'New Password'}
            </h2>
            <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)', fontSize: '14px' }}>
              {step === 1 && 'Enter your email address to receive a secure validation code.'}
              {step === 2 && `We sent a 6-digit OTP code to ${email}.`}
              {step === 3 && 'Choose a strong password to secure your account.'}
            </p>
          </div>

          {step === 1 && (
            <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="input-label" htmlFor="email" style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="input-field"
                  placeholder="e.g. user@smarterp.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-outline-variant, #ccc)' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '6px', fontSize: '15px' }} disabled={loading}>
                {loading ? 'Sending Code...' : 'Send OTP Code'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="input-label" htmlFor="otpCode" style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>OTP Verification Code</label>
                <input
                  id="otpCode"
                  type="text"
                  className="input-field"
                  placeholder="Enter 6-digit code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-outline-variant, #ccc)', letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '6px', fontSize: '15px' }} disabled={loading}>
                {loading ? 'Verifying Code...' : 'Verify OTP Code'}
              </button>
              <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>
                Back to email entry
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="input-label" htmlFor="newPassword" style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-outline-variant, #ccc)' }}
                />
              </div>
              <div>
                <label className="input-label" htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-outline-variant, #ccc)' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '6px', fontSize: '15px' }} disabled={loading}>
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--color-on-surface-variant)' }}>
            Remembered your password? <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '600' }}>Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
