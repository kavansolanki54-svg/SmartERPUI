import React, { useState, useEffect } from 'react';
import { getProfitAndLoss } from '../services/api';
import toast from 'react-hot-toast';

const ProfitAndLossReport = () => {
  const today = new Date();
  
  // Calculate current financial year start (April 1st) and end (March 31st of next year)
  const currentMonth = today.getMonth(); // 0-indexed (0 = Jan, 3 = Apr)
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
  const [data, setData] = useState(null);

  // States to expand/collapse groups
  const [expandedGroups, setExpandedGroups] = useState({
    purchase: false,
    directExp: false,
    sales: false,
    directInc: false,
    indirectExp: false,
    indirectInc: false
  });

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await getProfitAndLoss(startDate, endDate);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        toast.error(response.message || "Failed to load report data");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while fetching Profit & Loss report.");
    } finally {
      setLoading(false);
    }
  };

  // Automatically load data when either start date or end date changes
  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '0.00';
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!data) return;

    // Build CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Title Rows
    csvContent += `"Profit & Loss Account"\n`;
    csvContent += `"${data.companyName}"\n`;
    csvContent += `"${data.periodDisplay}"\n\n`;

    // Headers
    csvContent += `"DEBIT / EXPENSES","AMOUNT","CREDIT / INCOME","AMOUNT"\n`;

    const leftRows = [];
    // Purchase accounts
    leftRows.push(["Purchase Accounts", data.purchaseSections.reduce((acc, curr) => acc + curr.totalAmount, 0)]);
    data.purchaseSections.forEach(sec => {
      sec.ledgers.forEach(led => {
        leftRows.push([`  ${led.ledgerName}`, led.amount]);
      });
    });

    // Direct expenses
    leftRows.push(["Direct Expenses", data.directExpenseSections.reduce((acc, curr) => acc + curr.totalAmount, 0)]);
    data.directExpenseSections.forEach(sec => {
      sec.ledgers.forEach(led => {
        leftRows.push([`  ${led.ledgerName}`, led.amount]);
      });
    });

    // Gross Loss b/f
    if (data.grossLoss > 0) {
      leftRows.push(["Gross Loss b/f", data.grossLoss]);
    }

    // Indirect expenses
    leftRows.push(["Indirect Expenses", data.indirectExpenseSections.reduce((acc, curr) => acc + curr.totalAmount, 0)]);
    data.indirectExpenseSections.forEach(sec => {
      sec.ledgers.forEach(led => {
        leftRows.push([`  ${led.ledgerName}`, led.amount]);
      });
    });

    if (data.netProfit > 0) {
      leftRows.push(["Nett Profit", data.netProfit]);
    }

    const rightRows = [];
    // Sales accounts
    rightRows.push(["Sales Accounts", data.salesSections.reduce((acc, curr) => acc + curr.totalAmount, 0)]);
    data.salesSections.forEach(sec => {
      sec.ledgers.forEach(led => {
        rightRows.push([`  ${led.ledgerName}`, led.amount]);
      });
    });

    // Direct incomes
    rightRows.push(["Direct Incomes", data.directIncomeSections.reduce((acc, curr) => acc + curr.totalAmount, 0)]);
    data.directIncomeSections.forEach(sec => {
      sec.ledgers.forEach(led => {
        rightRows.push([`  ${led.ledgerName}`, led.amount]);
      });
    });

    // Gross Loss c/o
    if (data.grossLoss > 0) {
      rightRows.push(["Gross Loss c/o", data.grossLoss]);
    }

    // Gross Profit b/f
    if (data.grossProfit > 0) {
      rightRows.push(["Gross Profit b/f", data.grossProfit]);
    }

    // Indirect incomes
    rightRows.push(["Indirect Incomes", data.indirectIncomeSections.reduce((acc, curr) => acc + curr.totalAmount, 0)]);
    data.indirectIncomeSections.forEach(sec => {
      sec.ledgers.forEach(led => {
        rightRows.push([`  ${led.ledgerName}`, led.amount]);
      });
    });

    if (data.netLoss > 0) {
      rightRows.push(["Nett Loss", data.netLoss]);
    }

    // Combine rows side by side
    const maxRows = Math.max(leftRows.length, rightRows.length);
    for (let i = 0; i < maxRows; i++) {
      const left = leftRows[i] || ["", ""];
      const right = rightRows[i] || ["", ""];
      
      const leftLabel = left[0].replace(/"/g, '""');
      const leftAmt = left[1] !== "" && left[1] !== undefined ? left[1] : "";
      const rightLabel = right[0].replace(/"/g, '""');
      const rightAmt = right[1] !== "" && right[1] !== undefined ? right[1] : "";

      csvContent += `"${leftLabel}","${leftAmt}","${rightLabel}","${rightAmt}"\n`;
    }

    // Totals
    csvContent += `\n"TOTAL DEBIT","${data.balancedTotal}","TOTAL CREDIT","${data.balancedTotal}"\n`;

    // Download CSV
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Profit_and_Loss_${data.companyName}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFYLabel = () => {
    if (!startDate) return 'All-Time';
    const sDate = new Date(startDate);
    const year = sDate.getFullYear();
    const shortYear = (year + 1).toString().slice(-2);
    return `FY ${year.toString().slice(-2)}-${shortYear}`;
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100%', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Print Specific CSS Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}} />

      {/* Top Title & Header Buttons Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Profit & Loss Account</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Summary of revenue, costs, and expenses for the specified period.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleExportExcel} 
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#fff', 
              color: '#16a34a', 
              border: '1px solid #16a34a', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontSize: '13px', 
              fontWeight: '600', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)' 
            }}
          >
            <i className="fa-solid fa-file-excel"></i> Export Excel
          </button>
          <button 
            onClick={handlePrint} 
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#4f46e5', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontSize: '13px', 
              fontWeight: '600', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)' 
            }}
          >
            <i className="fa-solid fa-file-pdf"></i> Export PDF
          </button>
        </div>
      </div>

      {/* Modern Filter Card */}
      <div style={{ 
        backgroundColor: '#fff', 
        borderRadius: '12px', 
        padding: '20px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)', 
        border: '1px solid #e2e8f0', 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '24px'
      }}>
        {/* Period picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Period Range</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', color: '#334155' }}
            />
            <span style={{ fontSize: '13px', color: '#64748b' }}>to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', color: '#334155' }}
            />
          </div>
        </div>

        {loading && (
          <div style={{ marginLeft: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', fontSize: '13px', fontWeight: '500' }}>
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '14px', height: '14px' }}></span>
            Updating report...
          </div>
        )}
      </div>

      {loading && !data && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}></div>
          <span style={{ marginTop: '16px', color: '#64748b', fontSize: '14px' }}>Loading financial statement...</span>
        </div>
      )}

      {/* Main Report Table Container */}
      {data && (
        <div id="printable-report" style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)', overflow: 'hidden' }}>
          
          {/* Header Row split strictly side by side */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            {/* Debit Header */}
            <div style={{ width: '50%', padding: '12px 20px', borderRight: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '13.5px', letterSpacing: '0.5px', color: '#334155' }}>DEBIT / EXPENSES</span>
              <span style={{ fontSize: '11px', color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '100px', fontWeight: '600' }}>
                {data.companyName} | {getFYLabel()}
              </span>
            </div>
            {/* Credit Header */}
            <div style={{ width: '50%', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '13.5px', letterSpacing: '0.5px', color: '#334155' }}>CREDIT / INCOME</span>
              <span style={{ fontSize: '11px', color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '100px', fontWeight: '600' }}>
                {data.companyName} | {getFYLabel()}
              </span>
            </div>
          </div>

          {/* Two-Column Content strictly side-by-side flex */}
          <div style={{ display: 'flex', width: '100%', minHeight: '400px', fontSize: '14px' }}>
            
            {/* Left Side Content - Expenses */}
            <div style={{ width: '50%', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ padding: '20px', flexGrow: 1 }}>
                
                {/* Purchase Accounts */}
                <div style={{ marginBottom: '16px' }}>
                  <div 
                    onClick={() => toggleGroup('purchase')}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      backgroundColor: expandedGroups.purchase ? '#f1f5f9' : 'transparent'
                    }}
                    onMouseEnter={(e) => { if(!expandedGroups.purchase) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseLeave={(e) => { if(!expandedGroups.purchase) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600', color: '#1e293b' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#fffbeb' }}>
                        <i className="fa-solid fa-cart-shopping text-warning" style={{ fontSize: '12px' }}></i>
                      </span>
                      Purchase Accounts
                    </span>
                    <span style={{ fontWeight: '700' }}>
                      {formatCurrency(data.purchaseSections.reduce((acc, curr) => acc + curr.totalAmount, 0))}
                      <i className={`fa-solid fa-chevron-${expandedGroups.purchase ? 'up' : 'down'} ms-2`} style={{ fontSize: '10px', color: '#94a3b8' }}></i>
                    </span>
                  </div>

                  {expandedGroups.purchase && (
                    <div style={{ paddingLeft: '40px', paddingRight: '12px', marginTop: '6px' }}>
                      {data.purchaseSections.map((sec, sIdx) => (
                        <div key={sIdx} style={{ marginBottom: '6px' }}>
                          {sec.ledgers.map((led, lIdx) => (
                            <div key={lIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#64748b', fontStyle: 'italic', padding: '2px 0' }}>
                              <span>{led.ledgerName}</span>
                              <span>{formatCurrency(led.amount)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Direct Expenses */}
                <div style={{ marginBottom: '16px' }}>
                  <div 
                    onClick={() => toggleGroup('directExp')}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      backgroundColor: expandedGroups.directExp ? '#f1f5f9' : 'transparent'
                    }}
                    onMouseEnter={(e) => { if(!expandedGroups.directExp) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseLeave={(e) => { if(!expandedGroups.directExp) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600', color: '#1e293b' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#fef2f2' }}>
                        <i className="fa-solid fa-bolt text-danger" style={{ fontSize: '12px' }}></i>
                      </span>
                      Direct Expenses
                    </span>
                    <span style={{ fontWeight: '700' }}>
                      {formatCurrency(data.directExpenseSections.reduce((acc, curr) => acc + curr.totalAmount, 0))}
                      <i className={`fa-solid fa-chevron-${expandedGroups.directExp ? 'up' : 'down'} ms-2`} style={{ fontSize: '10px', color: '#94a3b8' }}></i>
                    </span>
                  </div>

                  {expandedGroups.directExp && (
                    <div style={{ paddingLeft: '40px', paddingRight: '12px', marginTop: '6px' }}>
                      {data.directExpenseSections.map((sec, sIdx) => (
                        <div key={sIdx} style={{ marginBottom: '6px' }}>
                          {sec.ledgers.map((led, lIdx) => (
                            <div key={lIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#64748b', fontStyle: 'italic', padding: '2px 0' }}>
                              <span>{led.ledgerName}</span>
                              <span>{formatCurrency(led.amount)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Indirect Expenses */}
                <div style={{ marginBottom: '16px' }}>
                  <div 
                    onClick={() => toggleGroup('indirectExp')}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      backgroundColor: expandedGroups.indirectExp ? '#f1f5f9' : 'transparent'
                    }}
                    onMouseEnter={(e) => { if(!expandedGroups.indirectExp) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseLeave={(e) => { if(!expandedGroups.indirectExp) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600', color: '#1e293b' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                        <i className="fa-solid fa-file-invoice text-secondary" style={{ fontSize: '12px' }}></i>
                      </span>
                      Indirect Expenses
                    </span>
                    <span style={{ fontWeight: '700' }}>
                      {formatCurrency(data.indirectExpenseSections.reduce((acc, curr) => acc + curr.totalAmount, 0))}
                      <i className={`fa-solid fa-chevron-${expandedGroups.indirectExp ? 'up' : 'down'} ms-2`} style={{ fontSize: '10px', color: '#94a3b8' }}></i>
                    </span>
                  </div>

                  {expandedGroups.indirectExp && (
                    <div style={{ paddingLeft: '40px', paddingRight: '12px', marginTop: '6px' }}>
                      {data.indirectExpenseSections.map((sec, sIdx) => (
                        <div key={sIdx} style={{ marginBottom: '6px' }}>
                          {sec.ledgers.map((led, lIdx) => (
                            <div key={lIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#64748b', fontStyle: 'italic', padding: '2px 0' }}>
                              <span>{led.ledgerName}</span>
                              <span>{formatCurrency(led.amount)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Placeholder Row */}
                <div style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '12px', paddingLeft: '12px', marginTop: '24px' }}>No further entries</div>

              </div>

              {/* Bottom highlight & total for left column */}
              <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0' }}>
                {data.netProfit > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#16a34a' }}>
                      <i className="fa-solid fa-arrow-trend-up"></i> Gross Profit
                    </span>
                    <span style={{ fontWeight: '700', color: '#16a34a', fontSize: '15px' }}>{formatCurrency(data.netProfit)}</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', color: '#64748b', fontSize: '12.5px' }}>
                      <i className="fa-solid fa-circle-info"></i> Balancing Figure
                    </span>
                    <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '12.5px' }}>Balanced</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '0 8px' }}>
                  <span style={{ fontWeight: '700', color: '#64748b', fontSize: '12px', letterSpacing: '0.5px' }}>TOTAL DEBIT</span>
                  <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '17px' }}>{formatCurrency(data.balancedTotal)}</span>
                </div>
              </div>

            </div>

            {/* Right Side Content - Incomes */}
            <div style={{ width: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ padding: '20px', flexGrow: 1 }}>
                
                {/* Sales Accounts */}
                <div style={{ marginBottom: '16px' }}>
                  <div 
                    onClick={() => toggleGroup('sales')}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      backgroundColor: expandedGroups.sales ? '#f1f5f9' : 'transparent'
                    }}
                    onMouseEnter={(e) => { if(!expandedGroups.sales) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseLeave={(e) => { if(!expandedGroups.sales) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600', color: '#1e293b' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#e0f2fe' }}>
                        <i className="fa-solid fa-tags text-info" style={{ fontSize: '12px' }}></i>
                      </span>
                      Sales Accounts
                    </span>
                    <span style={{ fontWeight: '700' }}>
                      {formatCurrency(data.salesSections.reduce((acc, curr) => acc + curr.totalAmount, 0))}
                      <i className={`fa-solid fa-chevron-${expandedGroups.sales ? 'up' : 'down'} ms-2`} style={{ fontSize: '10px', color: '#94a3b8' }}></i>
                    </span>
                  </div>

                  {expandedGroups.sales && (
                    <div style={{ paddingLeft: '40px', paddingRight: '12px', marginTop: '6px' }}>
                      {data.salesSections.map((sec, sIdx) => (
                        <div key={sIdx} style={{ marginBottom: '6px' }}>
                          {sec.ledgers.map((led, lIdx) => (
                            <div key={lIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#64748b', fontStyle: 'italic', padding: '2px 0' }}>
                              <span>{led.ledgerName}</span>
                              <span>{formatCurrency(led.amount)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Direct Incomes */}
                <div style={{ marginBottom: '16px' }}>
                  <div 
                    onClick={() => toggleGroup('directInc')}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      backgroundColor: expandedGroups.directInc ? '#f1f5f9' : 'transparent'
                    }}
                    onMouseEnter={(e) => { if(!expandedGroups.directInc) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseLeave={(e) => { if(!expandedGroups.directInc) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600', color: '#1e293b' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#f0fdf4' }}>
                        <i className="fa-solid fa-folder-closed text-success" style={{ fontSize: '12px' }}></i>
                      </span>
                      Direct Incomes
                    </span>
                    <span style={{ fontWeight: '700' }}>
                      {formatCurrency(data.directIncomeSections.reduce((acc, curr) => acc + curr.totalAmount, 0))}
                      <i className={`fa-solid fa-chevron-${expandedGroups.directInc ? 'up' : 'down'} ms-2`} style={{ fontSize: '10px', color: '#94a3b8' }}></i>
                    </span>
                  </div>

                  {expandedGroups.directInc && (
                    <div style={{ paddingLeft: '40px', paddingRight: '12px', marginTop: '6px' }}>
                      {data.directIncomeSections.map((sec, sIdx) => (
                        <div key={sIdx} style={{ marginBottom: '6px' }}>
                          {sec.ledgers.map((led, lIdx) => (
                            <div key={lIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#64748b', fontStyle: 'italic', padding: '2px 0' }}>
                              <span>{led.ledgerName}</span>
                              <span>{formatCurrency(led.amount)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Indirect Incomes */}
                <div style={{ marginBottom: '16px' }}>
                  <div 
                    onClick={() => toggleGroup('indirectInc')}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      backgroundColor: expandedGroups.indirectInc ? '#f1f5f9' : 'transparent'
                    }}
                    onMouseEnter={(e) => { if(!expandedGroups.indirectInc) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseLeave={(e) => { if(!expandedGroups.indirectInc) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600', color: '#1e293b' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#eff6ff' }}>
                        <i className="fa-solid fa-dollar-sign text-primary" style={{ fontSize: '12px' }}></i>
                      </span>
                      Indirect Incomes
                    </span>
                    <span style={{ fontWeight: '700' }}>
                      {formatCurrency(data.indirectIncomeSections.reduce((acc, curr) => acc + curr.totalAmount, 0))}
                      <i className={`fa-solid fa-chevron-${expandedGroups.indirectInc ? 'up' : 'down'} ms-2`} style={{ fontSize: '10px', color: '#94a3b8' }}></i>
                    </span>
                  </div>

                  {expandedGroups.indirectInc && (
                    <div style={{ paddingLeft: '40px', paddingRight: '12px', marginTop: '6px' }}>
                      {data.indirectIncomeSections.map((sec, sIdx) => (
                        <div key={sIdx} style={{ marginBottom: '6px' }}>
                          {sec.ledgers.map((led, lIdx) => (
                            <div key={lIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#64748b', fontStyle: 'italic', padding: '2px 0' }}>
                              <span>{led.ledgerName}</span>
                              <span>{formatCurrency(led.amount)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Placeholder Row */}
                <div style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '12px', paddingLeft: '12px', marginTop: '24px' }}>No further entries</div>

              </div>

              {/* Bottom highlight & total for right column */}
              <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0' }}>
                {data.netProfit > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', color: '#64748b', fontSize: '12.5px' }}>
                      <i className="fa-solid fa-circle-info"></i> Balancing Figure
                    </span>
                    <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '12.5px' }}>Balanced</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#ef4444' }}>
                      <i className="fa-solid fa-arrow-trend-down"></i> Gross Loss
                    </span>
                    <span style={{ fontWeight: '700', color: '#ef4444', fontSize: '15px' }}>{formatCurrency(data.netLoss)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '0 8px' }}>
                  <span style={{ fontWeight: '700', color: '#64748b', fontSize: '12px', letterSpacing: '0.5px' }}>TOTAL CREDIT</span>
                  <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '17px' }}>{formatCurrency(data.balancedTotal)}</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default ProfitAndLossReport;
