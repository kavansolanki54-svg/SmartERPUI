import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  getTallySyncStats, 
  syncTallyMasters, 
  syncTallyVouchers, 
  getTallySyncLogs, 
  getTallyConfigurations 
} from '../services/api';

const TallySyncDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sync'); // 'sync' or 'logs'
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [syncingMasters, setSyncingMasters] = useState(false);
  const [syncingVouchers, setSyncingVouchers] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connected');
  
  const [stats, setStats] = useState({
    totalGroups: 0,
    pendingGroups: 0,
    totalLedgers: 0,
    pendingLedgers: 0,
    totalVouchers: 0,
    pendingVouchers: 0
  });

  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null); // For modal popup
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStats();
    fetchConfig();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, filterType, filterStatus]);

  const fetchConfig = async () => {
    try {
      const response = await getTallyConfigurations();
      if (response.success && response.data && response.data.length > 0) {
        // Connection status verified
        setConnectionStatus('Connected');
      } else {
        setConnectionStatus('Not Configured');
      }
    } catch {
      setConnectionStatus('Disconnected');
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await getTallySyncStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load Tally Sync stats');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await getTallySyncLogs(filterType, filterStatus);
      if (response.success && response.data) {
        setLogs(response.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load sync logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSyncMasters = async () => {
    setSyncingMasters(true);
    try {
      const response = await syncTallyMasters();
      if (response.success) {
        toast.success(response.data?.message || 'Masters synced successfully!');
        fetchStats();
        if (activeTab === 'logs') fetchLogs();
      } else {
        toast.error(response.message || 'Master sync failed.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Master sync failed due to server error.');
    } finally {
      setSyncingMasters(false);
    }
  };

  const handleSyncVouchers = async () => {
    setSyncingVouchers(true);
    try {
      const response = await syncTallyVouchers();
      if (response.success) {
        toast.success(response.data?.message || 'Vouchers synced successfully!');
        fetchStats();
        if (activeTab === 'logs') fetchLogs();
      } else {
        toast.error(response.message || 'Voucher sync failed.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Voucher sync failed due to server error.');
    } finally {
      setSyncingVouchers(false);
    }
  };

  // Filter logs locally by search query
  const filteredLogs = logs.filter(log => {
    const term = searchQuery.toLowerCase();
    if (!term) return true;
    return (
      (log.tallyVoucherNumber && log.tallyVoucherNumber.toLowerCase().includes(term)) ||
      (log.syncType && log.syncType.toLowerCase().includes(term)) ||
      (log.errorMessage && log.errorMessage.toLowerCase().includes(term)) ||
      (log.id && log.id.toString().includes(term))
    );
  });

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8f9fa', minHeight: '100%', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Tally Sync Dashboard</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Synchronize your ledgers, groups, and vouchers directly to Tally ERP 9 / Prime.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '6px 14px', 
            backgroundColor: connectionStatus === 'Connected' ? '#dcfce7' : '#fee2e2', 
            borderRadius: '100px',
            border: `1px solid ${connectionStatus === 'Connected' ? '#bbf7d0' : '#fecaca'}`
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: connectionStatus === 'Connected' ? '#22c55e' : '#ef4444' }}></div>
            <span style={{ fontSize: '12px', fontWeight: '600', color: connectionStatus === 'Connected' ? '#16a34a' : '#dc2626' }}>
              Tally Server: {connectionStatus}
            </span>
          </div>
          <button 
            onClick={() => navigate('/tallyconfig')}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#fff', 
              color: '#475569', 
              border: '1px solid #cbd5e1', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontSize: '13px', 
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            <i className="fa-solid fa-cog"></i> Settings
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '24px', gap: '24px' }}>
        <button 
          onClick={() => setActiveTab('sync')}
          style={{ 
            padding: '12px 4px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'sync' ? '2px solid #2563eb' : '2px solid transparent', 
            color: activeTab === 'sync' ? '#2563eb' : '#64748b', 
            fontWeight: activeTab === 'sync' ? '600' : '500', 
            fontSize: '15px', 
            cursor: 'pointer' 
          }}
        >
          <i className="fa-solid fa-sync" style={{ marginRight: '8px' }}></i> Sync Controls
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          style={{ 
            padding: '12px 4px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'logs' ? '2px solid #2563eb' : '2px solid transparent', 
            color: activeTab === 'logs' ? '#2563eb' : '#64748b', 
            fontWeight: activeTab === 'logs' ? '600' : '500', 
            fontSize: '15px', 
            cursor: 'pointer' 
          }}
        >
          <i className="fa-solid fa-list-ul" style={{ marginRight: '8px' }}></i> Integration Logs
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'sync' && (
        <div>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
            
            {/* Card 1: Groups */}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Group Master</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#2563eb' }}>
                  <i className="fa-solid fa-folder-open"></i>
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', lineHeight: '1' }}>{stats.totalGroups}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Pending Sync</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: stats.pendingGroups > 0 ? '#ea580c' : '#16a34a', backgroundColor: stats.pendingGroups > 0 ? '#ffedd5' : '#dcfce7', padding: '2px 8px', borderRadius: '100px' }}>
                  {stats.pendingGroups} records
                </span>
              </div>
            </div>

            {/* Card 2: Ledgers */}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ledger Master</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f0fdf4', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#16a34a' }}>
                  <i className="fa-solid fa-address-book"></i>
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', lineHeight: '1' }}>{stats.totalLedgers}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Pending Sync</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: stats.pendingLedgers > 0 ? '#ea580c' : '#16a34a', backgroundColor: stats.pendingLedgers > 0 ? '#ffedd5' : '#dcfce7', padding: '2px 8px', borderRadius: '100px' }}>
                  {stats.pendingLedgers} records
                </span>
              </div>
            </div>

            {/* Card 3: Vouchers */}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Voucher Sync</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#faf5ff', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#9333ea' }}>
                  <i className="fa-solid fa-file-invoice"></i>
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', lineHeight: '1' }}>{stats.totalVouchers}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Pending Sync</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: stats.pendingVouchers > 0 ? '#ea580c' : '#16a34a', backgroundColor: stats.pendingVouchers > 0 ? '#ffedd5' : '#dcfce7', padding: '2px 8px', borderRadius: '100px' }}>
                  {stats.pendingVouchers} records
                </span>
              </div>
            </div>

          </div>

          {/* Action Sections */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Box 1: Sync Masters */}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Sync Master Data</h3>
              <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                Push all newly created or updated groups and accounts (ledgers) from SmartERP to Tally. This ensures matching database entities before voucher syncing.
              </p>
              <button 
                onClick={handleSyncMasters}
                disabled={syncingMasters || connectionStatus === 'Disconnected'}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  backgroundColor: '#2563eb', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontWeight: '600', 
                  fontSize: '14px', 
                  cursor: (syncingMasters || connectionStatus === 'Disconnected') ? 'not-allowed' : 'pointer',
                  opacity: (syncingMasters || connectionStatus === 'Disconnected') ? 0.7 : 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 1px 2px rgba(37,99,235,0.2)',
                  transition: 'all 0.2s'
                }}
              >
                {syncingMasters ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i> Syncing Masters...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-folder-tree"></i> Sync Masters (Groups & Ledgers)
                  </>
                )}
              </button>
            </div>

            {/* Box 2: Sync Vouchers */}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Sync Voucher Transactions</h3>
              <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                Transfer all pending financial transactions (Sales, Purchases, Payments, Receipts, Contras, Journals) to Tally ERP 9 / Prime XML engine.
              </p>
              <button 
                onClick={handleSyncVouchers}
                disabled={syncingVouchers || connectionStatus === 'Disconnected'}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  backgroundColor: '#9333ea', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontWeight: '600', 
                  fontSize: '14px', 
                  cursor: (syncingVouchers || connectionStatus === 'Disconnected') ? 'not-allowed' : 'pointer',
                  opacity: (syncingVouchers || connectionStatus === 'Disconnected') ? 0.7 : 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 1px 2px rgba(147,51,234,0.2)',
                  transition: 'all 0.2s'
                }}
              >
                {syncingVouchers ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i> Syncing Vouchers...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-receipt"></i> Sync Voucher Transactions
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          
          {/* Filters Bar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#fafafa' }}>
            
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input 
                type="text" 
                placeholder="Search logs (Voucher No, Type, Errors)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <div style={{ width: '160px' }}>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', backgroundColor: '#fff' }}
              >
                <option value="">All Sync Types</option>
                <option value="Group">Group Master</option>
                <option value="Ledger">Ledger Master</option>
                <option value="SalesVoucher">Sales Voucher</option>
                <option value="PurchaseVoucher">Purchase Voucher</option>
                <option value="PaymentVoucher">Payment Voucher</option>
                <option value="ReceiptVoucher">Receipt Voucher</option>
                <option value="ContraVoucher">Contra Voucher</option>
                <option value="JournalVoucher">Journal Voucher</option>
              </select>
            </div>

            <div style={{ width: '140px' }}>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', backgroundColor: '#fff' }}
              >
                <option value="">All Statuses</option>
                <option value="1">Success</option>
                <option value="2">Failed</option>
              </select>
            </div>

            <button 
              onClick={fetchLogs}
              style={{ padding: '8px 12px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center' }}
            >
              <i className="fa-solid fa-arrows-rotate"></i> Refresh
            </button>
          </div>

          {/* Logs Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 20px', fontWeight: '600' }}>ID</th>
                  <th style={{ padding: '12px 20px', fontWeight: '600' }}>Sync Date</th>
                  <th style={{ padding: '12px 20px', fontWeight: '600' }}>Type</th>
                  <th style={{ padding: '12px 20px', fontWeight: '600' }}>Voucher No</th>
                  <th style={{ padding: '12px 20px', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '12px 20px', fontWeight: '600' }}>Errors / Message</th>
                  <th style={{ padding: '12px 20px', fontWeight: '600', textAlign: 'center' }}>XML Details</th>
                </tr>
              </thead>
              <tbody>
                {loadingLogs ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ marginBottom: '8px' }}></i>
                      <div>Loading integration logs...</div>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No synchronization logs found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', hover: { backgroundColor: '#f8fafc' } }}>
                      <td style={{ padding: '12px 20px', color: '#64748b' }}>{log.id}</td>
                      <td style={{ padding: '12px 20px', color: '#334155' }}>
                        {new Date(log.syncDate).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 20px', fontWeight: '500', color: '#334155' }}>
                        {log.syncType}
                      </td>
                      <td style={{ padding: '12px 20px', color: '#334155' }}>
                        {log.tallyVoucherNumber || '-'}
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '100px', 
                          fontSize: '11px', 
                          fontWeight: '600',
                          backgroundColor: log.status === 1 ? '#dcfce7' : '#fee2e2',
                          color: log.status === 1 ? '#15803d' : '#b91c1c'
                        }}>
                          {log.status === 1 ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', color: log.status === 1 ? '#64748b' : '#ef4444', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.errorMessage || 'Successful Sync'}
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                        <button 
                          onClick={() => setSelectedLog(log)}
                          style={{ 
                            padding: '4px 8px', 
                            backgroundColor: '#eff6ff', 
                            color: '#2563eb', 
                            border: 'none', 
                            borderRadius: '4px', 
                            fontSize: '12px', 
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          <i className="fa-solid fa-code"></i> View XML
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* XML Code Viewer Modal */}
      {selectedLog && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 
        }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '90%', maxWidth: '800px', height: '80%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                  Sync Details (ID: {selectedLog.id})
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{selectedLog.syncType} - {new Date(selectedLog.syncDate).toLocaleString()}</span>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {selectedLog.errorMessage && (
                <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', color: '#991b1b', fontSize: '13px' }}>
                  <strong>Error Message:</strong> {selectedLog.errorMessage}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1 }}>
                
                {/* Request XML */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Request XML Sent to Tally</span>
                  <textarea 
                    readOnly
                    value={selectedLog.requestXml || ''}
                    style={{ flex: 1, minHeight: '300px', padding: '12px', fontFamily: 'monospace', fontSize: '12px', backgroundColor: '#1e293b', color: '#e2e8f0', border: 'none', borderRadius: '6px', resize: 'none', outline: 'none' }}
                  />
                </div>

                {/* Response XML */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Response XML Received from Tally</span>
                  <textarea 
                    readOnly
                    value={selectedLog.responseXml || ''}
                    style={{ flex: 1, minHeight: '300px', padding: '12px', fontFamily: 'monospace', fontSize: '12px', backgroundColor: '#1e293b', color: '#e2e8f0', border: 'none', borderRadius: '6px', resize: 'none', outline: 'none' }}
                  />
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
              <button 
                onClick={() => setSelectedLog(null)}
                style={{ padding: '8px 16px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TallySyncDashboard;
