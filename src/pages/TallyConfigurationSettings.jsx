import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getTallyConfigurations, saveTallyConfiguration, testTallyConnection } from '../services/api';

const TallyConfigurationSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connected'); // 'Connected', 'Disconnected', 'Testing'

  const [formData, setFormData] = useState({
    tallyConfigId: 0,
    tallyUrl: 'http://localhost',
    port: 9000,
    isOdbcEnabled: true,
    syncFrequency: 'Real-time',
    syncLedgers: true,
    syncGroups: true,
    syncItems: true,
    syncVouchers: false,
    autoSync: true,
    syncIntervalMinutes: 30,
    activeStatus: 1
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      // Fetch the first configuration for the company
      const response = await getTallyConfigurations();
      if (response.success && response.data && response.data.length > 0) {
        setFormData(response.data[0]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load Tally configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleToggle = (name) => {
    setFormData(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        port: parseInt(formData.port),
        syncIntervalMinutes: parseInt(formData.syncIntervalMinutes),
        activeStatus: 1
      };
      
      const response = await saveTallyConfiguration(payload);
      if (response.success) {
        toast.success(response.message || 'Configuration saved successfully');
        if (response.data) {
          setFormData(response.data);
        }
      } else {
        toast.error(response.message || 'Failed to save configuration');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while saving');
    } finally {
      setLoading(false);
    }
  };

  const checkTallyConnection = async (url, port) => {
    try {
      const response = await testTallyConnection({ tallyUrl: url, port: parseInt(port) });
      if (response.success) {
        setConnectionStatus('Connected');
      } else {
        if (response.message && response.message.includes('Disconnected')) {
          setConnectionStatus('Disconnected');
        } else {
          setConnectionStatus('Error');
        }
      }
    } catch (error) {
      setConnectionStatus('Disconnected');
    }
  };

  useEffect(() => {
    if (!formData.tallyUrl || !formData.port) return;
    
    // Initial check
    checkTallyConnection(formData.tallyUrl, formData.port);

    // Set interval for continuous checking
    const intervalId = setInterval(() => {
      checkTallyConnection(formData.tallyUrl, formData.port);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [formData.tallyUrl, formData.port]);

  const testConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('Testing');
    
    try {
      const response = await testTallyConnection({ tallyUrl: formData.tallyUrl, port: parseInt(formData.port) });

      if (response.success) {
        setConnectionStatus('Connected');
        toast.success('Connection to Tally Server successful!');
      } else {
        if (response.message && response.message.includes('Disconnected')) {
          setConnectionStatus('Disconnected');
          toast.error('Tally is not running or unreachable.');
        } else {
          setConnectionStatus('Error');
          toast.error('Tally responded with an error.');
        }
      }
    } catch (error) {
      setConnectionStatus('Disconnected');
      toast.error('Tally is not running or unreachable.');
    } finally {
      setTestingConnection(false);
    }
  };

  // Switch component
  const ToggleSwitch = ({ checked, onChange, label, subLabel }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', backgroundColor: '#fff' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{label}</span>
        {subLabel && <span style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{subLabel}</span>}
      </div>
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
    </div>
  );

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8f9fa', minHeight: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>Tally ERP 9 / Prime Integration</h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', backgroundColor: connectionStatus === 'Connected' ? '#dcfce7' : connectionStatus === 'Testing' ? '#fef3c7' : connectionStatus === 'Error' ? '#ffedd5' : '#fee2e2', borderRadius: '100px', alignSelf: 'flex-start' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: connectionStatus === 'Connected' ? '#22c55e' : connectionStatus === 'Testing' ? '#f59e0b' : connectionStatus === 'Error' ? '#f97316' : '#ef4444' }}></div>
            <span style={{ fontSize: '12px', fontWeight: '500', color: connectionStatus === 'Connected' ? '#16a34a' : connectionStatus === 'Testing' ? '#d97706' : connectionStatus === 'Error' ? '#c2410c' : '#dc2626' }}>
              Connection Status: {connectionStatus}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={testConnection} 
            disabled={testingConnection}
            style={{ padding: '10px 16px', backgroundColor: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: testingConnection ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            {testingConnection && <i className="fa-solid fa-circle-notch fa-spin"></i>}
            Test Connection
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            style={{ padding: '10px 16px', backgroundColor: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-save"></i>}
            Save Configuration
          </button>
        </div>
      </div>

      {loading && !formData.tallyConfigId ? (
        <div style={{ textAlign: 'center', padding: '40px' }}><i className="fa-solid fa-circle-notch fa-spin fa-2x color-primary"></i></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Connection Settings */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff' }}>
            <div style={{ padding: '12px 16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#374151' }}>Connection Settings</h3>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Tally Server URL</label>
                  <input type="text" name="tallyUrl" value={formData.tallyUrl} onChange={handleChange} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', outline: 'none' }} />
                  <span style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>Enter the IP or hostname where Tally is running.</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Port</label>
                  <input type="number" name="port" value={formData.port} onChange={handleChange} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', outline: 'none' }} />
                  <span style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>Default XML port for Tally is usually 9000.</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#f0f4f8', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>ODBC Enabled</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Allow Open Database Connectivity for advanced reporting.</p>
                </div>
                <div 
                  onClick={() => handleToggle('isOdbcEnabled')}
                  style={{ width: '40px', height: '24px', borderRadius: '12px', backgroundColor: formData.isOdbcEnabled ? '#1d4ed8' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}
                >
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '2px', left: formData.isOdbcEnabled ? '18px' : '2px', transition: 'all 0.3s' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Sync Preferences */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff' }}>
            <div style={{ padding: '12px 16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#374151' }}>Sync Preferences</h3>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '24px', maxWidth: '300px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Auto-Sync Frequency</label>
                <select name="syncFrequency" value={formData.syncFrequency} onChange={handleChange} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}>
                  <option value="Real-time">Real-time</option>
                  <option value="Hourly">Hourly</option>
                  <option value="Daily">Daily</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#2563eb' }}>
                <i className="fa-solid fa-network-wired" style={{ fontSize: '14px' }}></i>
                <span style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '0.5px' }}>MASTER SYNC</span>
              </div>
              <div style={{ height: '1px', backgroundColor: '#e5e7eb', marginBottom: '16px' }}></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <ToggleSwitch label="Sync Ledgers" checked={formData.syncLedgers} onChange={() => handleToggle('syncLedgers')} />
                <ToggleSwitch label="Sync Groups" checked={formData.syncGroups} onChange={() => handleToggle('syncGroups')} />
                <ToggleSwitch label="Sync Items" checked={formData.syncItems} onChange={() => handleToggle('syncItems')} />
                <ToggleSwitch label="Sync Vouchers" checked={formData.syncVouchers} onChange={() => handleToggle('syncVouchers')} />
              </div>

              <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '6px', border: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <i className="fa-solid fa-clock-rotate-left" style={{ color: '#6b7280', fontSize: '18px' }}></i>
                  <div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '500', color: '#111827' }}>Last Successful Sync</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>12 minutes ago (1,452 records processed)</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/tallysync')}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
                >
                  Manual Trigger
                </button>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <i className="fa-regular fa-circle-question"></i> Help Documentation
            </span>
            <span 
              onClick={() => navigate('/tallysync')}
              style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-list-ul"></i> Integration Logs
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TallyConfigurationSettings;
