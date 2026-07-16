import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboardStats } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchStats = async (selectedFilter, start = null, end = null) => {
    setLoading(true);
    try {
      const response = await getDashboardStats(selectedFilter, start, end);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter !== 'custom') {
      fetchStats(filter);
    } else if (startDate && endDate) {
      fetchStats('custom', startDate, endDate);
    } else {
      setLoading(false);
    }
  }, [filter, startDate, endDate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8f9fa', color: 'var(--color-primary)' }}>
        <i className="fa-solid fa-circle-notch fa-spin fa-3x"></i>
      </div>
    );
  }

  const data = stats || {
    totalSales: 0,
    activeLedgers: 0,
    pendingVouchers: 0,
    growth: 0,
    recentTransactions: [],
    chartData: []
  };

  const chartData = data.chartData && data.chartData.length > 0 ? data.chartData : [
    { name: 'Jan', Revenue: 4000, Expenses: 2400 },
    { name: 'Feb', Revenue: 3000, Expenses: 1398 },
    { name: 'Mar', Revenue: 2000, Expenses: 3800 },
    { name: 'Apr', Revenue: 2780, Expenses: 3908 },
    { name: 'May', Revenue: 1890, Expenses: 4800 },
    { name: 'Jun', Revenue: 2390, Expenses: 3800 },
  ];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column' }}>

        {/* Dashboard Header & Controls */}
        <div className="dashboard-header-row">
          <div>
            <h1 className="text-display-lg" style={{ margin: 0, fontSize: '24px', color: 'var(--color-on-surface)' }}>Dashboard Overview</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--color-on-surface-variant)', fontSize: '14px' }}>Real-time enterprise metrics and system status.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--color-border-structural)', padding: '4px', gap: '4px' }}>
            <button
              onClick={() => setFilter('today')}
              style={{
                border: 'none',
                background: filter === 'today' ? 'var(--color-primary)' : 'transparent',
                borderRadius: '6px',
                padding: '6px 16px',
                fontSize: '13px',
                fontWeight: '600',
                color: filter === 'today' ? '#fff' : 'var(--color-on-surface-variant)',
                cursor: 'pointer'
              }}
            >
              Today
            </button>
            <button
              onClick={() => setFilter('30days')}
              style={{
                border: 'none',
                background: filter === '30days' ? 'var(--color-primary)' : 'transparent',
                borderRadius: '6px',
                padding: '6px 16px',
                fontSize: '13px',
                fontWeight: '600',
                color: filter === '30days' ? '#fff' : 'var(--color-on-surface-variant)',
                cursor: 'pointer'
              }}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setFilter('custom')}
              style={{
                border: 'none',
                background: filter === 'custom' ? 'var(--color-primary)' : 'transparent',
                borderRadius: '6px',
                padding: '6px 16px',
                fontSize: '13px',
                fontWeight: '600',
                color: filter === 'custom' ? '#fff' : 'var(--color-on-surface-variant)',
                cursor: 'pointer'
              }}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Custom Date Filters */}
        {filter === 'custom' && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', backgroundColor: '#fff', padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--color-border-structural)', width: 'fit-content' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-on-surface-variant)' }}>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-border-structural)', fontSize: '13px', outline: 'none' }}
            />
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-on-surface-variant)' }}>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-border-structural)', fontSize: '13px', outline: 'none' }}
            />
          </div>
        )}

        {/* KPI Cards Row */}
        <div className="dashboard-kpi-grid">

          {/* Card 1 */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid var(--color-border-structural)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--color-surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                <i className="fa-solid fa-money-bill-wave"></i>
              </div>
              <span style={{ backgroundColor: '#e6f4ea', color: '#137333', padding: '4px 8px', borderRadius: '16px', fontSize: '12px', fontWeight: '600' }}>+{data.growth}%</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-on-surface-variant)', letterSpacing: '0.5px', marginBottom: '8px', textTransform: 'uppercase' }}>Total Sales</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-on-surface)', marginBottom: '8px' }}>{formatCurrency(data.totalSales)}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-outline)' }}><i className="fa-regular fa-clock" style={{ marginRight: '4px' }}></i>vs last month</div>
          </div>

          {/* Card 2 */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid var(--color-border-structural)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--color-surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-on-surface-variant)' }}>
                <i className="fa-solid fa-book"></i>
              </div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-on-surface-variant)', letterSpacing: '0.5px', marginBottom: '8px', textTransform: 'uppercase' }}>Active Ledgers</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-on-surface)', marginBottom: '16px' }}>{data.activeLedgers}</div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-surface-container-high)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--color-primary)' }}></div>
            </div>
          </div>

          {/* Card 3 */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid var(--color-border-structural)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-error)' }}>
                <i className="fa-solid fa-file-invoice"></i>
              </div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-on-surface-variant)', letterSpacing: '0.5px', marginBottom: '8px', textTransform: 'uppercase' }}>Pending Sync Vouchers</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: data.pendingVouchers > 0 ? 'var(--color-error)' : 'var(--color-primary)', marginBottom: '8px' }}>{data.pendingVouchers}</div>
            <div style={{ fontSize: '12px', color: data.pendingVouchers > 0 ? 'var(--color-error)' : 'var(--color-outline)' }}>
              {data.pendingVouchers > 0 ? 'Requires sync with Tally Prime' : 'System is fully synchronized'}
            </div>
          </div>

          {/* Card 4 */}
          <div style={{ backgroundColor: 'var(--color-primary)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', color: '#fff', boxShadow: '0 8px 16px rgba(0,63,177,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <i className="fa-solid fa-arrow-trend-up"></i>
              </div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.5px', marginBottom: '8px', textTransform: 'uppercase' }}>Monthly Growth</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>+{data.growth}%</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Target reached: 94%</div>
          </div>

        </div>

        {/* Main Grid: Chart & Quick Actions */}
        <div className="dashboard-main-grid">

          {/* Chart Card */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--color-border-structural)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-structural)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-on-surface)' }}>Monthly Revenue vs. Expenses</h3>
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></div>
                  Revenue
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-outline-variant)' }}></div>
                  Expenses
                </div>
              </div>
            </div>
            <div style={{ padding: '24px', height: '320px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={0} barSize={24}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-outline)' }} dy={10} />
                  <Tooltip cursor={{ fill: 'var(--color-surface-container-low)' }} />
                  <Bar dataKey="Revenue" fill="var(--color-primary)" />
                  <Bar dataKey="Expenses" fill="var(--color-outline-variant)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--color-border-structural)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-on-surface)' }}>Quick Actions</h3>
            </div>
            <div style={{ padding: '0 24px' }}>

              <Link to="/Sales/create" style={{ display: 'flex', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--color-border-structural)', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--color-surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', marginRight: '16px' }}>
                  <i className="fa-solid fa-file-invoice"></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-on-surface)' }}>Create Sales Invoice</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Record new customer sale</div>
                </div>
                <i className="fa-solid fa-chevron-right" style={{ fontSize: '12px', color: 'var(--color-outline)' }}></i>
              </Link>

              <Link to="/Payment/create" style={{ display: 'flex', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--color-border-structural)', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--color-surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', marginRight: '16px' }}>
                  <i className="fa-solid fa-receipt"></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-on-surface)' }}>Record Payment</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Log supplier or expense payment</div>
                </div>
                <i className="fa-solid fa-chevron-right" style={{ fontSize: '12px', color: 'var(--color-outline)' }}></i>
              </Link>

              <Link to="/tallyconfig" style={{ display: 'flex', alignItems: 'center', padding: '16px 0', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--color-surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', marginRight: '16px' }}>
                  <i className="fa-solid fa-gear"></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-on-surface)' }}>Tally Configuration</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Manage sync endpoints & settings</div>
                </div>
                <i className="fa-solid fa-chevron-right" style={{ fontSize: '12px', color: 'var(--color-outline)' }}></i>
              </Link>

            </div>

            <div style={{ padding: '24px', marginTop: 'auto' }}>
              <div style={{ backgroundColor: 'var(--color-primary)', borderRadius: '8px', padding: '20px', color: '#fff' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Optimize Tally Integration</div>
                <div style={{ fontSize: '13px', lineHeight: '1.4', marginBottom: '16px', color: 'rgba(255,255,255,0.8)' }}>
                  {data.pendingVouchers > 0 ? `You have ${data.pendingVouchers} unsynced vouchers ready.` : 'All vouchers are currently synchronized.'}
                </div>
                <Link 
                  to="/tallysync"
                  style={{ display: 'block', width: '100%', padding: '8px', backgroundColor: '#fff', color: 'var(--color-primary)', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}
                >
                  Go to Sync Panel
                </Link>
              </div>
            </div>

          </div>

        </div>

        {/* Table Section */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--color-border-structural)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-structural)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-on-surface)' }}>Recent Transactions</h3>
          </div>

          <div className="data-table-wrapper" style={{ padding: '0 8px' }}>
            <table className="data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-outline)', fontWeight: '700', borderBottom: '1px solid var(--color-border-structural)' }}>Date</th>
                  <th style={{ padding: '16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-outline)', fontWeight: '700', borderBottom: '1px solid var(--color-border-structural)' }}>Voucher Type</th>
                  <th style={{ padding: '16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-outline)', fontWeight: '700', borderBottom: '1px solid var(--color-border-structural)' }}>Ledger Name</th>
                  <th style={{ padding: '16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-outline)', fontWeight: '700', borderBottom: '1px solid var(--color-border-structural)' }}>Amount</th>
                  <th style={{ padding: '16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-outline)', fontWeight: '700', borderBottom: '1px solid var(--color-border-structural)' }}>Tally Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.length > 0 ? (
                  data.recentTransactions.map((tx, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '16px', fontSize: '13px', color: 'var(--color-on-surface)', borderBottom: '1px solid var(--color-border-structural)' }}>{tx.date}</td>
                      <td style={{ padding: '16px', fontSize: '13px', color: 'var(--color-on-surface)', borderBottom: '1px solid var(--color-border-structural)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className={tx.icon} style={{ color: 'var(--color-primary)' }}></i> {tx.voucherType}
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: 'var(--color-on-surface)', borderBottom: '1px solid var(--color-border-structural)' }}>{tx.ledgerName}</td>
                      <td style={{ padding: '16px', fontSize: '13px', fontWeight: '600', color: 'var(--color-on-surface)', borderBottom: '1px solid var(--color-border-structural)' }}>{formatCurrency(tx.amount)}</td>
                      <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border-structural)' }}>
                        <span 
                          className="badge" 
                          style={{ 
                            backgroundColor: tx.status === 'Synced' ? '#e6f4ea' : '#fef7e0', 
                            color: tx.status === 'Synced' ? '#137333' : '#b06000', 
                            padding: '4px 12px', 
                            borderRadius: '16px', 
                            fontSize: '11px', 
                            fontWeight: '600' 
                          }}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-outline)' }}>No transactions found for the selected period</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
