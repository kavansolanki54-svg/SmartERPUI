import React, { useState, useEffect } from 'react';
import { getProfitAndLoss, getGroupDetails, getLedgerMonthlySummary, getVoucherRegister } from '../services/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const ProfitAndLossReport = () => {
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

  // Collapsible tree view states
  const [expandedSections, setExpandedSections] = useState({
    purchase: false,
    directExpense: false,
    indirectExpense: false,
    sales: false,
    directIncome: false,
    indirectIncome: false
  });
  const [expandedSubgroups, setExpandedSubgroups] = useState({});

  const toggleSection = (sec) => {
    setExpandedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const toggleSubgroup = (groupKey) => {
    setExpandedSubgroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // Drilldown States: 1 = PL Summary, 2 = Group Details, 3 = Ledger Summary, 4 = Voucher Details
  const [level, setLevel] = useState(1);
  const [currentGroupId, setCurrentGroupId] = useState(null);
  const [currentLedgerId, setCurrentLedgerId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [voucherStartDate, setVoucherStartDate] = useState('');
  const [voucherEndDate, setVoucherEndDate] = useState('');

  // Data states
  const [plData, setPlData] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [voucherData, setVoucherData] = useState(null);

  // Breadcrumbs history tracking
  const [breadcrumbs, setBreadcrumbs] = useState([{ name: 'Profit & Loss', level: 1 }]);

  const formatCurrency = (val, isLedger = false) => {
    if (val === undefined || val === null || isNaN(val)) return isLedger ? '' : '0.00';
    if (isLedger && Number(val) === 0) return '';
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(absVal);
    return isNegative ? `(${formatted})` : formatted;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (level === 1) {
        const response = await getProfitAndLoss(startDate, endDate);
        if (response.success && response.data) {
          setPlData(response.data);
        } else {
          toast.error(response.message || "Failed to load Profit & Loss Summary");
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
          setBreadcrumbs([{ name: 'Profit & Loss', level: 1 }, ...apiBreadcrumbs]);
        } else {
          toast.error(response.message || "Failed to load Group Details");
        }
      } else if (level === 3) {
        const response = await getLedgerMonthlySummary(currentLedgerId, startDate, endDate);
        if (response.success && response.data) {
          setLedgerData(response.data);
          const apiBreadcrumbs = response.data.breadcrumbs ? response.data.breadcrumbs.map(b => ({
            name: b.groupName,
            level: 2,
            id: b.groupId
          })) : [];
          setBreadcrumbs([
            { name: 'Profit & Loss', level: 1 },
            ...apiBreadcrumbs,
            { name: response.data.ledgerName, level: 3, id: response.data.ledgerId }
          ]);
        } else {
          toast.error(response.message || "Failed to load Ledger Monthly Summary");
        }
      } else if (level === 4) {
        const response = await getVoucherRegister(currentLedgerId, voucherStartDate || startDate, voucherEndDate || endDate, null, null, searchQuery);
        if (response.success && response.data) {
          setVoucherData(response.data);
          const apiBreadcrumbs = response.data.breadcrumbs ? response.data.breadcrumbs.map(b => ({
            name: b.groupName,
            level: 2,
            id: b.groupId
          })) : [];
          setBreadcrumbs([
            { name: 'Profit & Loss', level: 1 },
            ...apiBreadcrumbs,
            { name: response.data.ledgerName, level: 3, id: currentLedgerId },
            { name: selectedMonth ? `${selectedMonth.monthName} Vouchers` : 'Voucher Register', level: 4 }
          ]);
        } else {
          toast.error(response.message || "Failed to load Voucher Register");
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

  const handleGroupClick = (groupId) => {
    if (!groupId) return;
    setCurrentGroupId(groupId);
    setLevel(2);
  };

  const handleLedgerClick = (ledgerId) => {
    if (!ledgerId) return;
    setCurrentLedgerId(ledgerId);
    setSelectedMonth(null);
    setVoucherStartDate('');
    setVoucherEndDate('');
    setLevel(3);
  };

  const handleMonthClick = (m) => {
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
      setBreadcrumbs([{ name: 'Profit & Loss', level: 1 }]);
    } else if (bc.level === 2) {
      setCurrentGroupId(bc.id);
      setLevel(2);
    } else if (bc.level === 3) {
      setCurrentLedgerId(bc.id);
      setSelectedMonth(null);
      setVoucherStartDate('');
      setVoucherEndDate('');
      setLevel(3);
    }
  };

  const formatTallyDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = String(date.getFullYear()).substring(2);
    return `${day}-${month}-${year}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    const companyName = plData?.companyName || "SmartERP";
    csvContent += `"${companyName}"\n`;
    csvContent += `"Profit & Loss Drilldown Report - Level ${level}"\n`;
    csvContent += `"${startDate} to ${endDate}"\n\n`;

    if (level === 1 && plData) {
      csvContent += `"DEBIT / EXPENSES","AMOUNT","CREDIT / INCOME","AMOUNT"\n`;
      const left = [
        ["Purchase Accounts", plData.purchaseSections.reduce((a, c) => a + c.totalAmount, 0)],
        ["Direct Expenses", plData.directExpenseSections.reduce((a, c) => a + c.totalAmount, 0)],
        ["Gross Loss", plData.grossLoss],
        ["Indirect Expenses", plData.indirectExpenseSections.reduce((a, c) => a + c.totalAmount, 0)],
        ["Nett Profit", plData.netProfit]
      ];
      const right = [
        ["Sales Accounts", plData.salesSections.reduce((a, c) => a + c.totalAmount, 0)],
        ["Direct Incomes", plData.directIncomeSections.reduce((a, c) => a + c.totalAmount, 0)],
        ["Gross Profit", plData.grossProfit],
        ["Indirect Incomes", plData.indirectIncomeSections.reduce((a, c) => a + c.totalAmount, 0)],
        ["Nett Loss", plData.netLoss]
      ];
      for (let i = 0; i < 5; i++) {
        csvContent += `"${left[i][0]}","${left[i][1]}","${right[i][0]}","${right[i][1]}"\n`;
      }
      csvContent += `"TOTAL DEBIT","${plData.balancedTotal}","TOTAL CREDIT","${plData.balancedTotal}"\n`;
    } else if (level === 2 && groupData) {
      csvContent += `"${groupData.groupName} - Details"\n`;
      csvContent += `"Particulars","Amount"\n`;
      groupData.subGroups.forEach(g => {
        csvContent += `"${g.groupName} (Sub Group)","${g.amount}"\n`;
      });
      groupData.ledgers.forEach(l => {
        csvContent += `"${l.ledgerName}","${l.amount}"\n`;
      });
    } else if (level === 3 && ledgerData) {
      csvContent += `"${ledgerData.ledgerName} Monthly Summary"\n`;
      csvContent += `"Month","Debit Transactions","Credit Transactions","Closing Balance"\n`;
      ledgerData.months.forEach(m => {
        csvContent += `"${m.monthName}","${m.debit}","${m.credit}","${m.closingBalance} ${m.balanceType}"\n`;
      });
    } else if (level === 4 && voucherData) {
      csvContent += `"Date","Particulars","Voucher Type","Voucher No.","Debit","Credit","Running Balance"\n`;
      voucherData.vouchers.forEach(v => {
        csvContent += `"${v.date ? v.date.split('T')[0] : ''}","${v.particulars}","${v.voucherType}","${v.voucherNo}","${v.debit}","${v.credit}","${v.runningBalance}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PL_Report_Level_${level}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{
      padding: '24px',
      backgroundColor: 'var(--color-background)',
      height: 'calc(100vh - 112px)',
      fontFamily: 'var(--font-family-base)',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>

      {/* Print Specific & Mobile Responsive CSS Styles */}
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
          .responsive-table-container table, .responsive-table-container > div {
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
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-on-surface)', margin: 0, letterSpacing: '-0.5px' }}>Profit & Loss</h1>
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
          <div style={{ position: 'relative', width: '220px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--color-outline)', fontSize: '12px' }}></i>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '6px 10px 6px 32px', fontSize: '13px', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', color: 'var(--color-on-surface)' }}
            />
          </div>

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
            <i className="fa-solid fa-file-csv"></i> Export
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
        border: '1px solid var(--color-border-structural)',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {breadcrumbs.map((bc, idx) => (
          <React.Fragment key={idx}>
            <span
              onClick={() => handleBreadcrumbClick(bc)}
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
        overflow: 'hidden',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
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
            {level === 1 ? 'Profit & Loss Statement' : level === 2 ? 'Group Details' : level === 3 ? 'Monthly Summary' : 'Ledger Vouchers'}
          </div>
          <div>
            {level === 1 ? (plData?.companyName || 'SmartERP') : 
             level === 2 ? (groupData?.companyName || 'SmartERP') : 
             level === 3 ? `${ledgerData?.ledgerName} (${ledgerData?.companyName || ''})` : 
             `${voucherData?.ledgerName || ''} (${voucherData?.companyName || ''})`}
          </div>
        </div>

        {loading && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-on-surface-variant)', fontSize: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <span className="spinner-border text-primary" role="status" aria-hidden="true" style={{ width: '2rem', height: '2rem' }}></span>
            <span>Calculating Profit & Loss statement...</span>
          </div>
        )}

        {!loading && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* LEVEL 1: Profit & Loss summary */}
            {level === 1 && plData && (
              <div>
                {/* Table Header */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-structural)', backgroundColor: 'var(--color-surface-container)' }}>
                  <div style={{ width: '50%', padding: '12px 20px', borderRight: '1px solid var(--color-border-structural)', fontWeight: '700', fontSize: '13px', color: 'var(--color-on-surface)' }}>DEBIT / EXPENSES</div>
                  <div style={{ width: '50%', padding: '12px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--color-on-surface)' }}>CREDIT / INCOME</div>
                </div>

                {/* ==================== PART 1: TRADING ACCOUNT (Gross Profit calculation) ==================== */}
                <div style={{ display: 'flex', width: '100%', borderBottom: '2px solid var(--color-border-structural)', fontSize: '14px', backgroundColor: 'var(--color-level-1)' }}>

                  {/* Left Column - Trading Expenses */}
                  <div style={{ width: '50%', borderRight: '1px solid var(--color-border-structural)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ padding: '16px 20px' }}>
                      {/* Purchase Accounts */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--radius-md)', fontWeight: '600', borderBottom: '1px dashed var(--color-border-structural)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button onClick={() => toggleSection('purchase')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 6px', color: 'var(--color-outline)', display: 'flex', alignItems: 'center' }}>
                              <i className={`fa-solid ${expandedSections.purchase ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ fontSize: '11px' }}></i>
                            </button>
                            <span onClick={() => handleGroupClick(plData.purchaseGroupId)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                              <i className="fa-solid fa-cart-shopping text-warning" style={{ fontSize: '13px' }}></i>
                              Purchase Accounts
                            </span>
                          </span>
                          <span>{formatCurrency(plData.purchaseSections.reduce((acc, curr) => acc + curr.totalAmount, 0))}</span>
                        </div>

                        {expandedSections.purchase && (
                          <div style={{ paddingLeft: '16px', marginTop: '4px' }}>
                            {plData.purchaseSections.map((sec, sIdx) => {
                              const subKey = `purchase-${sec.groupName}-${sIdx}`;
                              const isSubExpanded = !!expandedSubgroups[subKey];
                              const isCategoryGroup = sec.groupName.toLowerCase() === "purchase accounts";

                              if (isCategoryGroup) {
                                return sec.ledgers.map((led, lIdx) => (
                                  <div key={`led-${lIdx}`} onClick={() => handleLedgerClick(led.ledgerId)} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px dashed var(--color-border-structural)', cursor: 'pointer', fontSize: '12px', color: 'var(--color-on-surface-variant)', paddingLeft: '32px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <span><i className="fa-solid fa-file-invoice text-secondary" style={{ marginRight: '6px', fontSize: '11px' }}></i>{led.ledgerName}</span>
                                    <span>{formatCurrency(led.amount, true)}</span>
                                  </div>
                                ));
                              }

                              return (
                                <div key={subKey} style={{ fontSize: '13px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid var(--color-border-structural)', fontWeight: '500' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <button onClick={() => toggleSubgroup(subKey)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--color-outline)', display: 'flex', alignItems: 'center' }}>
                                        <i className={`fa-solid ${isSubExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ fontSize: '10px' }}></i>
                                      </button>
                                      <span onClick={() => handleGroupClick(sec.GroupId || plData.purchaseGroupId)} style={{ cursor: 'pointer', color: 'var(--color-on-surface)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-on-surface)'}>
                                        {sec.groupName}
                                      </span>
                                    </span>
                                    <span style={{ fontWeight: '600' }}>{formatCurrency(sec.totalAmount)}</span>
                                  </div>
                                  {isSubExpanded && (
                                    <div style={{ paddingLeft: '24px', backgroundColor: 'var(--color-surface-container-lowest)' }}>
                                      {sec.ledgers.map((led, lIdx) => (
                                        <div key={lIdx} onClick={() => handleLedgerClick(led.ledgerId)} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px dashed var(--color-border-structural)', cursor: 'pointer', fontSize: '12px', color: 'var(--color-on-surface-variant)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                          <span><i className="fa-solid fa-file-invoice text-secondary" style={{ marginRight: '6px', fontSize: '11px' }}></i>{led.ledgerName}</span>
                                          <span>{formatCurrency(led.amount, true)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Direct Expenses */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--radius-md)', fontWeight: '600', borderBottom: '1px dashed var(--color-border-structural)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button onClick={() => toggleSection('directExpense')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 6px', color: 'var(--color-outline)', display: 'flex', alignItems: 'center' }}>
                              <i className={`fa-solid ${expandedSections.directExpense ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ fontSize: '11px' }}></i>
                            </button>
                            <span onClick={() => handleGroupClick(plData.directExpenseGroupId)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                              <i className="fa-solid fa-bolt text-danger" style={{ fontSize: '13px' }}></i>
                              Direct Expenses
                            </span>
                          </span>
                          <span>{formatCurrency(plData.directExpenseSections.reduce((acc, curr) => acc + curr.totalAmount, 0))}</span>
                        </div>

                        {expandedSections.directExpense && (
                          <div style={{ paddingLeft: '16px', marginTop: '4px' }}>
                            {plData.directExpenseSections.map((sec, sIdx) => {
                              const subKey = `directExpense-${sec.groupName}-${sIdx}`;
                              const isSubExpanded = !!expandedSubgroups[subKey];
                              const isCategoryGroup = sec.groupName.toLowerCase() === "direct expenses";

                              if (isCategoryGroup) {
                                return sec.ledgers.map((led, lIdx) => (
                                  <div key={`led-${lIdx}`} onClick={() => handleLedgerClick(led.ledgerId)} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px dashed var(--color-border-structural)', cursor: 'pointer', fontSize: '12px', color: 'var(--color-on-surface-variant)', paddingLeft: '32px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <span><i className="fa-solid fa-file-invoice text-secondary" style={{ marginRight: '6px', fontSize: '11px' }}></i>{led.ledgerName}</span>
                                    <span>{formatCurrency(led.amount, true)}</span>
                                  </div>
                                ));
                              }

                              return (
                                <div key={subKey} style={{ fontSize: '13px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid var(--color-border-structural)', fontWeight: '500' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <button onClick={() => toggleSubgroup(subKey)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--color-outline)', display: 'flex', alignItems: 'center' }}>
                                        <i className={`fa-solid ${isSubExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ fontSize: '10px' }}></i>
                                      </button>
                                      <span onClick={() => handleGroupClick(sec.GroupId || plData.directExpenseGroupId)} style={{ cursor: 'pointer', color: 'var(--color-on-surface)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-on-surface)'}>
                                        {sec.groupName}
                                      </span>
                                    </span>
                                    <span style={{ fontWeight: '600' }}>{formatCurrency(sec.totalAmount)}</span>
                                  </div>
                                  {isSubExpanded && (
                                    <div style={{ paddingLeft: '24px', backgroundColor: 'var(--color-surface-container-lowest)' }}>
                                      {sec.ledgers.map((led, lIdx) => (
                                        <div key={lIdx} onClick={() => handleLedgerClick(led.ledgerId)} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px dashed var(--color-border-structural)', cursor: 'pointer', fontSize: '12px', color: 'var(--color-on-surface-variant)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                          <span><i className="fa-solid fa-file-invoice text-secondary" style={{ marginRight: '6px', fontSize: '11px' }}></i>{led.ledgerName}</span>
                                          <span>{formatCurrency(led.amount, true)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Gross Profit carried over (balancing Debit side) */}
                      {plData.grossProfit > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', fontWeight: '700', color: 'var(--color-on-surface)', borderBottom: '1px dashed var(--color-border-structural)', fontStyle: 'italic' }}>
                          <span>Gross Profit c/o</span>
                          <span>{formatCurrency(plData.grossProfit)}</span>
                        </div>
                      )}
                    </div>

                    {/* Subtotal Trading Expenses */}
                    <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border-structural)', backgroundColor: 'var(--color-surface-container-low)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', padding: '6px 12px', fontSize: '14px', color: 'var(--color-on-surface)', borderTop: '1px solid var(--color-border-structural)', borderBottom: '1px solid var(--color-border-structural)' }}>
                        <span>Total</span>
                        <span>{formatCurrency(plData.grossProfit > 0 ? plData.totalTradingCredit : plData.totalTradingDebit)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Trading Incomes */}
                  <div style={{ width: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ padding: '16px 20px' }}>
                      {/* Sales Accounts */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--radius-md)', fontWeight: '600', borderBottom: '1px dashed var(--color-border-structural)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button onClick={() => toggleSection('sales')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 6px', color: 'var(--color-outline)', display: 'flex', alignItems: 'center' }}>
                              <i className={`fa-solid ${expandedSections.sales ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ fontSize: '11px' }}></i>
                            </button>
                            <span onClick={() => handleGroupClick(plData.salesGroupId)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                              <i className="fa-solid fa-tags text-info" style={{ fontSize: '13px' }}></i>
                              Sales Accounts
                            </span>
                          </span>
                          <span>{formatCurrency(plData.salesSections.reduce((acc, curr) => acc + curr.totalAmount, 0))}</span>
                        </div>

                        {expandedSections.sales && (
                          <div style={{ paddingLeft: '16px', marginTop: '4px' }}>
                            {plData.salesSections.map((sec, sIdx) => {
                              const subKey = `sales-${sec.groupName}-${sIdx}`;
                              const isSubExpanded = !!expandedSubgroups[subKey];
                              const isCategoryGroup = sec.groupName.toLowerCase() === "sales accounts";

                              if (isCategoryGroup) {
                                return sec.ledgers.map((led, lIdx) => (
                                  <div key={`led-${lIdx}`} onClick={() => handleLedgerClick(led.ledgerId)} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px dashed var(--color-border-structural)', cursor: 'pointer', fontSize: '12px', color: 'var(--color-on-surface-variant)', paddingLeft: '32px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <span><i className="fa-solid fa-file-invoice text-secondary" style={{ marginRight: '6px', fontSize: '11px' }}></i>{led.ledgerName}</span>
                                    <span>{formatCurrency(led.amount, true)}</span>
                                  </div>
                                ));
                              }

                              return (
                                <div key={subKey} style={{ fontSize: '13px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid var(--color-border-structural)', fontWeight: '500' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <button onClick={() => toggleSubgroup(subKey)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--color-outline)', display: 'flex', alignItems: 'center' }}>
                                        <i className={`fa-solid ${isSubExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ fontSize: '10px' }}></i>
                                      </button>
                                      <span onClick={() => handleGroupClick(sec.GroupId || plData.salesGroupId)} style={{ cursor: 'pointer', color: 'var(--color-on-surface)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-on-surface)'}>
                                        {sec.groupName}
                                      </span>
                                    </span>
                                    <span style={{ fontWeight: '600' }}>{formatCurrency(sec.totalAmount)}</span>
                                  </div>
                                  {isSubExpanded && (
                                    <div style={{ paddingLeft: '24px', backgroundColor: 'var(--color-surface-container-lowest)' }}>
                                      {sec.ledgers.map((led, lIdx) => (
                                        <div key={lIdx} onClick={() => handleLedgerClick(led.ledgerId)} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px dashed var(--color-border-structural)', cursor: 'pointer', fontSize: '12px', color: 'var(--color-on-surface-variant)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                          <span><i className="fa-solid fa-file-invoice text-secondary" style={{ marginRight: '6px', fontSize: '11px' }}></i>{led.ledgerName}</span>
                                          <span>{formatCurrency(led.amount, true)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Direct Incomes */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--radius-md)', fontWeight: '600', borderBottom: '1px dashed var(--color-border-structural)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button onClick={() => toggleSection('directIncome')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 6px', color: 'var(--color-outline)', display: 'flex', alignItems: 'center' }}>
                              <i className={`fa-solid ${expandedSections.directIncome ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ fontSize: '11px' }}></i>
                            </button>
                            <span onClick={() => handleGroupClick(plData.directIncomeGroupId)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                              <i className="fa-solid fa-folder-closed text-success" style={{ fontSize: '13px' }}></i>
                              Direct Incomes
                            </span>
                          </span>
                          <span>{formatCurrency(plData.directIncomeSections.reduce((acc, curr) => acc + curr.totalAmount, 0))}</span>
                        </div>

                        {expandedSections.directIncome && (
                          <div style={{ paddingLeft: '16px', marginTop: '4px' }}>
                            {plData.directIncomeSections.map((sec, sIdx) => {
                              const subKey = `directIncome-${sec.groupName}-${sIdx}`;
                              const isSubExpanded = !!expandedSubgroups[subKey];
                              const isCategoryGroup = sec.groupName.toLowerCase() === "direct incomes";

                              if (isCategoryGroup) {
                                return sec.ledgers.map((led, lIdx) => (
                                  <div key={`led-${lIdx}`} onClick={() => handleLedgerClick(led.ledgerId)} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px dashed var(--color-border-structural)', cursor: 'pointer', fontSize: '12px', color: 'var(--color-on-surface-variant)', paddingLeft: '32px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <span><i className="fa-solid fa-file-invoice text-secondary" style={{ marginRight: '6px', fontSize: '11px' }}></i>{led.ledgerName}</span>
                                    <span>{formatCurrency(led.amount, true)}</span>
                                  </div>
                                ));
                              }

                              return (
                                <div key={subKey} style={{ fontSize: '13px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid var(--color-border-structural)', fontWeight: '500' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <button onClick={() => toggleSubgroup(subKey)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--color-outline)', display: 'flex', alignItems: 'center' }}>
                                        <i className={`fa-solid ${isSubExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ fontSize: '10px' }}></i>
                                      </button>
                                      <span onClick={() => handleGroupClick(sec.GroupId || plData.directIncomeGroupId)} style={{ cursor: 'pointer', color: 'var(--color-on-surface)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-on-surface)'}>
                                        {sec.groupName}
                                      </span>
                                    </span>
                                    <span style={{ fontWeight: '600' }}>{formatCurrency(sec.totalAmount)}</span>
                                  </div>
                                  {isSubExpanded && (
                                    <div style={{ paddingLeft: '24px', backgroundColor: 'var(--color-surface-container-lowest)' }}>
                                      {sec.ledgers.map((led, lIdx) => (
                                        <div key={lIdx} onClick={() => handleLedgerClick(led.ledgerId)} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px dashed var(--color-border-structural)', cursor: 'pointer', fontSize: '12px', color: 'var(--color-on-surface-variant)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                          <span><i className="fa-solid fa-file-invoice text-secondary" style={{ marginRight: '6px', fontSize: '11px' }}></i>{led.ledgerName}</span>
                                          <span>{formatCurrency(led.amount, true)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Gross Loss carried over (balancing Credit side) */}
                      {plData.grossLoss > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', fontWeight: '700', color: 'var(--color-on-surface)', borderBottom: '1px dashed var(--color-border-structural)', fontStyle: 'italic' }}>
                          <span>Gross Loss c/o</span>
                          <span>{formatCurrency(plData.grossLoss)}</span>
                        </div>
                      )}
                    </div>

                    {/* Subtotal Trading Income */}
                    <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border-structural)', backgroundColor: 'var(--color-surface-container-low)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', padding: '6px 12px', fontSize: '14px', color: 'var(--color-on-surface)', borderTop: '1px solid var(--color-border-structural)', borderBottom: '1px solid var(--color-border-structural)' }}>
                        <span>Total</span>
                        <span>{formatCurrency(plData.grossProfit > 0 ? plData.totalTradingCredit : plData.totalTradingDebit)}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* ==================== PART 2: INCOME & EXPENSES (Net Profit calculation) ==================== */}
                <div style={{ display: 'flex', width: '100%', minHeight: '280px', fontSize: '14px', backgroundColor: 'var(--color-level-1)' }}>

                  {/* Left Column - Indirect Expenses */}
                  <div style={{ width: '50%', borderRight: '1px solid var(--color-border-structural)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ padding: '16px 20px' }}>
                      {/* Gross Loss brought forward */}
                      {plData.grossLoss > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', fontWeight: '700', color: '#dc2626', borderBottom: '1px dashed var(--color-border-structural)', marginBottom: '16px' }}>
                          <span>Gross Profit b/f (Loss)</span>
                          <span>{formatCurrency(plData.grossLoss)}</span>
                        </div>
                      )}

                      {/* Indirect Expenses */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--radius-md)', fontWeight: '600', borderBottom: '1px dashed var(--color-border-structural)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button onClick={() => toggleSection('indirectExpense')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 6px', color: 'var(--color-outline)', display: 'flex', alignItems: 'center' }}>
                              <i className={`fa-solid ${expandedSections.indirectExpense ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ fontSize: '11px' }}></i>
                            </button>
                            <span onClick={() => handleGroupClick(plData.indirectExpenseGroupId)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                              <i className="fa-solid fa-file-invoice text-secondary" style={{ fontSize: '13px' }}></i>
                              Indirect Expenses
                            </span>
                          </span>
                          <span>{formatCurrency(plData.indirectExpenseSections.reduce((acc, curr) => acc + curr.totalAmount, 0))}</span>
                        </div>

                        {expandedSections.indirectExpense && (
                          <div style={{ paddingLeft: '16px', marginTop: '4px' }}>
                            {plData.indirectExpenseSections.map((sec, sIdx) => {
                              const subKey = `indirectExpense-${sec.groupName}-${sIdx}`;
                              const isSubExpanded = !!expandedSubgroups[subKey];
                              const isCategoryGroup = sec.groupName.toLowerCase() === "indirect expenses";

                              if (isCategoryGroup) {
                                return sec.ledgers.map((led, lIdx) => (
                                  <div key={`led-${lIdx}`} onClick={() => handleLedgerClick(led.ledgerId)} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px dashed var(--color-border-structural)', cursor: 'pointer', fontSize: '12px', color: 'var(--color-on-surface-variant)', paddingLeft: '32px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <span><i className="fa-solid fa-file-invoice text-secondary" style={{ marginRight: '6px', fontSize: '11px' }}></i>{led.ledgerName}</span>
                                    <span>{formatCurrency(led.amount, true)}</span>
                                  </div>
                                ));
                              }

                              return (
                                <div key={subKey} style={{ fontSize: '13px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid var(--color-border-structural)', fontWeight: '500' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <button onClick={() => toggleSubgroup(subKey)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--color-outline)', display: 'flex', alignItems: 'center' }}>
                                        <i className={`fa-solid ${isSubExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ fontSize: '10px' }}></i>
                                      </button>
                                      <span onClick={() => handleGroupClick(sec.GroupId || plData.indirectExpenseGroupId)} style={{ cursor: 'pointer', color: 'var(--color-on-surface)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-on-surface)'}>
                                        {sec.groupName}
                                      </span>
                                    </span>
                                    <span style={{ fontWeight: '600' }}>{formatCurrency(sec.totalAmount)}</span>
                                  </div>
                                  {isSubExpanded && (
                                    <div style={{ paddingLeft: '24px', backgroundColor: 'var(--color-surface-container-lowest)' }}>
                                      {sec.ledgers.map((led, lIdx) => (
                                        <div key={lIdx} onClick={() => handleLedgerClick(led.ledgerId)} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px dashed var(--color-border-structural)', cursor: 'pointer', fontSize: '12px', color: 'var(--color-on-surface-variant)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                          <span><i className="fa-solid fa-file-invoice text-secondary" style={{ marginRight: '6px', fontSize: '11px' }}></i>{led.ledgerName}</span>
                                          <span>{formatCurrency(led.amount, true)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Nett Profit (balancing Debit side) */}
                      {plData.netProfit > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', fontWeight: '700', color: '#16a34a', borderBottom: '1px dashed var(--color-border-structural)' }}>
                          <span>Nett Profit</span>
                          <span>{formatCurrency(plData.netProfit)}</span>
                        </div>
                      )}
                    </div>

                    {/* Final Bottom Total (Debit) */}
                    <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border-structural)', backgroundColor: 'var(--color-level-0)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', padding: '6px 12px', fontSize: '15px', color: 'var(--color-on-surface)' }}>
                        <span>Total</span>
                        <span>{formatCurrency(plData.balancedTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Indirect Incomes */}
                  <div style={{ width: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ padding: '16px 20px' }}>
                      {/* Gross Profit brought forward */}
                      {plData.grossProfit > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', fontWeight: '700', color: '#16a34a', borderBottom: '1px dashed var(--color-border-structural)', marginBottom: '16px' }}>
                          <span>Gross Profit b/f</span>
                          <span>{formatCurrency(plData.grossProfit)}</span>
                        </div>
                      )}

                      {/* Indirect Incomes */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--radius-md)', fontWeight: '600', borderBottom: '1px dashed var(--color-border-structural)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button onClick={() => toggleSection('indirectIncome')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 6px', color: 'var(--color-outline)', display: 'flex', alignItems: 'center' }}>
                              <i className={`fa-solid ${expandedSections.indirectIncome ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ fontSize: '11px' }}></i>
                            </button>
                            <span onClick={() => handleGroupClick(plData.indirectIncomeGroupId)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                              <i className="fa-solid fa-dollar-sign text-primary" style={{ fontSize: '13px' }}></i>
                              Indirect Incomes
                            </span>
                          </span>
                          <span>{formatCurrency(plData.indirectIncomeSections.reduce((acc, curr) => acc + curr.totalAmount, 0))}</span>
                        </div>

                        {expandedSections.indirectIncome && (
                          <div style={{ paddingLeft: '16px', marginTop: '4px' }}>
                            {plData.indirectIncomeSections.map((sec, sIdx) => {
                              const subKey = `indirectIncome-${sec.groupName}-${sIdx}`;
                              const isSubExpanded = !!expandedSubgroups[subKey];
                              const isCategoryGroup = sec.groupName.toLowerCase() === "indirect incomes";

                              if (isCategoryGroup) {
                                return sec.ledgers.map((led, lIdx) => (
                                  <div key={`led-${lIdx}`} onClick={() => handleLedgerClick(led.ledgerId)} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px dashed var(--color-border-structural)', cursor: 'pointer', fontSize: '12px', color: 'var(--color-on-surface-variant)', paddingLeft: '32px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <span><i className="fa-solid fa-file-invoice text-secondary" style={{ marginRight: '6px', fontSize: '11px' }}></i>{led.ledgerName}</span>
                                    <span>{formatCurrency(led.amount, true)}</span>
                                  </div>
                                ));
                              }

                              return (
                                <div key={subKey} style={{ fontSize: '13px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid var(--color-border-structural)', fontWeight: '500' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <button onClick={() => toggleSubgroup(subKey)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--color-outline)', display: 'flex', alignItems: 'center' }}>
                                        <i className={`fa-solid ${isSubExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ fontSize: '10px' }}></i>
                                      </button>
                                      <span onClick={() => handleGroupClick(sec.GroupId || plData.indirectIncomeGroupId)} style={{ cursor: 'pointer', color: 'var(--color-on-surface)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-on-surface)'}>
                                        {sec.groupName}
                                      </span>
                                    </span>
                                    <span style={{ fontWeight: '600' }}>{formatCurrency(sec.totalAmount)}</span>
                                  </div>
                                  {isSubExpanded && (
                                    <div style={{ paddingLeft: '24px', backgroundColor: 'var(--color-surface-container-lowest)' }}>
                                      {sec.ledgers.map((led, lIdx) => (
                                        <div key={lIdx} onClick={() => handleLedgerClick(led.ledgerId)} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px dashed var(--color-border-structural)', cursor: 'pointer', fontSize: '12px', color: 'var(--color-on-surface-variant)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                          <span><i className="fa-solid fa-file-invoice text-secondary" style={{ marginRight: '6px', fontSize: '11px' }}></i>{led.ledgerName}</span>
                                          <span>{formatCurrency(led.amount, true)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Nett Loss (balancing Credit side) */}
                      {plData.netLoss > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', fontWeight: '700', color: '#dc2626', borderBottom: '1px dashed var(--color-border-structural)' }}>
                          <span>Nett Loss</span>
                          <span>{formatCurrency(plData.netLoss)}</span>
                        </div>
                      )}
                    </div>

                    {/* Final Bottom Total (Credit) */}
                    <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border-structural)', backgroundColor: 'var(--color-level-0)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', padding: '6px 12px', fontSize: '15px', color: 'var(--color-on-surface)' }}>
                        <span>Total</span>
                        <span>{formatCurrency(plData.balancedTotal)}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* LEVEL 2: Group Details */}
            {level === 2 && groupData && (
              <div>
                {/* Table Header */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-structural)', backgroundColor: 'var(--color-surface-container)', fontWeight: '700', fontSize: '13px', color: 'var(--color-on-surface)' }}>
                  <span style={{ flexGrow: 1, padding: '12px 20px' }}>Particulars</span>
                  <span style={{ width: '220px', textAlign: 'right', padding: '12px 20px' }}>Amount</span>
                </div>

                {/* Table Content */}
                <div style={{ minHeight: '380px', fontSize: '14px' }}>
                  {/* Subgroups (bold) */}
                  {groupData.subGroups
                    .filter(g => g.groupName.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((g, idx) => (
                      <div
                        key={`sub-${idx}`}
                        onClick={() => handleGroupClick(g.groupId)}
                        style={{ display: 'flex', padding: '10px 20px', borderBottom: '1px solid var(--color-border-structural)', cursor: 'pointer', fontWeight: '700', color: 'var(--color-on-surface)', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span style={{ flexGrow: 1 }}><i className="fa-solid fa-folder text-warning" style={{ marginRight: '8px' }}></i> {g.groupName}</span>
                        <span style={{ width: '220px', textAlign: 'right' }}>{formatCurrency(g.amount)}</span>
                      </div>
                    ))
                  }

                  {/* Ledgers */}
                  {groupData.ledgers
                    .filter(l => l.ledgerName.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((l, idx) => (
                      <div
                        key={`led-${idx}`}
                        onClick={() => handleLedgerClick(l.ledgerId)}
                        style={{ display: 'flex', padding: '10px 20px', borderBottom: '1px solid var(--color-border-structural)', cursor: 'pointer', color: 'var(--color-on-surface)', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span style={{ flexGrow: 1, paddingLeft: '16px' }}><i className="fa-solid fa-file-invoice text-secondary" style={{ marginRight: '8px' }}></i> {l.ledgerName}</span>
                        <span style={{ width: '220px', textAlign: 'right' }}>{formatCurrency(l.amount)}</span>
                      </div>
                    ))
                  }

                  {groupData.subGroups.length === 0 && groupData.ledgers.length === 0 && (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-outline)' }}>No child subgroups or ledgers have transactions.</div>
                  )}
                </div>

                {/* Group Total Row */}
                <div style={{ display: 'flex', padding: '14px 20px', backgroundColor: 'var(--color-level-0)', borderTop: '2px solid var(--color-border-structural)', fontWeight: '700', fontSize: '15px' }}>
                  <span style={{ flexGrow: 1 }}>Total {groupData.groupName}</span>
                  <span style={{ width: '220px', textAlign: 'right' }}>
                    {formatCurrency(
                      groupData.subGroups.reduce((a, c) => a + c.amount, 0) +
                      groupData.ledgers.reduce((a, c) => a + c.amount, 0)
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* LEVEL 3: Monthly Summary */}
            {level === 3 && ledgerData && (
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
                          {ledgerData.ledgerName}<br/>
                          {ledgerData.companyName}<br/>
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
                        {formatCurrency(ledgerData.openingBalance)} {ledgerData.openingBalanceType}
                      </td>
                    </tr>
                    {ledgerData.months && ledgerData.months.map((m, idx) => (
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
                      <td style={{ textAlign: 'right', padding: '12px 20px', borderLeft: '1px solid var(--color-border-structural)', color: '#16a34a' }}>{formatCurrency(ledgerData.totalDebit)}</td>
                      <td style={{ textAlign: 'right', padding: '12px 20px', borderLeft: '1px solid var(--color-border-structural)', color: '#dc2626' }}>{formatCurrency(ledgerData.totalCredit)}</td>
                      <td style={{ textAlign: 'right', padding: '12px 20px', borderLeft: '1px solid var(--color-border-structural)' }}>{formatCurrency(ledgerData.closingBalance)} {ledgerData.closingBalanceType}</td>
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
                      <BarChart data={ledgerData.months} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
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
              <div style={{ border: '1px solid var(--color-border-structural)', borderRadius: 'var(--radius-lg)', position: 'relative' }}>
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
                          {formatTallyDate(voucherStartDate || startDate)} to {formatTallyDate(voucherEndDate || endDate)}
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
                        {formatCurrency(voucherData.openingBalance)} {voucherData.openingBalanceType}
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

                    {voucherData.vouchers.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-outline)' }}>No voucher transaction records found matching the filters.</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--color-border-structural)', fontWeight: '700' }}>
                      <td colSpan="4" style={{ padding: '10px 16px', textAlign: 'right' }}>Opening Balance:</td>
                      <td style={{ borderLeft: '1px solid var(--color-border-structural)' }}></td>
                      <td style={{ borderLeft: '1px solid var(--color-border-structural)' }}></td>
                      <td style={{ textAlign: 'right', padding: '10px 16px', borderLeft: '1px solid var(--color-border-structural)' }}>
                        {formatCurrency(voucherData.openingBalance)} {voucherData.openingBalanceType}
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
                        {formatCurrency(voucherData.closingBalance)} {voucherData.closingBalanceType}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfitAndLossReport;
