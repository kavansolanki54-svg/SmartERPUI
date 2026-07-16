import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { getCompany, updateCompany, getCountries, getStates, API_URL } from '../services/api';

const Company = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const getInitialCompanyId = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      return u.companyId || '';
    }
    return '';
  };

  const [formData, setFormData] = useState({
    companyId: getInitialCompanyId(),
    companyName: '',
    email: '',
    fullAddress: '',
    cityName: '',
    countryId: '',
    stateId: '',
    pincode: '',
    logoUrl: ''
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const countriesRes = await getCountries();
        if (countriesRes.success && countriesRes.data) {
          const formatted = countriesRes.data.map(c => ({ value: c.value, label: c.text }));
          setCountries(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch countries", err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchStatesData = async () => {
      if (formData.countryId) {
        try {
          const statesRes = await getStates(formData.countryId);
          if (statesRes.success && statesRes.data) {
            const formatted = statesRes.data.map(s => ({ value: s.value, label: s.text }));
            setStates(formatted);
          }
        } catch (err) {
          console.error("Failed to fetch states", err);
        }
      } else {
        setStates([]);
      }
    };
    fetchStatesData();
  }, [formData.countryId]);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const userStr = localStorage.getItem('user');
        let compId = '';
        if (userStr) {
           const u = JSON.parse(userStr);
           compId = u.companyId || '';
        }
        
        if (!compId) {
          setLoading(false);
          return;
        }

        const response = await getCompany(compId);
        if (response.success && response.data && response.data.length > 0) {
          const comp = response.data[0];
          setFormData({
            companyId: comp.companyId || compId,
            companyName: comp.companyName || '',
            email: comp.email || '',
            fullAddress: comp.fullAddress || '',
            cityName: comp.cityName || '',
            countryId: comp.countryId || '',
            stateId: comp.stateId || '',
            pincode: comp.pincode || '',
            logoUrl: comp.logoUrl || ''
          });
          if (comp.logoUrl) {
             setPreviewUrl(comp.logoUrl);
          }
        }
      } catch (error) {
        console.error("Failed to fetch company", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompanyData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (selectedOption, actionMeta) => {
    setFormData({ ...formData, [actionMeta.name]: selectedOption ? selectedOption.value : '' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
         data.append(key, formData[key] === null ? '' : formData[key]);
      });
      
      if (logoFile) {
         data.append('logoFile', logoFile);
      }
      
      const response = await updateCompany(formData.companyId, data);
      
      if (response.success) {
         setMessage('Company details updated successfully!');
         // Reset file input state since it's saved
         setLogoFile(null);
      } else {
         setMessage(response.message || 'Failed to update company.');
      }
    } catch (error) {
      console.error("Update failed", error);
      setMessage('An error occurred while saving.');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  if (loading) {
    return (
      <>
         <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: 'var(--color-primary)' }}></i>
         </div>
      </>
    );
  }

  return (
    <>
      <div className="dashboard-header-row">
        <div>
          <h1 className="text-display-lg" style={{ margin: 0, fontSize: '24px', color: 'var(--color-on-surface)' }}>Company Master</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-on-surface-variant)', fontSize: '14px' }}>Manage organizational hierarchy and regulatory details.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
           <button type="button" style={{ padding: '10px 20px', border: '1px solid var(--color-border-structural)', backgroundColor: '#fff', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
           <button onClick={handleSubmit} disabled={saving} style={{ padding: '10px 20px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {saving ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
              Save Changes
           </button>
        </div>
      </div>

      {message && (
        <div style={{ padding: '16px', marginBottom: '24px', borderRadius: '8px', backgroundColor: message.includes('success') ? '#e6f4ea' : '#fce8e6', color: message.includes('success') ? '#137333' : '#c5221f', border: `1px solid ${message.includes('success') ? '#ceead6' : '#fad2cf'}` }}>
          {message}
        </div>
      )}

      <div className="dashboard-main-grid">
        
        {/* Left Column Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
           
           {/* Basic Information */}
           <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--color-border-structural)', padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-on-surface)' }}>
                 <i className="fa-solid fa-circle-info" style={{ color: 'var(--color-primary)' }}></i> Basic Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                 <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--color-on-surface)', marginBottom: '8px' }}>Company Name *</label>
                    <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="input-field" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border-structural)' }} />
                 </div>
              </div>
           </div>

           {/* Address Details */}
           <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--color-border-structural)', padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-on-surface)' }}>
                 <i className="fa-solid fa-location-dot" style={{ color: 'var(--color-primary)' }}></i> Address Details
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--color-on-surface)', marginBottom: '8px' }}>Full Address</label>
                    <textarea name="fullAddress" value={formData.fullAddress} onChange={handleChange} rows="3" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border-structural)', resize: 'vertical', fontFamily: 'inherit' }}></textarea>
                 </div>
                 
                 <div className="form-grid-2">
                    <div>
                       <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--color-on-surface)', marginBottom: '8px' }}>City</label>
                       <input type="text" name="cityName" value={formData.cityName} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border-structural)' }} />
                    </div>
                    <div>
                       <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--color-on-surface)', marginBottom: '8px' }}>Country</label>
                       <Select 
                          name="countryId"
                          value={countries.find(c => String(c.value) === String(formData.countryId)) || null}
                          onChange={handleSelectChange}
                          options={countries}
                          placeholder="Select Country"
                          isClearable
                          styles={{
                            control: (base) => ({
                              ...base,
                              padding: '2px',
                              borderRadius: '6px',
                              border: '1px solid var(--color-border-structural)',
                              boxShadow: 'none',
                              '&:hover': {
                                border: '1px solid var(--color-outline)'
                              }
                            })
                          }}
                       />
                    </div>
                    <div>
                       <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--color-on-surface)', marginBottom: '8px' }}>State</label>
                       <Select 
                          name="stateId"
                          value={states.find(s => String(s.value) === String(formData.stateId)) || null}
                          onChange={handleSelectChange}
                          options={states}
                          placeholder="Select State"
                          isDisabled={!formData.countryId}
                          isClearable
                          styles={{
                            control: (base) => ({
                              ...base,
                              padding: '2px',
                              borderRadius: '6px',
                              border: '1px solid var(--color-border-structural)',
                              boxShadow: 'none',
                              '&:hover': {
                                border: '1px solid var(--color-outline)'
                              }
                            })
                          }}
                       />
                    </div>
                    <div>
                       <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--color-on-surface)', marginBottom: '8px' }}>Pincode</label>
                       <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border-structural)' }} />
                    </div>
                 </div>
              </div>
           </div>

        </div>

        {/* Right Column Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
           
           {/* Company Logo */}
           <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--color-border-structural)', padding: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--color-on-surface)', marginBottom: '16px' }}>Company Logo</label>
              
              <div style={{ border: '2px dashed var(--color-border-structural)', borderRadius: '8px', padding: '32px', textAlign: 'center', backgroundColor: 'var(--color-surface-container-lowest)', position: 'relative', overflow: 'hidden' }}>
                 {previewUrl ? (
                    <div style={{ position: 'relative', width: '100%', height: '120px' }}>
                       <img src={previewUrl.startsWith('blob:') ? previewUrl : `${API_URL}${previewUrl}`} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                       <button 
                          onClick={(e) => { e.preventDefault(); setLogoFile(null); setPreviewUrl(''); setFormData({...formData, logoUrl: ''}); }}
                          style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--color-error)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                          <i className="fa-solid fa-xmark" style={{ fontSize: '10px' }}></i>
                       </button>
                    </div>
                 ) : (
                    <div>
                       <i className="fa-regular fa-image" style={{ fontSize: '32px', color: 'var(--color-outline)', marginBottom: '12px' }}></i>
                       <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Click to upload or drag & drop</p>
                       <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-outline)' }}>PNG, JPG up to 2MB</p>
                    </div>
                 )}
                 <input 
                    type="file" 
                    accept="image/png, image/jpeg" 
                    onChange={handleFileChange}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
                 />
              </div>
           </div>

           {/* Contact Info */}
           <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--color-border-structural)', padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-on-surface)' }}>
                 <i className="fa-regular fa-address-book" style={{ color: 'var(--color-primary)' }}></i> Contact Info
              </h3>
              
              <div>
                 <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--color-on-surface)', marginBottom: '8px' }}>Email Address</label>
                 <input type="email" name="email" value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border-structural)' }} />
              </div>
           </div>

        </div>

      </div>
    </>
  );
};

export default Company;
