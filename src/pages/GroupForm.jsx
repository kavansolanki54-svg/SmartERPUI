import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Select from 'react-select';
import { getGroupById, saveGroup, getMasterGroups } from '../services/api';

const GroupForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    groupId: 0,
    companyId: 1,
    groupName: '',
    alias: '',
    parentGroupId: '',
    displayOrder: 0,
    activeStatus: 1
  });

  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const groupRes = await getMasterGroups();
        if (groupRes.success && groupRes.data) {
          const groupOptions = groupRes.data
            .filter(g => Number(g.value) !== Number(id)) // Exclude self from parent
            .map(g => ({
              value: Number(g.value),
              label: g.text
            }));
          setGroups(groupOptions);
        }

        if (id) {
          const res = await getGroupById(id);
          if (res.success && res.data) {
            const data = res.data;
            setFormData({
              groupId: data.groupId || parseInt(id),
              companyId: data.companyId || 1,
              groupName: data.groupName || '',
              alias: data.alias || '',
              parentGroupId: data.parentGroupId || '',
              displayOrder: data.displayOrder || 0,
              activeStatus: data.activeStatus ?? 1
            });
          } else {
            toast.error(res.message || "Failed to load group details");
          }
        }
      } catch (err) {
        console.error("Failed to load initial form data", err);
        toast.error("Error loading form dependencies");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.groupName) newErrors.groupName = "Group name is required.";

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
      const payload = {
        ...formData,
        parentGroupId: formData.parentGroupId ? parseInt(formData.parentGroupId) : null,
        displayOrder: parseInt(formData.displayOrder) || 0
      };

      const res = await saveGroup(payload);
      if (res.success) {
        toast.success(id ? "Group updated successfully!" : "Group created successfully!");
        navigate('/group');
      } else {
        toast.error(res.message || "Failed to save group");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--color-on-surface-variant)',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '4px',
    border: '1px solid var(--color-border-structural)',
    outline: 'none',
    fontSize: '13px',
    color: 'var(--color-on-surface)',
    backgroundColor: '#fff',
    transition: 'border-color 0.2s',
    height: '38px'
  };

  const getInputStyle = (fieldName) => ({
    ...inputStyle,
    borderColor: errors[fieldName] ? 'var(--color-error)' : 'var(--color-border-structural)'
  });

  const sectionHeaderStyle = {
    backgroundColor: '#f1f5f9',
    padding: '12px 16px',
    borderRadius: '6px 6px 0 0',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-on-surface-variant)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
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

  const selectedParentGroup = groups.find(g => g.value === Number(formData.parentGroupId)) || null;

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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          {id && (
            <span style={{ backgroundColor: '#e0e7ff', color: 'var(--color-primary)', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Edit Mode</span>
          )}
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={sectionHeaderStyle}>General Information</div>
            <div style={sectionBodyStyle}>
              <div className="form-grid-2" style={{ marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Group Name <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <input
                    type="text"
                    name="groupName"
                    value={formData.groupName}
                    onChange={handleChange}
                    style={getInputStyle('groupName')}
                    placeholder="Enter Group Name"
                  />
                  {errors.groupName && <span style={{ color: 'var(--color-error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.groupName}</span>}
                </div>
                <div>
                  <label style={labelStyle}>Alias</label>
                  <input
                    type="text"
                    name="alias"
                    value={formData.alias}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Enter Alias"
                  />
                </div>
              </div>

              <div className="form-grid-2" style={{ marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Parent Group</label>
                  <Select
                    name="parentGroupId"
                    value={selectedParentGroup}
                    onChange={(option) => setFormData({ ...formData, parentGroupId: option ? option.value : '' })}
                    options={groups}
                    styles={getSingleSelectStyles(false)}
                    placeholder="Choose Parent Group..."
                    isClearable
                  />
                </div>
                <div>
                  <label style={labelStyle}>Display Order</label>
                  <input
                    type="number"
                    name="displayOrder"
                    value={formData.displayOrder}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Enter Display Order"
                  />
                </div>
              </div>

              {/* Status Pill Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '42px',
                  height: '22px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    name="activeStatus"
                    checked={formData.activeStatus === 1}
                    onChange={(e) => setFormData({ ...formData, activeStatus: e.target.checked ? 1 : 0 })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: formData.activeStatus === 1 ? 'var(--color-primary)' : '#cbd5e1',
                    transition: '0.3s',
                    borderRadius: '34px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '16px',
                      width: '16px',
                      left: formData.activeStatus === 1 ? '22px' : '4px',
                      bottom: '3px',
                      backgroundColor: 'white',
                      transition: '0.3s',
                      borderRadius: '50%'
                    }} />
                  </span>
                </label>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-on-surface)' }}>
                  ACTIVE
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="form-actions-row" style={{ paddingBottom: '32px' }}>
          <Link
            to="/group"
            style={{
              backgroundColor: '#fff',
              color: 'var(--color-on-surface-variant)',
              padding: '10px 24px',
              borderRadius: '4px',
              border: '1px solid var(--color-border-structural)',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              textDecoration: 'none'
            }}
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              padding: '10px 24px',
              borderRadius: '4px',
              border: 'none',
              fontWeight: '600',
              fontSize: '13px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
            Save Group
          </button>
        </div>
      </div>
    </>
  );
};

export default GroupForm;
