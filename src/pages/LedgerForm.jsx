import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Select from 'react-select';
import { getLedgerById, saveLedger, getMasterGroups } from '../services/api';

const LedgerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    ledgerId: 0,
    companyId: 1,
    ledgerName: '',
    alias: '',
    groupId: '',
    mailingName: '',
    address1: '',
    address2: '',
    address3: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    mobileNo: '',
    phoneNo: '',
    email: '',
    website: '',
    isBankDetailsRequired: false,
    bankName: '',
    branchName: '',
    accountNo: '',
    ifscCode: '',
    panNo: '',
    gstin: '',
    tanNo: '',
    openingBalance: 0,
    balanceType: 'DR',
    openingBalanceDate: '',
    activeStatus: true
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
          const groupOptions = groupRes.data.map(g => ({
            value: Number(g.value),
            label: g.text
          }));
          setGroups(groupOptions);
        }

        if (id) {
          const res = await getLedgerById(id);
          if (res.success && res.data) {
            const data = res.data;
            setFormData({
              ledgerId: data.ledgerId || parseInt(id),
              companyId: data.companyId || 1,
              ledgerName: data.ledgerName || '',
              alias: data.alias || '',
              groupId: data.groupId || '',
              mailingName: data.mailingName || '',
              address1: data.address1 || '',
              address2: data.address2 || '',
              address3: data.address3 || '',
              city: data.city || '',
              state: data.state || '',
              country: data.country || '',
              pincode: data.pincode || '',
              mobileNo: data.mobileNo || '',
              phoneNo: data.phoneNo || '',
              email: data.email || '',
              website: data.website || '',
              isBankDetailsRequired: data.isBankDetailsRequired || false,
              bankName: data.bankName || '',
              branchName: data.branchName || '',
              accountNo: data.accountNo || '',
              ifscCode: data.ifscCode || '',
              panNo: data.panNo || '',
              gstin: data.gstin || '',
              tanNo: data.tanNo || '',
              openingBalance: data.openingBalance || 0,
              balanceType: data.balanceType || 'DR',
              openingBalanceDate: data.openingBalanceDate ? data.openingBalanceDate.split('T')[0] : '',
              activeStatus: data.activeStatus ?? true
            });
          } else {
            toast.error(res.message || "Failed to load ledger details");
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
    if (!formData.ledgerName) newErrors.ledgerName = "Ledger name is required.";
    if (!formData.groupId) newErrors.groupId = "Group is required.";
    if (!formData.balanceType) newErrors.balanceType = "Balance type is required.";

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
        groupId: parseInt(formData.groupId),
        openingBalance: parseFloat(formData.openingBalance) || 0,
        openingBalanceDate: formData.openingBalanceDate || null,
        email: formData.email ? (formData.email.trim() || null) : null,
        website: formData.website ? (formData.website.trim() || null) : null
      };

      const res = await saveLedger(payload);
      if (res.success) {
        toast.success(id ? "Ledger updated successfully!" : "Ledger created successfully!");
        navigate('/ledger');
      } else {
        toast.error(res.message || "Failed to save ledger");
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

  const selectedGroup = groups.find(g => g.value === Number(formData.groupId)) || null;

  const balanceTypeOptions = [
    { value: 'DR', label: 'DR' },
    { value: 'CR', label: 'CR' }
  ];
  const selectedBalanceType = balanceTypeOptions.find(o => o.value === formData.balanceType) || null;

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
          
          {/* General Information */}
          <div>
            <div style={sectionHeaderStyle}>General Information</div>
            <div style={sectionBodyStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Ledger Name <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <input
                    type="text"
                    name="ledgerName"
                    value={formData.ledgerName}
                    onChange={handleChange}
                    style={getInputStyle('ledgerName')}
                    placeholder="Enter Ledger Name"
                  />
                  {errors.ledgerName && <span style={{ color: 'var(--color-error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.ledgerName}</span>}
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
                <div>
                  <label style={labelStyle}>Group <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <Select
                    name="groupId"
                    value={selectedGroup}
                    onChange={(option) => {
                      setFormData({ ...formData, groupId: option ? option.value : '' });
                      if (errors.groupId) setErrors({ ...errors, groupId: null });
                    }}
                    options={groups}
                    styles={getSingleSelectStyles(!!errors.groupId)}
                    placeholder="Choose Group..."
                    isClearable
                  />
                  {errors.groupId && <span style={{ color: 'var(--color-error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.groupId}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Opening Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    name="openingBalance"
                    value={formData.openingBalance}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Balance Type <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <Select
                    name="balanceType"
                    value={selectedBalanceType}
                    onChange={(option) => {
                      setFormData({ ...formData, balanceType: option ? option.value : '' });
                      if (errors.balanceType) setErrors({ ...errors, balanceType: null });
                    }}
                    options={balanceTypeOptions}
                    styles={getSingleSelectStyles(!!errors.balanceType)}
                    placeholder="Choose Type..."
                  />
                  {errors.balanceType && <span style={{ color: 'var(--color-error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.balanceType}</span>}
                </div>
                <div>
                  <label style={labelStyle}>Opening Balance Date</label>
                  <input
                    type="date"
                    name="openingBalanceDate"
                    value={formData.openingBalanceDate}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>
              </div>

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
                    checked={formData.activeStatus}
                    onChange={handleChange}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: formData.activeStatus ? 'var(--color-primary)' : '#cbd5e1',
                    transition: '0.3s',
                    borderRadius: '34px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '16px',
                      width: '16px',
                      left: formData.activeStatus ? '22px' : '4px',
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

          {/* Contact Details */}
          <div>
            <div style={sectionHeaderStyle}>Contact Details</div>
            <div style={sectionBodyStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Mailing Name</label>
                  <input type="text" name="mailingName" value={formData.mailingName} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Website</label>
                  <input type="url" name="website" value={formData.website} onChange={handleChange} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Address 1</label>
                  <input type="text" name="address1" value={formData.address1} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Address 2</label>
                  <input type="text" name="address2" value={formData.address2} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Address 3</label>
                  <input type="text" name="address3" value={formData.address3} onChange={handleChange} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>State</label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Country</label>
                  <input type="text" name="country" value={formData.country} onChange={handleChange} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={labelStyle}>Pincode</label>
                  <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Mobile No</label>
                  <input type="text" name="mobileNo" value={formData.mobileNo} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Phone No</label>
                  <input type="text" name="phoneNo" value={formData.phoneNo} onChange={handleChange} style={inputStyle} />
                </div>
              </div>
            </div>
          </div>

          {/* Tax Details */}
          <div>
            <div style={sectionHeaderStyle}>Tax Details</div>
            <div style={sectionBodyStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={labelStyle}>PAN No</label>
                  <input type="text" name="panNo" value={formData.panNo} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>GSTIN</label>
                  <input type="text" name="gstin" value={formData.gstin} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>TAN No</label>
                  <input type="text" name="tanNo" value={formData.tanNo} onChange={handleChange} style={inputStyle} />
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <div style={sectionHeaderStyle}>Bank Details</div>
            <div style={sectionBodyStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <input
                  type="checkbox"
                  name="isBankDetailsRequired"
                  checked={formData.isBankDetailsRequired}
                  onChange={handleChange}
                  id="isBankDetailsRequired"
                />
                <label htmlFor="isBankDetailsRequired" style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-on-surface)' }}>
                  Bank Details Required?
                </label>
              </div>

              {formData.isBankDetailsRequired && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                  <div>
                    <label style={labelStyle}>Bank Name</label>
                    <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Branch Name</label>
                    <input type="text" name="branchName" value={formData.branchName} onChange={handleChange} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Account No</label>
                    <input type="text" name="accountNo" value={formData.accountNo} onChange={handleChange} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>IFSC Code</label>
                    <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} style={inputStyle} />
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '32px', paddingBottom: '32px' }}>
          <Link
            to="/ledger"
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
            Save Ledger
          </button>
        </div>
      </div>
    </>
  );
};

export default LedgerForm;
