import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Select from 'react-select';
import { getRoleMastersDropdown, getAccessControlHierarchy, saveRolePermissions } from '../services/api';

const AccessControl = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await getRoleMastersDropdown(1);
        if (res.success && res.data) {
          setRoles(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch roles", err);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    if (!selectedRole) {
      setPermissions([]);
      return;
    }
    
    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const res = await getAccessControlHierarchy(selectedRole);
        if (res.success && res.data) {
          setPermissions(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch hierarchy", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPermissions();
  }, [selectedRole]);

  const handleCheckboxChange = (catIndex, childIndex, permissionType) => {
    const updatedPermissions = [...permissions];
    const module = updatedPermissions[catIndex].children[childIndex];
    
    module[permissionType] = !module[permissionType];
    
    // If setting a higher permission like add/edit/delete, automatically grant 'view'
    if (module[permissionType] && permissionType !== 'view') {
      module.view = true;
    }

    // If removing 'view', remove everything else since you can't edit what you can't see
    if (!module[permissionType] && permissionType === 'view') {
      module.add = false;
      module.edit = false;
      module.delete = false;
    }

    setPermissions(updatedPermissions);
  };

  const handleSelectAllRow = (catIndex, childIndex) => {
    const updatedPermissions = [...permissions];
    const module = updatedPermissions[catIndex].children[childIndex];
    const isAllSelected = module.view && module.add && module.edit && module.delete;
    
    module.view = !isAllSelected;
    module.add = !isAllSelected;
    module.edit = !isAllSelected;
    module.delete = !isAllSelected;
    
    setPermissions(updatedPermissions);
  };

  const handleCategorySelectAll = (catIndex) => {
    const updatedPermissions = [...permissions];
    const category = updatedPermissions[catIndex];
    
    if (!category.children) return;

    const isAllSelected = category.children.every(mod => 
      mod.view && mod.add && mod.edit && mod.delete
    );
    
    const targetState = !isAllSelected;
    
    category.children.forEach(mod => {
      mod.view = targetState;
      mod.add = targetState;
      mod.edit = targetState;
      mod.delete = targetState;
    });
    
    setPermissions(updatedPermissions);
  };

  const handleCategoryColumnSelect = (catIndex, permissionType) => {
    const updatedPermissions = [...permissions];
    const category = updatedPermissions[catIndex];
    if (!category.children) return;

    const isAllSelected = category.children.every(mod => mod[permissionType]);
    const targetState = !isAllSelected;

    category.children.forEach(mod => {
      mod[permissionType] = targetState;
      // Enforce hierarchy logic
      if (targetState && permissionType !== 'view') {
        mod.view = true;
      }
      if (!targetState && permissionType === 'view') {
        mod.add = false;
        mod.edit = false;
        mod.delete = false;
      }
    });

    setPermissions(updatedPermissions);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const flatPermissions = [];
      permissions.forEach(cat => {
        let catView = !!cat.view;
        let catAdd = !!cat.add;
        let catEdit = !!cat.edit;
        let catDelete = !!cat.delete;

        // Ensure parent has permissions if any child does
        if (cat.children && cat.children.length > 0) {
           catView = cat.children.some(mod => mod.view) || catView;
           catAdd = cat.children.some(mod => mod.add) || catAdd;
           catEdit = cat.children.some(mod => mod.edit) || catEdit;
           catDelete = cat.children.some(mod => mod.delete) || catDelete;
        }

        // Push parent category
        flatPermissions.push({
          moduleId: cat.moduleId,
          view: catView,
          add: catAdd,
          edit: catEdit,
          delete: catDelete
        });

        // Push children
        if (cat.children) {
          cat.children.forEach(mod => {
            flatPermissions.push({
              moduleId: mod.moduleId,
              view: !!mod.view,
              add: !!mod.add,
              edit: !!mod.edit,
              delete: !!mod.delete
            });
          });
        }
      });

      const payload = {
        roleId: parseInt(selectedRole),
        permissions: flatPermissions
      };
      
      const res = await saveRolePermissions(payload);
      if (res.success || res.Message === "Permissions saved successfully") {
        toast.success('Permissions saved successfully');
        setSelectedRole('');
        setPermissions([]);
      } else {
        toast.error(res.message || 'Failed to save permissions');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const toggleCollapse = (moduleId) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const renderCheckbox = (catIndex, childIndex, permissionType, isChecked) => (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <input 
        type="checkbox" 
        checked={isChecked || false}
        onChange={() => handleCheckboxChange(catIndex, childIndex, permissionType)}
        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
      />
    </div>
  );

  const getSelectedRoleName = () => {
    const role = roles.find(r => (r.value || r.Value)?.toString() === selectedRole?.toString());
    return role ? (role.text || role.Text || role.label) : '';
  };

  const rolesOptions = roles.map(r => ({
    value: (r.value || r.Value)?.toString(),
    label: r.text || r.Text || r.label
  }));

  const selectedRoleOption = rolesOptions.find(o => o.value === selectedRole?.toString()) || null;

  const getSelectStyles = (isDisabled) => ({
    control: (provided, state) => ({
      ...provided,
      borderColor: 'var(--color-border-structural)',
      boxShadow: state.isFocused ? '0 0 0 1px var(--color-primary)' : 'none',
      '&:hover': {
        borderColor: 'var(--color-primary)',
      },
      fontSize: '14px',
      height: '42px',
      borderRadius: '6px',
      backgroundColor: isDisabled ? '#f1f5f9' : '#fff',
      paddingLeft: '28px',
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 8px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '40px',
    }),
  });

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Control Bar */}
      <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--color-border-structural)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-on-surface-variant)', textTransform: 'uppercase' }}>Select Role to Configure</label>
          <div style={{ position: 'relative', width: '300px' }}>
            <Select
              name="roleSelect"
              value={selectedRoleOption}
              onChange={(option) => setSelectedRole(option ? option.value : '')}
              options={rolesOptions}
              styles={getSelectStyles(loading || saving)}
              placeholder="Select Role..."
              isDisabled={loading || saving}
              isClearable
            />
            <i className="fa-solid fa-shield-halved" style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--color-primary)', fontSize: '14px', zIndex: 2 }}></i>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={() => {
              if(selectedRole) {
                const fetchPermissions = async () => {
                  setLoading(true);
                  try {
                    const res = await getAccessControlHierarchy(selectedRole);
                    if (res.success && res.data) setPermissions(res.data);
                  } catch (err) {} finally { setLoading(false); }
                };
                fetchPermissions();
              }
            }}
            style={{ background: 'none', border: 'none', color: 'var(--color-on-surface-variant)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            Discard Changes
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || !selectedRole}
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: (saving || !selectedRole) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: (saving || !selectedRole) ? 0.6 : 1 }}
          >
            {saving ? (
              <i className="fa-solid fa-circle-notch fa-spin"></i>
            ) : (
              <i className="fa-solid fa-floppy-disk"></i>
            )}
            Save Permissions
          </button>
        </div>
      </div>

      {/* Permissions Grid */}
      <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--color-border-structural)', overflow: 'hidden', position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: 'var(--color-primary)' }}></i>
          </div>
        )}
        
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid var(--color-border-structural)' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: 'var(--color-on-surface)', width: '35%' }}>Application Module</th>
              <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: 'var(--color-on-surface-variant)', width: '11%' }}>Select All</th>
              <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: 'var(--color-on-surface-variant)', width: '13%' }}>View</th>
              <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: 'var(--color-on-surface-variant)', width: '13%' }}>Create (Add)</th>
              <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: 'var(--color-on-surface-variant)', width: '13%' }}>Edit</th>
              <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: 'var(--color-on-surface-variant)', width: '13%' }}>Delete</th>
            </tr>
          </thead>
          <tbody>
            {!selectedRole ? (
              <tr>
                <td colSpan="6" style={{ padding: '64px 32px', textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
                  <i className="fa-solid fa-hand-pointer" style={{ fontSize: '32px', marginBottom: '16px', opacity: 0.4, color: 'var(--color-primary)' }}></i>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-on-surface)' }}>No Role Selected</div>
                  <div style={{ fontSize: '13px', marginTop: '6px' }}>Please select a role from the dropdown above to configure its access permissions.</div>
                </td>
              </tr>
            ) : permissions.length === 0 && !loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-outline)' }}>
                  No modules found for this role.
                </td>
              </tr>
            ) : (
              permissions.map((cat, catIndex) => (
              <React.Fragment key={cat.moduleId}>
                {/* Category Header */}
                <tr 
                  style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid var(--color-border-structural)', cursor: 'pointer' }}
                  onClick={() => toggleCollapse(cat.moduleId)}
                >
                  <td style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className={`fa-solid fa-chevron-${collapsedCategories[cat.moduleId] ? 'right' : 'down'}`} style={{ fontSize: '10px' }}></i>
                      {cat.name}
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={cat.children && cat.children.length > 0 && cat.children.every(mod => mod.view && mod.add && mod.edit && mod.delete)}
                        onChange={() => handleCategorySelectAll(catIndex)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={cat.children && cat.children.length > 0 && cat.children.every(mod => mod.view)}
                        onChange={() => handleCategoryColumnSelect(catIndex, 'view')}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={cat.children && cat.children.length > 0 && cat.children.every(mod => mod.add)}
                        onChange={() => handleCategoryColumnSelect(catIndex, 'add')}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={cat.children && cat.children.length > 0 && cat.children.every(mod => mod.edit)}
                        onChange={() => handleCategoryColumnSelect(catIndex, 'edit')}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={cat.children && cat.children.length > 0 && cat.children.every(mod => mod.delete)}
                        onChange={() => handleCategoryColumnSelect(catIndex, 'delete')}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                      />
                    </div>
                  </td>
                </tr>
                {/* Modules under Category */}
                {!collapsedCategories[cat.moduleId] && cat.children && cat.children.map((mod, childIndex) => {
                  const isAllSelected = mod.view && mod.add && mod.edit && mod.delete;
                  return (
                    <tr key={mod.moduleId} style={{ borderBottom: '1px solid var(--color-border-structural)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: '500', color: 'var(--color-on-surface)' }}>{mod.name}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={isAllSelected || false}
                            onChange={() => handleSelectAllRow(catIndex, childIndex)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>{renderCheckbox(catIndex, childIndex, 'view', mod.view)}</td>
                      <td style={{ padding: '14px 16px' }}>{renderCheckbox(catIndex, childIndex, 'add', mod.add)}</td>
                      <td style={{ padding: '14px 16px' }}>{renderCheckbox(catIndex, childIndex, 'edit', mod.edit)}</td>
                      <td style={{ padding: '14px 16px' }}>{renderCheckbox(catIndex, childIndex, 'delete', mod.delete)}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            )))}
          </tbody>
        </table>
      </div>

      {/* Info Note */}
      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <i className="fa-solid fa-circle-info" style={{ color: '#3b82f6', fontSize: '18px', marginTop: '2px' }}></i>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a' }}>Permission Policy Note</span>
          <span style={{ fontSize: '12px', color: '#1e40af', lineHeight: '1.5' }}>
            Changes to role permissions will take effect immediately for all users assigned to the <strong style={{ color: '#1e3a8a' }}>{getSelectedRoleName() || 'selected'}</strong> role. Users currently logged in may need to refresh their session to see updated navigation menus and action buttons.
          </span>
        </div>
      </div>

    </div>
  );
};

export default AccessControl;
