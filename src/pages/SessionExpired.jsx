import React from 'react';
import { useNavigate } from 'react-router-dom';

const SessionExpired = () => {
  const navigate = useNavigate();

  const handleSignInAgain = () => {
    navigate('/login');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--color-surface-container-lowest, #f8f9fa)',
      color: 'var(--color-on-surface, #212529)',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: 'var(--color-surface, #ffffff)',
        borderRadius: 'var(--radius-default, 16px)',
        border: '1px solid var(--color-border-structural, #e9ecef)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        padding: '40px',
        textAlign: 'center'
      }}>
        {/* Security Warning Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-error-container, #fce8e6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-error, #ea4335)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>

        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          marginBottom: '12px',
          color: 'var(--color-on-surface, #1f2937)'
        }}>Session Expired</h1>

        <p style={{
          fontSize: '15px',
          lineHeight: '1.6',
          color: 'var(--color-on-surface-variant, #4b5563)',
          marginBottom: '32px'
        }}>
          Your session has expired because your authentication could not be refreshed.<br />
          For your security, please sign in again to continue.
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <button 
            onClick={handleSignInAgain}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '15px',
              fontWeight: '600',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Sign In Again
          </button>
          
          <button 
            onClick={handleBackToHome}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '15px',
              fontWeight: '500',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-outline-variant, #d1d5db)',
              color: 'var(--color-on-surface-variant, #4b5563)',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpired;
