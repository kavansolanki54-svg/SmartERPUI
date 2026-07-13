import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [user, setUser] = useState({ userName: 'Alex Rivera', roleName: 'Admin' });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser({
        userName: u.userName || 'Alex Rivera',
        roleName: u.roleName || (u.roleType ? u.roleType : 'Admin')
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="layout-header" style={{ justifyContent: 'space-between', padding: '0 32px', backgroundColor: '#fff' }}>

      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-primary)', marginRight: '32px' }}>SmartERP</span>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid var(--color-border-structural)', paddingLeft: '24px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-on-surface)' }}>{user.userName}</span>
              <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>{user.roleName}</span>
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
