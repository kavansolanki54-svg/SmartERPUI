import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getMobileAppMenusByCompany, saveMobileAppMenus, getMobileAppActiveModules } from '../services/api';

const MobileAppMenu = () => {
  const [availableMenus, setAvailableMenus] = useState([]);
  const [activeMenuIds, setActiveMenuIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadModulesAndConfig = async () => {
      setLoading(true);
      try {
        const [modulesRes, activeRes] = await Promise.all([
          getMobileAppActiveModules(),
          getMobileAppMenusByCompany()
        ]);
        if (modulesRes.success && modulesRes.data) {
          setAvailableMenus(modulesRes.data);
        }
        if (activeRes.success && activeRes.data) {
          const activeIds = activeRes.data.map(m => m.menuId);
          setActiveMenuIds(activeIds);
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setLoading(false);
      }
    };
    loadModulesAndConfig();
  }, []);

  const handleCheckboxChange = (menuId) => {
    if (activeMenuIds.includes(menuId)) {
      setActiveMenuIds(activeMenuIds.filter(id => id !== menuId));
    } else {
      setActiveMenuIds([...activeMenuIds, menuId]);
    }
  };

  const handleSelectAll = () => {
    const allChildIds = [];
    availableMenus.forEach(cat => {
      cat.children.forEach(child => {
        allChildIds.push(child.id);
      });
    });

    if (activeMenuIds.length === allChildIds.length) {
      setActiveMenuIds([]);
    } else {
      setActiveMenuIds(allChildIds);
    }
  };

  const handleCategorySelectAll = (cat) => {
    const catChildIds = cat.children.map(child => child.id);
    const isAllChecked = catChildIds.every(id => activeMenuIds.includes(id));
    
    if (isAllChecked) {
      setActiveMenuIds(activeMenuIds.filter(id => !catChildIds.includes(id)));
    } else {
      const newActive = [...activeMenuIds];
      catChildIds.forEach(id => {
        if (!newActive.includes(id)) newActive.push(id);
      });
      setActiveMenuIds(newActive);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const companyId = user.companyId || 1;

      const payload = [];
      availableMenus.forEach(cat => {
        cat.children.forEach(child => {
          payload.push({
            id: 0,
            companyId: companyId,
            menuId: child.id,
            menuName: child.name,
            activeStatus: activeMenuIds.includes(child.id) ? 1 : 0
          });
        });
      });

      const res = await saveMobileAppMenus(payload);
      if (res.success) {
        toast.success('Mobile App menu mapping updated successfully!');
      } else {
        toast.error(res.message || 'Failed to save configuration');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const totalModulesCount = availableMenus.reduce((acc, cat) => acc + cat.children.length, 0);

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '20px', padding: '32px' }}>
      
      {/* Top Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-display-lg" style={{ margin: 0, fontSize: '24px', color: 'var(--color-on-surface)' }}>Mobile App Menu Mapping</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-on-surface-variant)', fontSize: '14px' }}>Configure and map active mobile menu categories for this company.</p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => window.location.reload()}
            disabled={loading || saving}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--color-on-surface-variant)', 
              fontSize: '13px', 
              fontWeight: '600', 
              cursor: (loading || saving) ? 'not-allowed' : 'pointer'
            }}
          >
            Discard Changes
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || loading}
            style={{ 
              backgroundColor: 'var(--color-primary)', 
              color: '#fff', 
              border: 'none', 
              padding: '10px 24px', 
              borderRadius: '6px', 
              fontSize: '13px', 
              fontWeight: '600', 
              cursor: (saving || loading) ? 'not-allowed' : 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              opacity: (saving || loading) ? 0.6 : 1 
            }}
          >
            {saving ? (
              <i className="fa-solid fa-circle-notch fa-spin"></i>
            ) : (
              <i className="fa-solid fa-floppy-disk"></i>
            )}
            Save Configuration
          </button>
        </div>
      </div>

      {/* Menus List Grid */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--color-border-structural)', overflow: 'hidden', position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: 'var(--color-primary)' }}></i>
          </div>
        )}

        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border-structural)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '600', color: 'var(--color-on-surface)' }}>Mobile App Menu Modules ({totalModulesCount})</span>
          {availableMenus.length > 0 && (
            <button 
              onClick={handleSelectAll}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              {activeMenuIds.length === totalModulesCount ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        <div style={{ padding: '24px' }}>
          {availableMenus.length === 0 && !loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-outline)' }}>
              No active database modules found to assign.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {availableMenus.map((category) => {
                const catChildIds = category.children.map(child => child.id);
                const isAllCatChecked = catChildIds.every(id => activeMenuIds.includes(id));
                const catIcon = category.icon.includes('fa-') ? category.icon : `fa-solid fa-${category.icon}`;

                return (
                  <div key={category.id} style={{ border: '1px solid var(--color-border-structural)', borderRadius: '8px', overflow: 'hidden' }}>
                    {/* Category Title Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '12px 20px', borderBottom: '1px solid var(--color-border-structural)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className={catIcon} style={{ color: 'var(--color-primary)', fontSize: '15px' }}></i>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-on-surface)' }}>{category.name}</span>
                      </div>
                      <button 
                        onClick={() => handleCategorySelectAll(category)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        {isAllCatChecked ? 'Deselect Category' : 'Select Category'}
                      </button>
                    </div>

                    {/* Category Children Modules */}
                    <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {category.children.map((child) => {
                        const isChecked = activeMenuIds.includes(child.id);
                        const iconClass = child.icon.includes('fa-') ? child.icon : `fa-solid fa-${child.icon}`;
                        return (
                          <div 
                            key={child.id} 
                            onClick={() => handleCheckboxChange(child.id)}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '16px', 
                              padding: '12px 16px', 
                              borderRadius: '6px', 
                              border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--color-border-structural)', 
                              backgroundColor: isChecked ? 'rgba(0, 63, 177, 0.02)' : 'transparent',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (!isChecked) e.currentTarget.style.borderColor = 'var(--color-outline)';
                            }}
                            onMouseLeave={(e) => {
                              if (!isChecked) e.currentTarget.style.borderColor = 'var(--color-border-structural)';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => {}} // handled by parent div click
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                            </div>
                            
                            <div style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: isChecked ? 'var(--color-primary)' : 'var(--color-surface-container-low)', color: isChecked ? '#fff' : 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <i className={iconClass} style={{ fontSize: '14px' }}></i>
                            </div>

                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-on-surface)' }}>{child.name}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileAppMenu;
