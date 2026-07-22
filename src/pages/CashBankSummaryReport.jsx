import React, { useState, useEffect } from 'react';
import { getCashBankSummary, getGroupDetails, getLedgerMonthlySummary, getVoucherRegister } from '../services/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CashBankSummaryReport = () => {
  const today = new Date();

  // Calculate current financial year start (April 1st) and end (March 31st of next year)
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;

  const formatDateString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const defaultStartDate = formatDateString(new Date(fyStartYear, 3, 1)); // April 1st
  const defaultEndDate = formatDateString(new Date(fyStartYear + 1, 2, 31)); // March 31st next year

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Expandable sections for Level 1
  const [expandedSections, setExpandedSections] = useState({
    cashInHand: true,
    bankAccounts: true,
    bankOD: true
  });

  const toggleSection = (sec) => {
    setExpandedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Drilldown Levels: 1 = Cash/Bank Summary, 2 = Group Summary, 3 = Ledger Monthly Summary, 4 = Monthly Ledger Vouchers
  const [level, setLevel] = useState(1);
  const [currentGroupId, setCurrentGroupId] = useState(null);
  const [currentGroupTitle, setCurrentGroupTitle] = useState('');
  const [currentLedgerId, setCurrentLedgerId] = useState(null);
  const [currentLedgerName, setCurrentLedgerName] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Level-specific date ranges (to preserve the Level 1 filter when drilling down to Level 4)
  const [voucherStartDate, setVoucherStartDate] = useState('');
  const [voucherEndDate, setVoucherEndDate] = useState('');

  // Data states
  const [summaryData, setSummaryData] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [voucherData, setVoucherData] = useState(null);

  // Breadcrumbs history tracking
  const [breadcrumbs, setBreadcrumbs] = useState([{ name: 'Cash/Bank Summary', level: 1 }]);

  const formatCurrency = (val, isBlankIfZero = false) => {
    if (val === undefined || val === null || isNaN(val)) return isBlankIfZero ? '' : '0.00';
    if (isBlankIfZero && Number(val) === 0) return '';
    const absVal = Math.abs(val);
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(absVal);
    return formatted;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (level === 1) {
        const response = await getCashBankSummary(startDate, endDate);
        if (response.success && response.data) {
          setSummaryData(response.data);
          setBreadcrumbs([{ name: 'Cash/Bank Summary', level: 1 }]);
        } else {
          toast.error(response.message || "Failed to load Cash/Bank summary");
        }
      } else if (level === 2) {
        const response = await getGroupDetails(currentGroupId, startDate, endDate);
        if (response.success && response.data) {
          setGroupData(response.data);
          const apiBreadcrumbs = response.data.breadcrumbs.map(b => ({
            name: b.groupName,
            level: 2,
            id: b.groupId
          }));
          setBreadcrumbs([{ name: 'Cash/Bank Summary', level: 1 }, ...apiBreadcrumbs]);
        } else {
          toast.error(response.message || "Failed to load Group details");
        }
      } else if (level === 3) {
        const response = await getLedgerMonthlySummary(currentLedgerId, startDate, endDate);
        if (response.success && response.data) {
          setMonthlyData(response.data);
          setBreadcrumbs([
            { name: 'Cash/Bank Summary', level: 1 },
            { name: currentGroupTitle || 'Group', level: 2, id: currentGroupId },
            { name: response.data.ledgerName, level: 3, id: response.data.ledgerId }
          ]);
        } else {
          toast.error(response.message || "Failed to load Ledger Monthly summary");
        }
      } else if (level === 4) {
        const response = await getVoucherRegister(currentLedgerId, voucherStartDate, voucherEndDate, null, null, searchQuery);
        if (response.success && response.data) {
          setVoucherData(response.data);
          setBreadcrumbs([
            { name: 'Cash/Bank Summary', level: 1 },
            { name: currentGroupTitle || 'Group', level: 2, id: currentGroupId },
            { name: currentLedgerName, level: 3, id: currentLedgerId },
            { name: `${selectedMonth?.monthName || 'Month'} Vouchers`, level: 4 }
          ]);
        } else {
          toast.error(response.message || "Failed to load Ledger Vouchers");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while loading report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [level, currentGroupId, currentLedgerId, startDate, endDate, voucherStartDate, voucherEndDate, searchQuery]);

  const handleRowClick = (item) => {
    if (item.isGroup) {
      setCurrentGroupId(item.id);
      setCurrentGroupTitle(item.name);
      setLevel(2);
    } else {
      setCurrentLedgerId(item.id);
      setCurrentLedgerName(item.name);
      setLevel(3);
    }
  };

  const handleGroupItemClick = (item) => {
    if (item.groupId) {
      setCurrentGroupId(item.groupId);
      setCurrentGroupTitle(item.groupName);
      setLevel(2);
    } else {
      setCurrentLedgerId(item.ledgerId);
      setCurrentLedgerName(item.ledgerName);
      setLevel(3);
    }
  };

  const handleMonthClick = (m) => {
    // Find first day and last day of that month/year
    const pad = (n) => String(n).padStart(2, '0');
    const startStr = `${m.year}-${pad(m.monthNumber)}-01`;
    const lastDay = new Date(m.year, m.monthNumber, 0).getDate();
    const endStr = `${m.year}-${pad(m.monthNumber)}-${pad(lastDay)}`;
    
    setSelectedMonth(m);
    setVoucherStartDate(startStr);
    setVoucherEndDate(endStr);
    setLevel(4);
  };

  const handleBreadcrumbClick = (bc) => {
    setSearchQuery('');
    if (bc.level === 1) {
      setLevel(1);
    } else if (bc.level === 2) {
      setCurrentGroupId(bc.id);
      setLevel(2);
    } else if (bc.level === 3) {
      setCurrentLedgerId(bc.id);
      setLevel(3);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    const companyName = summaryData?.companyName || "SmartERP";
    csvContent += `"${companyName}"\n`;
    csvContent += `"Cash/Bank Summary Report - Level ${level}"\n`;
    csvContent += `"${startDate} to ${endDate}"\n\n`;

    if (level === 1 && summaryData) {
      csvContent += `"Particulars","Debit Closing Balance","Credit Closing Balance"\n`;
      const categories = [
        { name: "Cash-in-Hand", d: summaryData.cashInHand.debit, c: summaryData.cashInHand.credit },
        ...summaryData.cashInHand.items.map(i => ({ name: `  ${i.name}`, d: i.debit, c: i.credit })),
        { name: "Bank Accounts", d: summaryData.bankAccounts.debit, c: summaryData.bankAccounts.credit },
        ...summaryData.bankAccounts.items.map(i => ({ name: `  ${i.name}`, d: i.debit, c: i.credit })),
        { name: "Bank OD A/c", d: summaryData.bankOD.debit, c: summaryData.bankOD.credit },
        ...summaryData.bankOD.items.map(i => ({ name: `  ${i.name}`, d: i.debit, c: i.credit }))
      ];
      categories.forEach(cat => {
        csvContent += `"${cat.name}","${cat.d}","${cat.c}"\n`;
      });
      csvContent += `"Grand Total","${summaryData.grandTotalDebit}","${summaryData.grandTotalCredit}"\n`;
    } else if (level === 2 && groupData) {
      csvContent += `"${groupData.groupName} Details"\n`;
      csvContent += `"Particulars","Amount"\n`;
      groupData.subGroups.forEach(g => {
        csvContent += `"${g.groupName}","${g.amount}"\n`;
      });
      groupData.ledgers.forEach(l => {
        csvContent += `"${l.ledgerName}","${l.amount}"\n`;
      });
    } else if (level === 3 && monthlyData) {
      csvContent += `"${monthlyData.ledgerName} Monthly Summary"\n`;
      csvContent += `"Month","Debit Transactions","Credit Transactions","Closing Balance"\n`;
      monthlyData.months.forEach(m => {
        csvContent += `"${m.monthName}","${m.debit}","${m.credit}","${m.closingBalance} ${m.balanceType}"\n`;
      });
    } else if (level === 4 && voucherData) {
      csvContent += `"Date","Particulars","Voucher Type","Voucher No.","Debit","Credit","Running Balance"\n`;
      voucherData.vouchers.forEach(v => {
        csvContent += `"${v.date.split('T')[0]}","${v.particulars}","${v.voucherType}","${v.voucherNo}","${v.debit}","${v.credit}","${v.runningBalance}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Cash_Bank_Report_Level_${level}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getParentCategoryName = () => {
    if (level === 2 && groupData) {
      // Guess natural balance type from breadcrumbs or name
      const isBankOD = breadcrumbs.some(b => b.name?.toLowerCase().includes('od') || b.name?.toLowerCase().includes('occ'));
      return isBankOD ? 'Bank OD A/c' : 'Bank Accounts';
    }
    return '';
  };

  const isBankODCategory = getParentCategoryName() === 'Bank OD A/c';

  const formatTallyDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = String(date.getFullYear()).substring(2);
    return `${day}-${month}-${year}`;
  };

  return (
    <div style={{ padding: '24px', backgroundColor: 'var(--color-background)', minHeight: '100vh', fontFamily: 'var(--font-family-base)' }}>
      {/* Print Specific & Mobile Responsive CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
          }
        }
        @media (max-width: 768px) {
          .responsive-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
            padding: 12px 16px !important;
          }
          .responsive-actions {
            flex-direction: column !important;
            align-items: stretch !important;
            width: 100% !important;
          }
          .responsive-actions > button, .responsive-actions > div {
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .responsive-table-container {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }
          .responsive-table-container table {
            min-width: 700px !important;
          }
          .responsive-date-container {
            flex-direction: column !important;
            align-items: stretch !important;
            width: 100% !important;
            gap: 4px !important;
          }
          .responsive-date-container > input {
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .responsive-date-container > span {
            text-align: center !important;
            margin: 4px 0 !important;
          }
        }
      `}} />

      {/* Combined Title, Date Filter & Actions Card */}
      <div className="responsive-header" style={{
        backgroundColor: 'var(--color-level-1)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid var(--color-border-structural)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        {/* Left: Title */}
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-on-surface)', margin: 0, letterSpacing: '-0.5px' }}>
            Cash/Bank Summary
          </h1>
        </div>

        {/* Middle: Date Range Selectors */}
        <div className="responsive-date-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: '6px 12px', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--color-on-surface)' }}
          />
          <span style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: '6px 12px', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--color-on-surface)' }}
          />
        </div>

        {/* Right: Search, Export & Print Actions */}
        <div className="responsive-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {level === 4 && (
            <div style={{ position: 'relative', width: '220px' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--color-outline)', fontSize: '12px' }}></i>
              <input
                type="text"
                placeholder="Search vouchers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '6px 10px 6px 32px', fontSize: '13px', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', color: 'var(--color-on-surface)' }}
              />
            </div>
          )}

          <button
            onClick={handleExportCSV}
            style={{
              padding: '6px 12px',
              backgroundColor: '#fff',
              color: '#16a34a',
              border: '1px solid #16a34a',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <i className="fa-solid fa-file-csv"></i> Export Excel
          </button>

          <button
            onClick={handlePrint}
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <i className="fa-solid fa-print"></i> Print
          </button>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div style={{
        backgroundColor: 'var(--color-level-1)',
        padding: '12px 20px',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {breadcrumbs.map((bc, idx) => (
          <React.Fragment key={idx}>
            <span
              onClick={() => idx < breadcrumbs.length - 1 && handleBreadcrumbClick(bc)}
              style={{
                color: idx === breadcrumbs.length - 1 ? 'var(--color-on-surface)' : 'var(--color-primary)',
                cursor: idx === breadcrumbs.length - 1 ? 'default' : 'pointer',
                fontWeight: idx === breadcrumbs.length - 1 ? '700' : '500'
              }}
            >
              {bc.name}
            </span>
            {idx < breadcrumbs.length - 1 && <span style={{ color: 'var(--color-outline-variant)' }}>&gt;</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Main Report Table Container */}
      <div id="print-area" className="responsive-table-container" style={{
        backgroundColor: 'var(--color-level-1)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border-structural)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden'
      }}>
        {/* Top Banner */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--color-surface-container)',
          padding: '12px 20px',
          borderBottom: '1px solid var(--color-border-structural)',
          fontSize: '13px',
          fontWeight: '700',
          color: 'var(--color-on-surface)'
        }}>
          <div>
            {level === 1 ? 'Cash/Bank Summary' : level === 2 ? 'Group Summary' : level === 3 ? 'Monthly Summary' : 'Ledger Vouchers'}
          </div>
          <div>
            {level === 1 ? (summaryData?.companyName || 'SmartERP') : 
             level === 2 ? (groupData?.companyName || 'SmartERP') : 
             level === 3 ? `${monthlyData?.ledgerName} (${monthlyData?.companyName || ''})` : 
             `${currentLedgerName} (${voucherData?.companyName || ''})`}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-on-surface-variant)', fontSize: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <span className="spinner-border text-primary" role="status" aria-hidden="true" style={{ width: '2rem', height: '2rem' }}></span>
            <span>Calculating report...</span>
          </div>
        ) : (
          <>
            {/* LEVEL 1: Cash/Bank Summary */}
            {level === 1 && summaryData && (
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: 'var(--color-on-surface)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border-structural)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 20px', fontWeight: '700' }}>Particulars</th>
                      <th colSpan="2" style={{ textAlign: 'right', padding: '12px 20px', borderBottom: '1.5px solid var(--color-border-structural)' }}>
                        <div style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-on-surface-variant)', marginBottom: '2px' }}>
                          {summaryData.companyName}<br/>{summaryData.periodDisplay}
                        </div>
                        Closing Balance
                      </th>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border-structural)', backgroundColor: 'var(--color-surface-container-low)' }}>
                      <th></th>
                      <th style={{ width: '180px', textAlign: 'right', padding: '8px 20px', fontWeight: '700', borderLeft: '1px solid var(--color-border-structural)' }}>Debit</th>
                      <th style={{ width: '180px', textAlign: 'right', padding: '8px 20px', fontWeight: '700', borderLeft: '1px solid var(--color-border-structural)' }}>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 1. Cash-in-Hand Section */}
                    <tr style={{ fontWeight: '700', borderBottom: '1px solid var(--color-border-structural)', backgroundColor: 'var(--color-surface-container-lowest)' }}>
                      <td style={{ padding: '10px 20px', cursor: 'pointer' }} onClick={() => toggleSection('cashInHand')}>
                        <i className={`fa-solid fa-caret-${expandedSections.cashInHand ? 'down' : 'right'}`} style={{ marginRight: '8px', fontSize: '12px', color: 'var(--color-outline)' }}></i>
                        Cash-in-Hand
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 20px', borderLeft: '1px solid var(--color-border-structural)' }}>{formatCurrency(summaryData.cashInHand.debit, true)}</td>
                      <td style={{ textAlign: 'right', padding: '10px 20px', borderLeft: '1px solid var(--color-border-structural)' }}>{formatCurrency(summaryData.cashInHand.credit, true)}</td>
                    </tr>
                    {expandedSections.cashInHand && summaryData.cashInHand.items.map((item, idx) => (
                      <tr key={`cash-${idx}`} style={{ borderBottom: '1px solid var(--color-border-structural)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '8px 20px 8px 40px', cursor: 'pointer', color: 'var(--color-on-surface-variant)' }} onClick={() => handleRowClick(item)}>
                          <i className="fa-solid fa-file-invoice text-secondary" style={{ marginRight: '8px', fontSize: '11px' }}></i>
                          {item.name}
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px 20px', borderLeft: '1px solid var(--color-border-structural)', color: 'var(--color-on-surface-variant)' }}>{formatCurrency(item.debit, true)}</td>
                        <td style={{ textAlign: 'right', padding: '8px 20px', borderLeft: '1px solid var(--color-border-structural)', color: 'var(--color-on-surface-variant)' }}>{formatCurrency(item.credit, true)}</td>
                      </tr>
                    ))}

                    {/* 2. Bank Accounts Section */}
                    <tr style={{ fontWeight: '700', borderBottom: '1px solid var(--color-border-structural)', backgroundColor: 'var(--color-surface-container-lowest)' }}>
                      <td style={{ padding: '10px 20px', cursor: 'pointer' }} onClick={() => toggleSection('bankAccounts')}>
                        <i className={`fa-solid fa-caret-${expandedSections.bankAccounts ? 'down' : 'right'}`} style={{ marginRight: '8px', fontSize: '12px', color: 'var(--color-outline)' }}></i>
                        Bank Accounts
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 20px', borderLeft: '1px solid var(--color-border-structural)' }}>{formatCurrency(summaryData.bankAccounts.debit, true)}</td>
                      <td style={{ textAlign: 'right', padding: '10px 20px', borderLeft: '1px solid var(--color-border-structural)' }}>{formatCurrency(summaryData.bankAccounts.credit, true)}</td>
                    </tr>
                    {expandedSections.bankAccounts && summaryData.bankAccounts.items.map((item, idx) => (
                      <tr key={`bank-${idx}`} style={{ borderBottom: '1px solid var(--color-border-structural)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '8px 20px 8px 40px', cursor: 'pointer', color: 'var(--color-on-surface-variant)' }} onClick={() => handleRowClick(item)}>
                          <i className="fa-solid fa-file-invoice text-secondary" style={{ marginRight: '8px', fontSize: '11px' }}></i>
                          {item.name}
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px 20px', borderLeft: '1px solid var(--color-border-structural)', color: 'var(--color-on-surface-variant)' }}>{formatCurrency(item.debit, true)}</td>
                        <td style={{ textAlign: 'right', padding: '8px 20px', borderLeft: '1px solid var(--color-border-structural)', color: 'var(--color-on-surface-variant)' }}>{formatCurrency(item.credit, true)}</td>
                      </tr>
                    ))}

                    {/* 3. Bank OD A/c Section */}
                    <tr style={{ fontWeight: '700', borderBottom: '1px solid var(--color-border-structural)', backgroundColor: 'var(--color-surface-container-lowest)' }}>
                      <td style={{ padding: '10px 20px', cursor: 'pointer' }} onClick={() => toggleSection('bankOD')}>
                        <i className={`fa-solid fa-caret-${expandedSections.bankOD ? 'down' : 'right'}`} style={{ marginRight: '8px', fontSize: '12px', color: 'var(--color-outline)' }}></i>
                        Bank OD A/c
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 20px', borderLeft: '1px solid var(--color-border-structural)' }}>{formatCurrency(summaryData.bankOD.debit, true)}</td>
                      <td style={{ textAlign: 'right', padding: '10px 20px', borderLeft: '1px solid var(--color-border-structural)' }}>{formatCurrency(summaryData.bankOD.credit, true)}</td>
                    </tr>
                    {expandedSections.bankOD && summaryData.bankOD.items.map((item, idx) => (
                      <tr key={`od-${idx}`} style={{ borderBottom: '1px solid var(--color-border-structural)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '8px 20px 8px 40px', cursor: 'pointer', color: 'var(--color-on-surface-variant)' }} onClick={() => handleRowClick(item)}>
                          <i className="fa-solid fa-file-invoice text-secondary" style={{ marginRight: '8px', fontSize: '11px' }}></i>
                          {item.name}
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px 20px', borderLeft: '1px solid var(--color-border-structural)', color: 'var(--color-on-surface-variant)' }}>{formatCurrency(item.debit, true)}</td>
                        <td style={{ textAlign: 'right', padding: '8px 20px', borderLeft: '1px solid var(--color-border-structural)', color: 'var(--color-on-surface-variant)' }}>{formatCurrency(item.credit, true)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--color-border-structural)', borderBottom: '2.5px solid var(--color-border-structural)', fontWeight: '700', backgroundColor: 'var(--color-surface-container-low)' }}>
                      <td style={{ padding: '12px 20px' }}>Grand Total</td>
                      <td style={{ textAlign: 'right', padding: '12px 20px', borderLeft: '1px solid var(--color-border-structural)' }}>{formatCurrency(summaryData.grandTotalDebit)}</td>
                      <td style={{ textAlign: 'right', padding: '12px 20px', borderLeft: '1px solid var(--color-border-structural)' }}>{formatCurrency(summaryData.grandTotalCredit)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* LEVEL 2: Group Summary */}
            {level === 2 && groupData && (
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: 'var(--color-on-surface)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border-structural)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 20px', fontWeight: '700' }}>Particulars</th>
                      <th colSpan="2" style={{ textAlign: 'right', padding: '12px 20px', borderBottom: '1.5px solid var(--color-border-structural)' }}>
                        <div style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-on-surface-variant)', marginBottom: '2px' }}>
                          {groupData.groupName}<br/>{groupData.companyName}<br/>{formatTallyDate(startDate)} to {formatTallyDate(endDate)}
                        </div>
                        Closing Balance
                      </th>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border-structural)', backgroundColor: 'var(--color-surface-container-low)' }}>
                      <th></th>
                      <th style={{ width: '180px', textAlign: 'right', padding: '8px 20px', fontWeight: '700', borderLeft: '1px solid var(--color-border-structural)' }}>Debit</th>
                      <th style={{ width: '180px', textAlign: 'right', padding: '8px 20px', fontWeight: '700', borderLeft: '1px solid var(--color-border-structural)' }}>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Render subgroups */}
                    {groupData.subGroups.map((sg, idx) => {
                      const isDr = !isBankODCategory;
                      const dVal = isDr ? (sg.amount >= 0 ? sg.amount : 0) : (sg.amount < 0 ? Math.abs(sg.amount) : 0);
                      const cVal = isDr ? (sg.amount < 0 ? Math.abs(sg.amount) : 0) : (sg.amount >= 0 ? sg.amount : 0);
                      return (
                        <tr key={`sg-${idx}`} style={{ fontWeight: '700', borderBottom: '1px solid var(--color-border-structural)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={{ padding: '10px 20px', cursor: 'pointer' }} onClick={() => handleGroupItemClick({ groupId: sg.groupId, groupName: sg.groupName })}>
                            <i className="fa-solid fa-folder text-warning" style={{ marginRight: '8px' }}></i>
                            {sg.groupName}
                          </td>
                          <td style={{ textAlign: 'right', padding: '10px 20px', borderLeft: '1px solid var(--color-border-structural)' }}>{formatCurrency(dVal, true)}</td>
                          <td style={{ textAlign: 'right', padding: '10px 20px', borderLeft: '1px solid var(--color-border-structural)' }}>{formatCurrency(cVal, true)}</td>
                        </tr>
                      );
                    })}

                    {/* Render direct ledgers */}
                    {groupData.ledgers.map((l, idx) => {
                      const isDr = !isBankODCategory;
                      const dVal = isDr ? (l.amount >= 0 ? l.amount : 0) : (l.amount < 0 ? Math.abs(l.amount) : 0);
                      const cVal = isDr ? (l.amount < 0 ? Math.abs(l.amount) : 0) : (l.amount >= 0 ? l.amount : 0);
                      return (
                        <tr key={`led-${idx}`} style={{ borderBottom: '1px solid var(--color-border-structural)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={{ padding: '10px 20px 10px 32px', cursor: 'pointer', color: 'var(--color-on-surface-variant)' }} onClick={() => handleGroupItemClick({ ledgerId: l.ledgerId, ledgerName: l.ledgerName })}>
                            <i className="fa-solid fa-file-invoice text-secondary" style={{ marginRight: '8px', fontSize: '11px' }}></i>
                            {l.ledgerName}
                          </td>
                          <td style={{ textAlign: 'right', padding: '10px 20px', borderLeft: '1px solid var(--color-border-structural)' }}>{formatCurrency(dVal, true)}</td>
                          <td style={{ textAlign: 'right', padding: '10px 20px', borderLeft: '1px solid var(--color-border-structural)' }}>{formatCurrency(cVal, true)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--color-border-structural)', borderBottom: '2.5px solid var(--color-border-structural)', fontWeight: '700', backgroundColor: 'var(--color-surface-container-low)' }}>
                      <td style={{ padding: '12px 20px' }}>Grand Total</td>
                      <td style={{ textAlign: 'right', padding: '12px 20px', borderLeft: '1px solid var(--color-border-structural)' }}>
                        {formatCurrency(
                          groupData.subGroups.reduce((acc, curr) => acc + (!isBankODCategory ? (curr.amount >= 0 ? curr.amount : 0) : (curr.amount < 0 ? Math.abs(curr.amount) : 0)), 0) +
                          groupData.ledgers.reduce((acc, curr) => acc + (!isBankODCategory ? (curr.amount >= 0 ? curr.amount : 0) : (curr.amount < 0 ? Math.abs(curr.amount) : 0)), 0)
                        )}
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px 20px', borderLeft: '1px solid var(--color-border-structural)' }}>
                        {formatCurrency(
                          groupData.subGroups.reduce((acc, curr) => acc + (!isBankODCategory ? (curr.amount < 0 ? Math.abs(curr.amount) : 0) : (curr.amount >= 0 ? curr.amount : 0)), 0) +
                          groupData.ledgers.reduce((acc, curr) => acc + (!isBankODCategory ? (curr.amount < 0 ? Math.abs(curr.amount) : 0) : (curr.amount >= 0 ? curr.amount : 0)), 0)
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* LEVEL 3: Monthly Summary */}
            {level === 3 && monthlyData && (
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: 'var(--color-on-surface)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border-structural)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 20px', fontWeight: '700' }}>Particulars</th>
                      <th colSpan="2" style={{ textAlign: 'center', padding: '12px 20px', borderBottom: '1.5px solid var(--color-border-structural)' }}>
                        Transactions
                      </th>
                      <th style={{ width: '220px', textAlign: 'right', padding: '12px 20px', fontWeight: '700', borderBottom: '1.5px solid var(--color-border-structural)' }}>
                        <div style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-on-surface-variant)', marginBottom: '2px' }}>
                          {monthlyData.ledgerName}<br/>
                          {monthlyData.companyName}<br/>
                          {formatTallyDate(startDate)} to {formatTallyDate(endDate)}
                        </div>
                        Closing Balance
                      </th>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border-structural)', backgroundColor: 'var(--color-surface-container-low)' }}>
                      <th></th>
                      <th style={{ width: '180px', textAlign: 'right', padding: '8px 20px', fontWeight: '700', borderLeft: '1px solid var(--color-border-structural)' }}>Debit</th>
                      <th style={{ width: '180px', textAlign: 'right', padding: '8px 20px', fontWeight: '700', borderLeft: '1px solid var(--color-border-structural)' }}>Credit</th>
                      <th style={{ borderLeft: '1px solid var(--color-border-structural)' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ fontWeight: '600', backgroundColor: 'var(--color-surface-container-lowest)', borderBottom: '1px solid var(--color-border-structural)' }}>
                      <td style={{ padding: '10px 20px', fontStyle: 'italic' }}>Opening Balance</td>
                      <td style={{ borderLeft: '1px solid var(--color-border-structural)' }}></td>
                      <td style={{ borderLeft: '1px solid var(--color-border-structural)' }}></td>
                      <td style={{ textAlign: 'right', padding: '10px 20px', borderLeft: '1px solid var(--color-border-structural)', fontWeight: '700' }}>
                        {formatCurrency(monthlyData.openingBalance)} {monthlyData.openingBalanceType}
                      </td>
                    </tr>
                    {monthlyData.months.map((m, idx) => (
                      <tr key={`m-${idx}`} style={{ borderBottom: '1px solid var(--color-border-structural)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '10px 20px', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: '600' }} onClick={() => handleMonthClick(m)}>
                          {m.monthName}
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px 20px', borderLeft: '1px solid var(--color-border-structural)', color: '#16a34a', fontWeight: '500' }}>{formatCurrency(m.debit, true)}</td>
                        <td style={{ textAlign: 'right', padding: '10px 20px', borderLeft: '1px solid var(--color-border-structural)', color: '#dc2626', fontWeight: '500' }}>{formatCurrency(m.credit, true)}</td>
                        <td style={{ textAlign: 'right', padding: '10px 20px', borderLeft: '1px solid var(--color-border-structural)', fontWeight: '700' }}>
                          {formatCurrency(m.closingBalance)} {m.balanceType}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--color-border-structural)', borderBottom: '2.5px solid var(--color-border-structural)', fontWeight: '700', backgroundColor: 'var(--color-surface-container-low)' }}>
                      <td style={{ padding: '12px 20px' }}>Grand Total</td>
                      <td style={{ textAlign: 'right', padding: '12px 20px', borderLeft: '1px solid var(--color-border-structural)', color: '#16a34a' }}>{formatCurrency(monthlyData.totalDebit)}</td>
                      <td style={{ textAlign: 'right', padding: '12px 20px', borderLeft: '1px solid var(--color-border-structural)', color: '#dc2626' }}>{formatCurrency(monthlyData.totalCredit)}</td>
                      <td style={{ textAlign: 'right', padding: '12px 20px', borderLeft: '1px solid var(--color-border-structural)' }}>{formatCurrency(monthlyData.closingBalance)} {monthlyData.closingBalanceType}</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Recharts Bar Chart Section */}
                <div style={{ padding: '24px', backgroundColor: 'var(--color-level-1)', borderTop: '1px solid var(--color-border-structural)', marginTop: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-on-surface)', marginBottom: '16px', textAlign: 'center' }}>
                    Monthly Transaction Trends
                  </h3>
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData.months} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="monthName" stroke="var(--color-on-surface-variant)" fontSize={11} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="debit" fill="#16a34a" radius={[4, 4, 0, 0]} name="Debit Transactions" />
                        <Bar dataKey="credit" fill="#dc2626" radius={[4, 4, 0, 0]} name="Credit Transactions" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* LEVEL 4: Ledger Vouchers */}
            {level === 4 && voucherData && (
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: 'var(--color-on-surface)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--color-border-structural)', backgroundColor: 'var(--color-surface-container-low)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '700' }}>Date</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '700' }}>Particulars</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '700' }}>Vch Type</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '700' }}>Vch No.</th>
                      <th style={{ width: '150px', textAlign: 'right', padding: '12px 16px', fontWeight: '700', borderLeft: '1px solid var(--color-border-structural)' }}>Debit</th>
                      <th style={{ width: '150px', textAlign: 'right', padding: '12px 16px', fontWeight: '700', borderLeft: '1px solid var(--color-border-structural)' }}>Credit</th>
                      <th style={{ width: '180px', textAlign: 'right', padding: '12px 16px', fontWeight: '700', borderLeft: '1px solid var(--color-border-structural)', borderBottom: '1.5px solid var(--color-border-structural)' }}>
                        <div style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-on-surface-variant)', marginBottom: '2px' }}>
                          {voucherData.companyName}<br/>
                          {formatTallyDate(voucherStartDate)} to {formatTallyDate(voucherEndDate)}
                        </div>
                        Closing Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Opening Balance Line */}
                    <tr style={{ borderBottom: '1px solid var(--color-border-structural)', fontWeight: '600', backgroundColor: 'var(--color-surface-container-lowest)' }}>
                      <td style={{ padding: '10px 16px' }}></td>
                      <td style={{ padding: '10px 16px', fontStyle: 'italic' }}>Opening Balance</td>
                      <td></td>
                      <td></td>
                      <td style={{ borderLeft: '1px solid var(--color-border-structural)' }}></td>
                      <td style={{ borderLeft: '1px solid var(--color-border-structural)' }}></td>
                      <td style={{ textAlign: 'right', padding: '10px 16px', borderLeft: '1px solid var(--color-border-structural)', fontWeight: '700' }}>
                        {formatCurrency(voucherData.openingBalance)}
                      </td>
                    </tr>
                    
                    {voucherData.vouchers.map((v, idx) => (
                      <tr key={`v-${idx}`} style={{ borderBottom: '1px solid var(--color-border-structural)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '10px 16px' }}>{v.date ? v.date.split('T')[0] : ''}</td>
                        <td style={{ padding: '10px 16px', fontStyle: 'italic', fontWeight: '500' }}>{v.particulars}</td>
                        <td style={{ padding: '10px 16px' }}>{v.voucherType}</td>
                        <td style={{ padding: '10px 16px' }}>{v.voucherNo}</td>
                        <td style={{ textAlign: 'right', padding: '10px 16px', borderLeft: '1px solid var(--color-border-structural)', color: '#16a34a', fontWeight: '600' }}>{v.debit > 0 ? formatCurrency(v.debit) : ''}</td>
                        <td style={{ textAlign: 'right', padding: '10px 16px', borderLeft: '1px solid var(--color-border-structural)', color: '#dc2626', fontWeight: '600' }}>{v.credit > 0 ? formatCurrency(v.credit) : ''}</td>
                        <td style={{ textAlign: 'right', padding: '10px 16px', borderLeft: '1px solid var(--color-border-structural)', fontWeight: '700' }}>{formatCurrency(v.runningBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--color-border-structural)', fontWeight: '700' }}>
                      <td colSpan="4" style={{ padding: '10px 16px', textAlign: 'right' }}>Opening Balance:</td>
                      <td style={{ borderLeft: '1px solid var(--color-border-structural)' }}></td>
                      <td style={{ borderLeft: '1px solid var(--color-border-structural)' }}></td>
                      <td style={{ textAlign: 'right', padding: '10px 16px', borderLeft: '1px solid var(--color-border-structural)' }}>
                        {formatCurrency(voucherData.openingBalance)}
                      </td>
                    </tr>
                    <tr style={{ fontWeight: '700' }}>
                      <td colSpan="4" style={{ padding: '10px 16px', textAlign: 'right' }}>Current Total:</td>
                      <td style={{ textAlign: 'right', padding: '10px 16px', borderLeft: '1px solid var(--color-border-structural)', color: '#16a34a' }}>{formatCurrency(voucherData.totalDebit)}</td>
                      <td style={{ textAlign: 'right', padding: '10px 16px', borderLeft: '1px solid var(--color-border-structural)', color: '#dc2626' }}>{formatCurrency(voucherData.totalCredit)}</td>
                      <td style={{ borderLeft: '1px solid var(--color-border-structural)' }}></td>
                    </tr>
                    <tr style={{ borderBottom: '2.5px solid var(--color-border-structural)', fontWeight: '700', backgroundColor: 'var(--color-surface-container-low)' }}>
                      <td colSpan="4" style={{ padding: '12px 16px', textAlign: 'right' }}>Closing Balance:</td>
                      <td style={{ borderLeft: '1px solid var(--color-border-structural)' }}></td>
                      <td style={{ borderLeft: '1px solid var(--color-border-structural)' }}></td>
                      <td style={{ textAlign: 'right', padding: '12px 16px', borderLeft: '1px solid var(--color-border-structural)' }}>
                        {formatCurrency(voucherData.closingBalance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CashBankSummaryReport;
