import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const MenuItem = ({ menu, activePath, onCloseMobile }) => {
  const navigate = useNavigate();
  // Helper to normalize URLs for matching
  const normalize = (path) => (path ? (path.startsWith('/') ? path : `/${path}`).toLowerCase() : '');
  const normalizedActivePath = normalize(activePath);

  const hasSubMenus = menu.subMenus && menu.subMenus.length > 0;
  const isExactActive = normalizedActivePath === normalize(menu.url) && !hasSubMenus;
  const hasActiveChild = hasSubMenus && menu.subMenus.some(sub => normalizedActivePath === normalize(sub.url));

  const [isOpen, setIsOpen] = useState(hasActiveChild);

  const isActive = isExactActive;

  const toggleSubMenu = (e) => {
    if (hasSubMenus) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  const getIconClass = (iconName) => {
    if (!iconName) return 'fa-solid fa-circle-notch';
    return iconName.includes('fa-') ? iconName : `fa-solid fa-${iconName}`;
  };

  return (
    <div style={{ marginBottom: '8px' }}>
      {hasSubMenus ? (
        <div
          onClick={toggleSubMenu}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
            color: isActive ? '#fff' : 'var(--color-on-surface-variant)',
            cursor: 'pointer',
            fontWeight: isActive ? '500' : '500',
            transition: 'all 0.2s',
            fontSize: '14px'
          }}
          onMouseEnter={(e) => {
            if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)';
          }}
          onMouseLeave={(e) => {
            if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <i className={getIconClass(menu.icon)} style={{ width: '16px', textAlign: 'center', fontSize: '14px', color: isActive ? 'rgba(255,255,255,0.9)' : 'inherit' }}></i>
            <span className="sidebar-link-text">{menu.name}</span>
          </div>
          <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'} sidebar-chevron`} style={{ fontSize: '10px', opacity: isActive ? 0.9 : 0.5 }}></i>
        </div>
      ) : (
        <Link
          to={menu.url.startsWith('/') ? menu.url : `/${menu.url}`}
          onClick={onCloseMobile}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
            color: isActive ? '#fff' : 'var(--color-on-surface-variant)',
            textDecoration: 'none',
            fontWeight: isActive ? '500' : '500',
            transition: 'all 0.2s',
            fontSize: '14px'
          }}
          onMouseEnter={(e) => {
            if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)';
          }}
          onMouseLeave={(e) => {
            if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <i className={getIconClass(menu.icon)} style={{ width: '16px', textAlign: 'center', fontSize: '14px', color: isActive ? 'rgba(255,255,255,0.9)' : 'inherit' }}></i>
            <span className="sidebar-link-text">{menu.name}</span>
          </div>
        </Link>
      )}

      {hasSubMenus && isOpen && (
        <div className="sidebar-submenu-wrapper" style={{ paddingLeft: '34px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menu.subMenus.map(subMenu => (
            <div
              key={subMenu.moduleId}
              onClick={() => {
                navigate(subMenu.url ? (subMenu.url.startsWith('/') ? subMenu.url : `/${subMenu.url}`) : '#');
                if (onCloseMobile) onCloseMobile();
              }}
              style={{
                display: 'block',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: normalizedActivePath === normalize(subMenu.url) ? 'rgba(0, 63, 177, 0.08)' : 'transparent',
                color: normalizedActivePath === normalize(subMenu.url) ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: normalizedActivePath === normalize(subMenu.url) ? '600' : '400',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (normalizedActivePath !== normalize(subMenu.url)) e.currentTarget.style.color = 'var(--color-on-surface)';
              }}
              onMouseLeave={(e) => {
                if (normalizedActivePath !== normalize(subMenu.url)) e.currentTarget.style.color = 'var(--color-on-surface-variant)';
              }}
            >
              {subMenu.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ menus = [], isMobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const activePath = location.pathname;

  // Dynamically append Employee Master menu if it is not returned by the backend API
  const displayedMenus = [...menus];

  // Append Mobile App Menu under the Administration category in the sidebar
  const adminMenu = displayedMenus.find(
    m => m.name?.toLowerCase().includes('admin') || 
         m.url === '/role' ||
         (m.subMenus && m.subMenus.some(s => s.url === '/role' || s.url === '/rolesoftwaremodules'))
  );

  if (adminMenu) {
    if (!adminMenu.subMenus) adminMenu.subMenus = [];
    if (!adminMenu.subMenus.some(s => s.url === '/mobileappmenu')) {
      adminMenu.subMenus.push({
        moduleId: 'mobileappmenu-sub',
        name: 'Mobile App Menu',
        url: '/mobileappmenu'
      });
    }
  }

  const hasEmployeeMenu = displayedMenus.some(
    m => m.name?.toLowerCase().includes('employee') || 
         (m.subMenus && m.subMenus.some(s => s.name?.toLowerCase().includes('employee')))
  );

  if (!hasEmployeeMenu && menus.length > 0) {
    displayedMenus.push({
      moduleId: 'employee-fallback-temp',
      name: 'Employee Master',
      url: '/employee',
      icon: 'users',
      displayOrder: 99,
      subMenus: []
    });
  }

  const hasPurchaseMenu = displayedMenus.some(
    m => m.name?.toLowerCase().includes('purchase') || 
         (m.subMenus && m.subMenus.some(s => s.name?.toLowerCase().includes('purchase')))
  );

  if (!hasPurchaseMenu && menus.length > 0) {
    displayedMenus.push({
      moduleId: 'purchase-fallback-temp',
      name: 'Purchase Voucher',
      url: '/Purchase',
      icon: 'cart-shopping',
      displayOrder: 98,
      subMenus: []
    });
  }

  const hasReceiptMenu = displayedMenus.some(
    m => m.name?.toLowerCase().includes('receipt') || 
         (m.subMenus && m.subMenus.some(s => s.name?.toLowerCase().includes('receipt')))
  );

  if (!hasReceiptMenu && menus.length > 0) {
    displayedMenus.push({
      moduleId: 'receipt-fallback-temp',
      name: 'Receipt Voucher',
      url: '/Receipt',
      icon: 'receipt',
      displayOrder: 97,
      subMenus: []
    });
  }

  const hasPaymentMenu = displayedMenus.some(
    m => m.name?.toLowerCase().includes('payment') || 
         (m.subMenus && m.subMenus.some(s => s.name?.toLowerCase().includes('payment')))
  );

  if (!hasPaymentMenu && menus.length > 0) {
    displayedMenus.push({
      moduleId: 'payment-fallback-temp',
      name: 'Payment Voucher',
      url: '/Payment',
      icon: 'money-bill-transfer',
      displayOrder: 96,
      subMenus: []
    });
  }

  const hasContraMenu = displayedMenus.some(
    m => m.name?.toLowerCase().includes('contra') || 
         (m.subMenus && m.subMenus.some(s => s.name?.toLowerCase().includes('contra')))
  );

  if (!hasContraMenu && menus.length > 0) {
    displayedMenus.push({
      moduleId: 'contra-fallback-temp',
      name: 'Contra Voucher',
      url: '/Contra',
      icon: 'arrow-right-arrow-left',
      displayOrder: 95,
      subMenus: []
    });
  }

  const hasJournalMenu = displayedMenus.some(
    m => m.name?.toLowerCase().includes('journal') || 
         (m.subMenus && m.subMenus.some(s => s.name?.toLowerCase().includes('journal')))
  );

  if (!hasJournalMenu && menus.length > 0) {
    displayedMenus.push({
      moduleId: 'journal-fallback-temp',
      name: 'Journal Voucher',
      url: '/Journal',
      icon: 'book',
      displayOrder: 94,
      subMenus: []
    });
  }

  const hasTallyMenu = displayedMenus.some(
    m => m.name?.toLowerCase().includes('tally') || 
         (m.subMenus && m.subMenus.some(s => s.name?.toLowerCase().includes('tally')))
  );

  if (!hasTallyMenu && menus.length > 0) {
    displayedMenus.push({
      moduleId: 'tally-fallback-temp',
      name: 'Tally Integration',
      url: '#',
      icon: 'rotate',
      displayOrder: 100,
      subMenus: [
        { moduleId: 'tallysync-sub', name: 'Sync Dashboard', url: '/tallysync' },
        { moduleId: 'tallyconfig-sub', name: 'Settings', url: '/tallyconfig' }
      ]
    });
  }

  const hasReportsMenu = displayedMenus.some(
    m => m.name?.toLowerCase().includes('report') || 
         (m.subMenus && m.subMenus.some(s => s.name?.toLowerCase().includes('report') || s.name?.toLowerCase().includes('profit')))
  );

  if (!hasReportsMenu && menus.length > 0) {
    displayedMenus.push({
      moduleId: 'reports-fallback-temp',
      name: 'Reports',
      url: '#',
      icon: 'chart-line',
      displayOrder: 93,
      subMenus: [
        { moduleId: 'profit-loss-sub', name: 'Profit & Loss A/c', url: '/profit-loss' }
      ]
    });
  } else if (menus.length > 0) {
    const reportsMenu = displayedMenus.find(
      m => m.name?.toLowerCase().includes('report') ||
           (m.subMenus && m.subMenus.some(s => s.name?.toLowerCase().includes('report')))
    );
    if (reportsMenu) {
      if (!reportsMenu.subMenus) reportsMenu.subMenus = [];
      if (!reportsMenu.subMenus.some(s => s.url === '/profit-loss')) {
        reportsMenu.subMenus.push({
          moduleId: 'profit-loss-sub',
          name: 'Profit & Loss A/c',
          url: '/profit-loss'
        });
      }
    }
  }

  if (menus.length > 0) {
    displayedMenus.push({
      moduleId: 'download-apk-fallback-temp',
      name: 'Download Mobile App',
      url: '/download-apk',
      icon: 'mobile-screen-button',
      displayOrder: 101,
      subMenus: []
    });
  }

  return (
    <aside className={`layout-sidebar ${isMobileOpen ? 'open' : ''}`}>
      <div className="sidebar-brand-wrapper">
        <Link to="/" onClick={onCloseMobile} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div style={{ width: '36px', height: '36px', backgroundColor: 'var(--color-primary)', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,63,177,0.3)', flexShrink: 0 }}>
            <i className="fa-solid fa-cubes" style={{ color: '#fff', fontSize: '18px' }}></i>
          </div>
          <div className="sidebar-brand-text" style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-on-surface)', lineHeight: '1.2' }}>SmartERP</span>
            <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', fontWeight: '500' }}>Enterprise Management</span>
          </div>
        </Link>
        <button 
          onClick={onCloseMobile} 
          className="sidebar-close-btn"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
      <nav style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
        {menus.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-outline)' }}>
            <i className="fa-solid fa-circle-notch fa-spin" style={{ marginBottom: '8px' }}></i>
            <div style={{ fontSize: '13px' }}>Loading menus...</div>
          </div>
        ) : (
          displayedMenus.sort((a, b) => a.displayOrder - b.displayOrder).map(menu => (
            <MenuItem key={menu.moduleId} menu={menu} activePath={activePath} onCloseMobile={onCloseMobile} />
          ))
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
