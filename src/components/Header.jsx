import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const userName = user?.userName || 'Alex Rivera';
  const roleName = user?.roleName || (user?.roleType ? user.roleType : 'Admin');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="layout-header">

      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button 
          onClick={onToggleSidebar}
          className="sidebar-toggle-btn"
        >
          <i className="fa-solid fa-bars"></i>
        </button>
        <span className="header-logo-text">SmartERP</span>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="header-profile-trigger"
          >
            <div className="header-user-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-on-surface)' }}>{userName}</span>
              <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>{roleName}</span>
            </div>
            <i className={`fa-solid fa-chevron-${isProfileOpen ? 'up' : 'down'}`} style={{ fontSize: '12px', color: 'var(--color-outline)', marginLeft: '4px' }}></i>
          </div>

          {isProfileOpen && (
            <div style={{ 
              position: 'absolute', 
              top: '100%', 
              right: 0, 
              marginTop: '12px',
              backgroundColor: '#fff', 
              border: '1px solid var(--color-border-structural)', 
              borderRadius: '8px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              minWidth: '160px',
              zIndex: 50,
              overflow: 'hidden'
            }}>
              <button 
                onClick={handleLogout}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  backgroundColor: 'transparent', 
                  border: 'none', 
                  cursor: 'pointer',
                  color: 'var(--color-error)',
                  fontSize: '14px',
                  fontWeight: '500',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
