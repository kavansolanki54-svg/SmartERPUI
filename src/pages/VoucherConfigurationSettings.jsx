import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getVoucherConfigurations, saveVoucherConfigurationsBatch, getLookups } from '../services/api';

const VoucherConfigurationSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // State for the list of vouchers
  const [vouchers, setVouchers] = useState([]);
  
  // State for global settings (applies to all vouchers on save)
  const [globalSettings, setGlobalSettings] = useState({
    resetNumberingPeriod: 1, // 1 = Yearly, 2 = Monthly, 3 = Continuous (Assuming mapping)
    prefillWithZero: true,
    strictSequenceEnforcement: false,
    alertOnSequenceGap: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getVoucherConfigurations();
      if (response.success && response.data) {
        let loadedVouchers = response.data;
        
        // If DB is empty, initialize by fetching from Lookups
        if (loadedVouchers.length === 0) {
          const lookupResponse = await getLookups(10);
          if (lookupResponse.success && lookupResponse.data) {
            loadedVouchers = lookupResponse.data.map(l => ({
              name: l.text,
              code: l.text.substring(0, 3).toUpperCase(),
              abbreviation: l.text.substring(0, 3).toUpperCase(),
              voucherCategory: parseInt(l.value) || 1,
              prefix: `${l.text.substring(0, 2).toUpperCase()}/`,
              suffix: '/2023-24',
              startingNumber: 1,
              widthOfNumericalPart: 4,
              methodOfNumbering: 1,
              activeStatus: 1
            }));
          }
        } else {
          // Sync global settings based on the first voucher (assuming they are consistent)
          const first = loadedVouchers[0];
          setGlobalSettings({
            resetNumberingPeriod: first.resetNumberingPeriod || 1,
            prefillWithZero: first.prefillWithZero || false,
            strictSequenceEnforcement: first.strictSequenceEnforcement || false,
            alertOnSequenceGap: first.alertOnSequenceGap || false
          });
        }
        setVouchers(loadedVouchers);
      } else {
        toast.error(response.message || 'Failed to load voucher configurations from server');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleVoucherChange = (index, field, value) => {
    const updated = [...vouchers];
    updated[index] = { ...updated[index], [field]: value };
    setVouchers(updated);
  };

  const generatePreview = (v) => {
    if (v.methodOfNumbering === 2) return 'Manual'; // Assuming 2 is Manual
    
    const pfx = v.prefix || '';
    const sfx = v.suffix || '';
    
    let numStr = v.startingNumber ? v.startingNumber.toString() : '1';
    
    // Apply zero padding if enabled globally
    if (globalSettings.prefillWithZero && v.widthOfNumericalPart > 0) {
      numStr = numStr.padStart(v.widthOfNumericalPart, '0');
    }
    
    return `${pfx}${numStr}${sfx}`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Apply global settings to all vouchers before saving
      const payload = vouchers.map(v => ({
        ...v,
        resetNumberingPeriod: parseInt(globalSettings.resetNumberingPeriod),
        prefillWithZero: globalSettings.prefillWithZero,
        strictSequenceEnforcement: globalSettings.strictSequenceEnforcement,
        alertOnSequenceGap: globalSettings.alertOnSequenceGap,
        widthOfNumericalPart: parseInt(v.widthOfNumericalPart) || 0,
        startingNumber: parseInt(v.startingNumber) || 1,
        methodOfNumbering: parseInt(v.methodOfNumbering) || 1
      }));

      const response = await saveVoucherConfigurationsBatch(payload);
      if (response.success) {
        toast.success(response.message || 'Voucher configurations saved successfully');
        if (response.data) {
          setVouchers(response.data);
        }
      } else {
        toast.error(response.message || 'Failed to save configurations');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    fetchData(); // Reload from DB
  };

  const Switch = ({ checked, onChange }) => (
    <div 
      onClick={onChange}
      style={{ 
        width: '40px', height: '24px', borderRadius: '12px', 
        backgroundColor: checked ? '#1d4ed8' : '#e5e7eb', 
        position: 'relative', cursor: 'pointer', transition: 'all 0.3s' 
      }}
    >
      <div style={{ 
        width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fff', 
        position: 'absolute', top: '2px', left: checked ? '18px' : '2px', 
        transition: 'all 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
      }} />
    </div>
  );

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8f9fa', minHeight: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>Voucher Numbering Configuration</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>Define logic for unique document identification</p>
        </div>
        <div style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', borderRadius: '16px', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
          FY 2023-24
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}><i className="fa-solid fa-circle-notch fa-spin fa-2x color-primary"></i></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Table Card */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569', width: '15%' }}>VOUCHER TYPE</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569', width: '15%' }}>NUMBERING METHOD</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569', width: '15%' }}>PREFIX</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569', width: '15%' }}>SUFFIX</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569', width: '10%' }}>START NO.</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569', width: '10%' }}>WIDTH</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569', width: '20%' }}>PREVIEW</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((v, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '500', color: '#334155' }}>
                        {v.name}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <select 
                          value={v.methodOfNumbering} 
                          onChange={(e) => handleVoucherChange(index, 'methodOfNumbering', e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', outline: 'none' }}
                        >
                          <option value={1}>Automatic</option>
                          <option value={2}>Manual</option>
                          <option value={3}>None</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <input 
                          type="text" 
                          value={v.prefix || ''} 
                          onChange={(e) => handleVoucherChange(index, 'prefix', e.target.value)}
                          disabled={parseInt(v.methodOfNumbering) !== 1}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', outline: 'none' }} 
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <input 
                          type="text" 
                          value={v.suffix || ''} 
                          onChange={(e) => handleVoucherChange(index, 'suffix', e.target.value)}
                          disabled={parseInt(v.methodOfNumbering) !== 1}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', outline: 'none' }} 
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <input 
                          type="number" 
                          value={v.startingNumber || ''} 
                          onChange={(e) => handleVoucherChange(index, 'startingNumber', e.target.value)}
                          disabled={parseInt(v.methodOfNumbering) !== 1}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', outline: 'none' }} 
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <input 
                          type="number" 
                          value={v.widthOfNumericalPart || ''} 
                          onChange={(e) => handleVoucherChange(index, 'widthOfNumericalPart', e.target.value)}
                          disabled={parseInt(v.methodOfNumbering) !== 1}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', outline: 'none' }} 
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: '#2563eb', fontWeight: '500', fontSize: '12px', padding: '4px 8px', backgroundColor: '#eff6ff', borderRadius: '4px' }}>
                          {generatePreview(v)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', backgroundColor: '#fff' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={handleDiscard}
                  style={{ padding: '8px 16px', backgroundColor: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                >
                  Discard
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  style={{ padding: '8px 24px', backgroundColor: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '4px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {saving ? <i className="fa-solid fa-circle-notch fa-spin"></i> : null}
                  Save & Apply
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Settings Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Restart Numbering */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Restart Numbering</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="resetNumberingPeriod" 
                    value={1} 
                    checked={parseInt(globalSettings.resetNumberingPeriod) === 1}
                    onChange={(e) => setGlobalSettings({...globalSettings, resetNumberingPeriod: e.target.value})}
                    style={{ accentColor: '#1d4ed8', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '13px', color: '#475569' }}>Restart every Financial Year</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="resetNumberingPeriod" 
                    value={2} 
                    checked={parseInt(globalSettings.resetNumberingPeriod) === 2}
                    onChange={(e) => setGlobalSettings({...globalSettings, resetNumberingPeriod: e.target.value})}
                    style={{ accentColor: '#1d4ed8', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '13px', color: '#475569' }}>Restart every Month</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="resetNumberingPeriod" 
                    value={3} 
                    checked={parseInt(globalSettings.resetNumberingPeriod) === 3}
                    onChange={(e) => setGlobalSettings({...globalSettings, resetNumberingPeriod: e.target.value})}
                    style={{ accentColor: '#1d4ed8', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '13px', color: '#475569' }}>Never Restart (Continuous)</span>
                </label>
              </div>
            </div>

            {/* Advance Settings */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Advance Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#475569' }}>Enable Zero Padding</span>
                  <Switch 
                    checked={globalSettings.prefillWithZero} 
                    onChange={() => setGlobalSettings(p => ({...p, prefillWithZero: !p.prefillWithZero}))} 
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#475569' }}>Strict Sequence Enforcement</span>
                  <Switch 
                    checked={globalSettings.strictSequenceEnforcement} 
                    onChange={() => setGlobalSettings(p => ({...p, strictSequenceEnforcement: !p.strictSequenceEnforcement}))} 
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#475569' }}>Alert on Sequence Gap</span>
                  <Switch 
                    checked={globalSettings.alertOnSequenceGap} 
                    onChange={() => setGlobalSettings(p => ({...p, alertOnSequenceGap: !p.alertOnSequenceGap}))} 
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherConfigurationSettings;
