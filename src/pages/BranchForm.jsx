import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Select from 'react-select';
import { getBranchById, saveBranch, getCountries, getStates } from '../services/api';

const BranchForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    branchId: 0,
    branchName: '',
    branchCode: '',
    branchCountry: '',
    branchState: '',
    city: '',
    emailAddress: '',
    mobileNo: '',
    phoneNo: '',
    address: '',
    activeStatus: 1
  });

  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [errors, setErrors] = useState({});

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch countries
        const countryRes = await getCountries();
        if (countryRes.success && countryRes.data && Array.isArray(countryRes.data)) {
          const formattedCountries = countryRes.data.map(c => ({
            value: c.countryId || c.id || c.value || Object.values(c)[0],
            label: c.countryName || c.name || c.title || c.text || c.description || (Object.values(c).length > 1 ? Object.values(c)[1] : Object.values(c)[0])
          }));
          setCountries(formattedCountries);
        }

        // Fetch branch details if edit mode
        if (id) {
          const branchRes = await getBranchById(id);
          if (branchRes.success && branchRes.data) {
            const data = branchRes.data;
            setFormData({
              ...data,
              branchId: data.branchId || parseInt(id),
              branchName: data.branchName || '',
              branchCode: data.branchCode || '',
              branchCountry: data.branchCountry || '',
              branchState: data.branchState || '',
              city: data.city || data.branchCity || '',
              emailAddress: data.emailAddress || '',
              mobileNo: data.mobileNo || data.mobileNumber || '',
              phoneNo: data.phoneNo || '',
              address: data.address || data.branchAddress || '',
              activeStatus: data.activeStatus ?? 1
            });

            // Fetch states for the loaded country
            if (data.branchCountry) {
              const stateRes = await getStates(data.branchCountry);
              if (stateRes.success && stateRes.data && Array.isArray(stateRes.data)) {
                const formattedStates = stateRes.data.map(s => ({
                  value: s.stateId || s.id || s.value || Object.values(s)[0],
                  label: s.stateName || s.name || s.title || s.text || s.description || (Object.values(s).length > 1 ? Object.values(s)[1] : Object.values(s)[0])
                }));
                setStates(formattedStates);
              }
            }
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
    if (!formData.branchName) newErrors.branchName = "This field is required.";
    if (!formData.branchCode) newErrors.branchCode = "This field is required.";
    if (!formData.emailAddress) newErrors.emailAddress = "This field is required.";
    if (!formData.mobileNo) newErrors.mobileNo = "This field is required.";
    if (!formData.branchCountry) newErrors.branchCountry = "This field is required.";
    if (!formData.branchState) newErrors.branchState = "This field is required.";
    if (!formData.city) newErrors.city = "This field is required.";
    if (!formData.address) newErrors.address = "This field is required.";

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
      const res = await saveBranch(formData);
      if (res.success) {
        toast.success(id ? "Branch updated successfully!" : "Branch created successfully!");
        navigate('/branch');
      } else {
        toast.error(res.message || "Failed to save branch");
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

  const getSingleSelectStyles = (hasError, isDisabled = false) => ({
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
      backgroundColor: isDisabled ? '#f1f5f9' : '#fff',
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

  const selectedCountryOption = countries.find(c => c.value?.toString() === formData.branchCountry?.toString()) || null;
  const selectedStateOption = states.find(s => s.value?.toString() === formData.branchState?.toString()) || null;

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>          {id && (
            <span style={{ backgroundColor: '#e0e7ff', color: 'var(--color-primary)', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Edit Mode</span>
          )}
        </div>

        {/* Form Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* GENERAL INFORMATION */}
          <div>
            <div style={sectionHeaderStyle}>General Information</div>
            <div style={sectionBodyStyle}>
              <div className="form-grid-2" style={{ marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Branch Name <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <input type="text" name="branchName" value={formData.branchName} onChange={handleChange} style={getInputStyle('branchName')} placeholder="e.g. Mumbai Corporate" />
                  {errors.branchName && <span style={{ color: 'var(--color-error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.branchName}</span>}
                </div>
                <div>
                  <label style={labelStyle}>Branch Code <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <input type="text" name="branchCode" value={formData.branchCode} onChange={handleChange} style={getInputStyle('branchCode')} placeholder="e.g. BR-001" />
                  {errors.branchCode && <span style={{ color: 'var(--color-error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.branchCode}</span>}
                </div>
              </div>

              <div className="form-grid-2" style={{ marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Email Address <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <input type="email" name="emailAddress" value={formData.emailAddress} onChange={handleChange} style={getInputStyle('emailAddress')} placeholder="branch@smarterp.com" />
                  {errors.emailAddress && <span style={{ color: 'var(--color-error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.emailAddress}</span>}
                </div>
                <div>
                  <label style={labelStyle}>Mobile Number <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <input type="text" name="mobileNo" value={formData.mobileNo} onChange={handleChange} style={getInputStyle('mobileNo')} placeholder="+91 00000 00000" />
                  {errors.mobileNo && <span style={{ color: 'var(--color-error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.mobileNo}</span>}
                </div>
              </div>

              <div className="form-grid-2">
                <div>
                  <label style={labelStyle}>Phone No.</label>
                  <input type="text" name="phoneNo" value={formData.phoneNo} onChange={handleChange} style={inputStyle} placeholder="022 1234 5678" />
                </div>
              </div>
            </div>
          </div>

          {/* ADDRESS DETAILS */}
          <div>
            <div style={sectionHeaderStyle}>Address Details</div>
            <div style={sectionBodyStyle}>
              <div className="form-grid-3" style={{ marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Branch Country <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <Select
                    name="branchCountry"
                    value={selectedCountryOption}
                    onChange={async (option) => {
                      const value = option ? option.value : '';
                      setFormData({ ...formData, branchCountry: value, branchState: '' });
                      if (errors.branchCountry) setErrors({ ...errors, branchCountry: null });
                      setStates([]);
                      if (value) {
                        try {
                          const stateRes = await getStates(value);
                          if (stateRes.success && stateRes.data && Array.isArray(stateRes.data)) {
                            const formattedStates = stateRes.data.map(s => ({
                              value: s.stateId || s.id || s.value || Object.values(s)[0],
                              label: s.stateName || s.name || s.title || s.text || s.description || (Object.values(s).length > 1 ? Object.values(s)[1] : Object.values(s)[0])
                            }));
                            setStates(formattedStates);
                          }
                        } catch (err) {
                          console.error("Failed to fetch states", err);
                        }
                      }
                    }}
                    options={countries}
                    styles={getSingleSelectStyles(!!errors.branchCountry)}
                    placeholder="Choose..."
                    isClearable
                  />
                  {errors.branchCountry && <span style={{ color: 'var(--color-error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.branchCountry}</span>}
                </div>
                <div>
                  <label style={labelStyle}>Branch State <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <Select
                    name="branchState"
                    value={selectedStateOption}
                    onChange={(option) => {
                      const value = option ? option.value : '';
                      setFormData({ ...formData, branchState: value });
                      if (errors.branchState) setErrors({ ...errors, branchState: null });
                    }}
                    options={states}
                    styles={getSingleSelectStyles(!!errors.branchState, !formData.branchCountry)}
                    placeholder="Choose..."
                    isDisabled={!formData.branchCountry}
                    isClearable
                  />
                  {errors.branchState && <span style={{ color: 'var(--color-error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.branchState}</span>}
                </div>
                <div>
                  <label style={labelStyle}>Branch City <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} style={getInputStyle('city')} placeholder="e.g. Mumbai" />
                  {errors.city && <span style={{ color: 'var(--color-error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.city}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                <div>
                  <label style={labelStyle}>Branch Address <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    style={{ ...getInputStyle('address'), resize: 'vertical', fontFamily: 'inherit' }}
                    placeholder="Full Address"
                  ></textarea>
                  {errors.address && <span style={{ color: 'var(--color-error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.address}</span>}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="form-actions-row">
          <Link to="/branch" style={{ backgroundColor: '#fff', color: 'var(--color-on-surface-variant)', padding: '10px 24px', borderRadius: '4px', border: '1px solid var(--color-border-structural)', fontWeight: '600', fontSize: '13px', cursor: 'pointer', textDecoration: 'none' }}>
            Cancel
          </Link>
          <button onClick={handleSave} disabled={loading} style={{ backgroundColor: 'var(--color-primary)', color: '#fff', padding: '10px 24px', borderRadius: '4px', border: 'none', fontWeight: '600', fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}>
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
            Save Branch
          </button>
        </div>

      </div>
    </>
  );
};

export default BranchForm;
