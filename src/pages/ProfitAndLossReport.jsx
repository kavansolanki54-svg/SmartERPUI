import React, { useState, useEffect } from 'react';
import { getProfitAndLoss, getGroupDetails, getLedgerSummary, getVoucherRegister } from '../services/api';
import toast from 'react-hot-toast';

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
        const response = await getLedgerSummary(currentLedgerId, startDate, endDate);
        if (response.success && response.data) {
          setLedgerData(response.data);
          const apiBreadcrumbs = response.data.breadcrumbs.map(b => ({
            name: b.groupName,
            level: 2,
            id: b.groupId
          }));
          setBreadcrumbs([
            { name: 'Profit & Loss', level: 1 },
            ...apiBreadcrumbs,
            { name: response.data.ledgerName, level: 3, id: response.data.ledgerId }
          ]);
        } else {
          toast.error(response.message || "Failed to load Ledger Summary");
        }
      } else if (level === 4) {
        const response = await getVoucherRegister(currentLedgerId, startDate, endDate, null, null, searchQuery);
        if (response.success && response.data) {
          setVoucherData(response.data);
          const apiBreadcrumbs = response.data.breadcrumbs.map(b => ({
            name: b.groupName,
            level: 2,
            id: b.groupId
          }));
          setBreadcrumbs([
            { name: 'Profit & Loss', level: 1 },
            ...apiBreadcrumbs,
            { name: response.data.ledgerName, level: 3, id: currentLedgerId },
            { name: 'Voucher Register', level: 4 }
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
  }, [level, currentGroupId, currentLedgerId, startDate, endDate, searchQuery]);

  const handleGroupClick = (groupId) => {
    if (!groupId) return;
    setCurrentGroupId(groupId);
    setLevel(2);
  };

  const handleLedgerClick = (ledgerId) => {
    if (!ledgerId) return;
    setCurrentLedgerId(ledgerId);
    setLevel(3);
  };

  const handleBreadcrumbClick = (bc) => {
    if (bc.level === 1) {
      setLevel(1);
      setBreadcrumbs([{ name: 'Profit & Loss', level: 1 }]);
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
      csvContent += `"${ledgerData.ledgerName} - Summary"\n`;
      csvContent += `"Opening Balance","${ledgerData.openingBalance}"\n`;
      csvContent += `"Period Debit","${ledgerData.periodDebit}"\n`;
      csvContent += `"Period Credit","${ledgerData.periodCredit}"\n`;
      csvContent += `"Closing Balance","${ledgerData.closingBalance}"\n`;
    } else if (level === 4 && voucherData) {
      csvContent += `"Date","Voucher No.","Voucher Type","Particulars","Debit","Credit","Running Balance"\n`;
      voucherData.vouchers.forEach(v => {
        csvContent += `"${v.date.split('T')[0]}","${v.voucherNo}","${v.voucherType}","${v.particulars}","${v.debit}","${v.credit}","${v.runningBalance}"\n`;
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
    <div style={{ padding: '24px', backgroundColor: 'var(--color-background)', minHeight: '100vh', fontFamily: 'var(--font-family-base)' }}>

      {/* Print Specific CSS Styles */}
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
      `}} />

      {/* Combined Title, Date Filter & Actions Card */}
      <div style={{
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
      <div id="print-area" style={{ backgroundColor: 'var(--color-level-1)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-structural)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>

        {loading && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-on-surface-variant)', fontSize: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <span className="spinner-border text-primary" role="status" aria-hidden="true" style={{ width: '2rem', height: '2rem' }}></span>
            <span>Calculating Profit & Loss statement...</span>
          </div>
        )}

        {!loading && (
          <>
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

            {/* LEVEL 3: Ledger Summary */}
            {level === 3 && ledgerData && (
              <div>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-structural)', backgroundColor: 'var(--color-surface-container)', fontWeight: '700', fontSize: '13px', color: 'var(--color-on-surface)' }}>
                  <span style={{ flexGrow: 1, padding: '12px 20px' }}>Ledger Account Summary</span>
                  <span style={{ width: '250px', textAlign: 'right', padding: '12px 20px' }}>Value</span>
                </div>

                <div style={{ minHeight: '350px', padding: '24px 32px', fontSize: '14px', maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ borderBottom: '1px solid var(--color-border-structural)', paddingBottom: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-on-surface)' }}>{ledgerData.ledgerName}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--color-border-structural)' }}>
                    <span style={{ color: 'var(--color-on-surface-variant)' }}>Opening Balance</span>
                    <span style={{ fontWeight: '700' }}>{formatCurrency(ledgerData.openingBalance)} {ledgerData.balanceType}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--color-border-structural)' }}>
                    <span style={{ color: 'var(--color-on-surface-variant)' }}>Total Debit Transactions</span>
                    <span style={{ fontWeight: '700', color: '#16a34a' }}>{formatCurrency(ledgerData.periodDebit)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--color-border-structural)' }}>
                    <span style={{ color: 'var(--color-on-surface-variant)' }}>Total Credit Transactions</span>
                    <span style={{ fontWeight: '700', color: '#dc2626' }}>{formatCurrency(ledgerData.periodCredit)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '2px solid var(--color-border-structural)', fontSize: '15px', fontWeight: '700' }}>
                    <span>Closing Balance</span>
                    <span>{formatCurrency(ledgerData.closingBalance)} {ledgerData.balanceType}</span>
                  </div>

                  <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={() => setLevel(4)}
                      style={{
                        padding: '10px 24px',
                        backgroundColor: 'var(--color-primary)',
                        color: 'var(--color-on-primary)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                      }}
                    >
                      <i className="fa-solid fa-list-check" style={{ marginRight: '8px' }}></i> View Voucher Details
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* LEVEL 4: Voucher Details / Register */}
            {level === 4 && voucherData && (
              <div>
                {/* Table Header */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-structural)', backgroundColor: 'var(--color-surface-container)', fontWeight: '700', fontSize: '12px', color: 'var(--color-on-surface)' }}>
                  <span style={{ width: '100px', padding: '12px 16px' }}>Date</span>
                  <span style={{ width: '120px', padding: '12px 16px' }}>Voucher No.</span>
                  <span style={{ width: '120px', padding: '12px 16px' }}>Voucher Type</span>
                  <span style={{ flexGrow: 1, padding: '12px 16px' }}>Particulars</span>
                  <span style={{ width: '130px', textAlign: 'right', padding: '12px 16px' }}>Debit</span>
                  <span style={{ width: '130px', textAlign: 'right', padding: '12px 16px' }}>Credit</span>
                  <span style={{ width: '150px', textAlign: 'right', padding: '12px 16px' }}>Running Balance</span>
                </div>

                {/* Table Content */}
                <div style={{ minHeight: '380px', fontSize: '13px' }}>
                  {/* Opening Balance Row */}
                  <div style={{ display: 'flex', padding: '10px 16px', borderBottom: '1px dashed var(--color-border-structural)', backgroundColor: 'var(--color-level-0)', fontStyle: 'italic', fontWeight: '700', color: 'var(--color-on-surface-variant)' }}>
                    <span style={{ width: '100px' }}></span>
                    <span style={{ width: '120px' }}></span>
                    <span style={{ width: '120px' }}></span>
                    <span style={{ flexGrow: 1 }}>Opening Balance</span>
                    <span style={{ width: '130px' }}></span>
                    <span style={{ width: '130px' }}></span>
                    <span style={{ width: '150px', textAlign: 'right' }}>{formatCurrency(voucherData.openingBalance)}</span>
                  </div>

                  {/* Vouchers list */}
                  {voucherData.vouchers.map((v, idx) => (
                    <div
                      key={idx}
                      style={{ display: 'flex', padding: '10px 16px', borderBottom: '1px solid var(--color-border-structural)' }}
                    >
                      <span style={{ width: '100px' }}>{v.date.split('T')[0]}</span>
                      <span style={{ width: '120px' }}>{v.voucherNo}</span>
                      <span style={{ width: '120px' }}>{v.voucherType}</span>
                      <span style={{ flexGrow: 1 }}>{v.particulars}</span>
                      <span style={{ width: '130px', textAlign: 'right', color: '#16a34a', fontWeight: '600' }}>{v.debit > 0 ? formatCurrency(v.debit) : ''}</span>
                      <span style={{ width: '130px', textAlign: 'right', color: '#dc2626', fontWeight: '600' }}>{v.credit > 0 ? formatCurrency(v.credit) : ''}</span>
                      <span style={{ width: '150px', textAlign: 'right', fontWeight: '700' }}>{formatCurrency(v.runningBalance)}</span>
                    </div>
                  ))}

                  {voucherData.vouchers.length === 0 && (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-outline)' }}>No voucher transaction records found matching the filters.</div>
                  )}
                </div>

                {/* Voucher Register Summary Row */}
                <div style={{ display: 'flex', padding: '14px 16px', backgroundColor: 'var(--color-level-0)', borderTop: '2px solid var(--color-border-structural)', fontWeight: '700', fontSize: '13px' }}>
                  <span style={{ width: '100px' }}></span>
                  <span style={{ width: '120px' }}></span>
                  <span style={{ width: '120px' }}></span>
                  <span style={{ flexGrow: 1 }}>Total Transactions</span>
                  <span style={{ width: '130px', textAlign: 'right', color: '#16a34a' }}>{formatCurrency(voucherData.totalDebit)}</span>
                  <span style={{ width: '130px', textAlign: 'right', color: '#dc2626' }}>{formatCurrency(voucherData.totalCredit)}</span>
                  <span style={{ width: '150px', textAlign: 'right' }}>{formatCurrency(voucherData.closingBalance)}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfitAndLossReport;
