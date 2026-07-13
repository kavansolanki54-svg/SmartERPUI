import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Select from 'react-select';
import { getRoleById, saveRole, getLookups } from '../services/api';

const RoleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [formData, setFormData] = useState({
    roleMasterId: 0,
    companyId: user.companyId || 1,
    roleName: '',
    roleTypeId: '',
    descriptions: '',
    activeStatus: 1
  });

  const [loading, setLoading] = useState(false);
  const [roleTypes, setRoleTypes] = useState([]);
  const [errors, setErrors] = useState({});

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch lookups for Role Type (TypeId = 1)
        const typeRes = await getLookups(1);
        if (typeRes.success && typeRes.data && Array.isArray(typeRes.data)) {
          const formattedTypes = typeRes.data.map(t => ({
            value: t.value || t.Value || Object.values(t)[0],
            label: t.text || t.Text || t.lookupName || t.LookupName || Object.values(t)[1]
          }));
          setRoleTypes(formattedTypes);
        }

        // Fetch role details if edit mode
        if (id) {
          const res = await getRoleById(id);
          if (res.success && res.data) {
            const data = res.data;
            setFormData({
              ...data,
              roleMasterId: data.roleMasterId || parseInt(id),
              companyId: data.companyId || user.companyId || 1,
              roleName: data.roleName || '',
              roleTypeId: data.roleTypeId || '',
              descriptions: data.descriptions || '',
              activeStatus: data.activeStatus ?? 1
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.roleName) newErrors.roleName = "This field is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await saveRole(formData);
      if (res.success) {
        toast.success(id ? "Role updated successfully!" : "Role created successfully!");
        navigate('/role');
      } else {
        toast.error(res.message || "Failed to save role");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '4px',
    border: '1px solid var(--color-border-structural)',
    outline: 'none',
    fontSize: '13px',
    color: 'var(--color-on-surface)'
  };

  const getInputStyle = (fieldName) => ({
    ...inputStyle,
    borderColor: errors[fieldName] ? 'var(--color-error)' : 'var(--color-border-structural)'
  });

  const getSelectStyle = (fieldName, isDisabled = false) => ({
    ...inputStyle,
    backgroundColor: isDisabled ? '#f1f5f9' : '#fff',
    appearance: 'auto',
    borderColor: errors[fieldName] ? 'var(--color-error)' : 'var(--color-border-structural)'
  });

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--color-on-surface-variant)',
    marginBottom: '6px',
    textTransform: 'uppercase'
  };

  const sectionHeaderStyle = {
    backgroundColor: '#f1f5f9',
    padding: '12px 16px',
    borderRadius: '6px 6px 0 0',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-on-surface-variant)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const sectionBodyStyle = {
    padding: '24px',
    backgroundColor: '#fff',
    border: '1px solid var(--color-border-structural)',
    borderTop: 'none',
    borderRadius: '0 0 6px 6px'
  };

  const getSingleSelectStyles = (hasError) => ({
    control: (provided, state) => ({
      ...provided,
      borderColor: hasError
        ? 'var(--color-error)'
        : state.isFocused
          ? 'var(--color-primary)'
          : 'var(--color-border-structural)',
      boxShadow: state.isFocused ? '0 0 0 1px var(--color-primary)' : 'none',
      '&:hover': {
        borderColor: 'var(--color-primary)',
      },
      fontSize: '13px',
      height: '38px',
      borderRadius: '4px',
      backgroundColor: '#fff',
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 8px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '36px',
    }),
  });

  const selectedRoleTypeOption = roleTypes.find(t => t.value?.toString() === formData.roleTypeId?.toString()) || null;

  if (loading && id) {
    return (
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100%', padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <i className="fa-solid fa-circle-notch fa-spin fa-3x" style={{ color: 'var(--color-primary)' }}></i>
      </div>
    );
  }

  return (
    <>
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100%' }}>

        {/* Header Title Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          {id && (
            <span style={{ backgroundColor: '#e0e7ff', color: 'var(--color-primary)', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Edit Mode</span>
          )}
        </div>

        {/* Form Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* GENERAL INFORMATION */}
          <div>
            <div style={sectionHeaderStyle}>General Information</div>
            <div style={sectionBodyStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Role Name <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <input type="text" name="roleName" value={formData.roleName} onChange={handleChange} style={getInputStyle('roleName')} placeholder="e.g. Admin" />
                  {errors.roleName && <span style={{ color: 'var(--color-error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.roleName}</span>}
                </div>
                <div>
                  <label style={labelStyle}>Role Type</label>
                  <Select
                    name="roleTypeId"
                    value={selectedRoleTypeOption}
                    onChange={(option) => setFormData({ ...formData, roleTypeId: option ? option.value : '' })}
                    options={roleTypes}
                    styles={getSingleSelectStyles(false)}
                    placeholder="Choose..."
                    isClearable
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    name="descriptions"
                    value={formData.descriptions}
                    onChange={handleChange}
                    rows="3"
                    style={{ ...getInputStyle('descriptions'), resize: 'vertical', fontFamily: 'inherit' }}
                    placeholder="Enter role description..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '32px' }}>
          <Link to="/role" style={{ backgroundColor: '#fff', color: 'var(--color-on-surface-variant)', padding: '10px 24px', borderRadius: '4px', border: '1px solid var(--color-border-structural)', fontWeight: '600', fontSize: '13px', cursor: 'pointer', textDecoration: 'none' }}>
            Cancel
          </Link>
          <button onClick={handleSave} disabled={loading} style={{ backgroundColor: 'var(--color-primary)', color: '#fff', padding: '10px 24px', borderRadius: '4px', border: 'none', fontWeight: '600', fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}>
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
            Save Role
          </button>
        </div>

      </div>
    </>
  );
};

export default RoleForm;
