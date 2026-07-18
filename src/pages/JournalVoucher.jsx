import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Select from 'react-select';
import { getLedgers, getVoucherConfigurations, saveJournalVoucher, getJournalVoucherById, getLedgerCurrentBalance, getNextVoucherNumber } from '../services/api';

const JournalVoucher = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [allLedgers, setAllLedgers] = useState([]);
  const [journalVoucherConfigId, setJournalVoucherConfigId] = useState(null);
  const [isAutoNumbering, setIsAutoNumbering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeRow, setActiveRow] = useState(null);

  const [voucherData, setVoucherData] = useState({
    voucherNo: '1',
    voucherDate: new Date().toISOString().split('T')[0],
    narration: '',
  });

  // Journal Voucher uses a full double-entry grid:
  // Each row has: ledger, drAmount, crAmount, current balance
  const [items, setItems] = useState([
    { id: 1, ledgerId: null, drAmount: 0, crAmount: 0, balance: 0, balanceType: 'Dr' },
    { id: 2, ledgerId: null, drAmount: 0, crAmount: 0, balance: 0, balanceType: 'Dr' },
  ]);

  const selectRefs = useRef({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        submitVoucher(2);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        submitVoucher(1);
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        navigate('/Journal');
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [navigate, voucherData, items, journalVoucherConfigId]);

  const fetchData = async () => {
    try {
      const [ledgersRes, configsRes] = await Promise.all([
        getLedgers(),
        getVoucherConfigurations()
      ]);

      const ledgersList = ledgersRes.data || [];
      const configsList = configsRes.data || [];

      // Find the Voucher Config for "Journal" (VoucherCategory === 52)
      const journalConfig = configsList.find(c => c.voucherCategory === 52);
      let configId = null;
      if (journalConfig) {
        configId = journalConfig.voucherConfigId;
        setJournalVoucherConfigId(journalConfig.voucherConfigId);
        setIsAutoNumbering(journalConfig.methodOfNumbering === 1);
      } else if (configsList.length > 0) {
        const fallback = configsList.find(c => (c.voucherName || '').toLowerCase().includes('journal')) || configsList[0];
        configId = fallback.voucherConfigId;
        setJournalVoucherConfigId(fallback.voucherConfigId);
        setIsAutoNumbering(fallback.methodOfNumbering === 1);
      }

      // Fetch next auto-generated voucher number for new vouchers
      if (!id && configId) {
        try {
          const nextNoRes = await getNextVoucherNumber(configId);
          if (nextNoRes.success && nextNoRes.data) {
            setVoucherData(prev => ({ ...prev, voucherNo: nextNoRes.data }));
          }
        } catch (err) {
          console.error('Failed to fetch next voucher number', err);
        }
      }

      const ledgerOptions = ledgersList.map(l => ({
        value: l.ledgerId,
        label: l.ledgerName,
        balance: l.openingBalance || 0,
        balanceType: l.balanceType || 'Dr'
      })).sort((a, b) => a.label.localeCompare(b.label));

      setAllLedgers(ledgerOptions);

      // If editing
      if (id) {
        const voucherRes = await getJournalVoucherById(id);
        if (voucherRes.success && voucherRes.data) {
          const vData = voucherRes.data;

          setVoucherData({
            voucherNo: vData.voucherNo || '',
            voucherDate: vData.voucherDate ? vData.voucherDate.split('T')[0] : '',
            narration: vData.narration || '',
          });

          const entries = vData.ledgerEntries || [];
          if (entries.length > 0) {
            const loadedItems = await Promise.all(entries.map(async (e) => {
              const matchingLedger = ledgerOptions.find(p => p.value === e.ledgerId) || null;
              let bal = 0;
              let balType = 'Dr';
              if (matchingLedger) {
                try {
                  const balRes = await getLedgerCurrentBalance(matchingLedger.value);
                  if (balRes.success && balRes.data) {
                    bal = balRes.data.balance;
                    balType = balRes.data.balanceType;
                  }
                } catch (err) {
                  console.error(err);
                }
              }
              return {
                id: e.journalVoucherLedgerEntryId || Date.now() + Math.random(),
                ledgerId: matchingLedger,
                drAmount: e.ledgerEntryType === 1 ? e.amount : 0, // 1 = Debit
                crAmount: e.ledgerEntryType === 2 ? e.amount : 0, // 2 = Credit
                balance: bal,
                balanceType: balType,
              };
            }));
            setItems(loadedItems);
          }
        } else {
          toast.error('Failed to load voucher for editing.');
        }
      }

    } catch (err) {
      console.error('Failed to load data', err);
    }
  };

  const handleInputChange = (field, value) => {
    setVoucherData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = async (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;

    if (field === 'ledgerId') {
      if (value) {
        try {
          const res = await getLedgerCurrentBalance(value.value);
          if (res.success && res.data) {
            updatedItems[index].balance = res.data.balance;
            updatedItems[index].balanceType = res.data.balanceType;
          } else {
            updatedItems[index].balance = value.balance || 0;
            updatedItems[index].balanceType = value.balanceType || 'Dr';
          }
        } catch (err) {
          console.error(err);
          updatedItems[index].balance = value.balance || 0;
          updatedItems[index].balanceType = value.balanceType || 'Dr';
        }
        // Jump to Dr amount input
        setTimeout(() => {
          const drInput = document.getElementById(`dr-${index}`);
          if (drInput) drInput.focus();
        }, 50);
      } else {
        updatedItems[index].balance = 0;
        updatedItems[index].balanceType = 'Dr';
      }
    }

    if (field === 'drAmount') {
      updatedItems[index].drAmount = parseFloat(value) || 0;
      updatedItems[index].crAmount = 0; // Cannot have both Dr and Cr on same row
    }

    if (field === 'crAmount') {
      updatedItems[index].crAmount = parseFloat(value) || 0;
      updatedItems[index].drAmount = 0; // Cannot have both Dr and Cr on same row
    }

    setItems(updatedItems);
  };

  const addNewRow = () => {
    setItems([...items, { id: Date.now(), ledgerId: null, drAmount: 0, crAmount: 0, balance: 0, balanceType: 'Dr' }]);
  };

  const handleDrKeyDown = (e, index) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      // Move to Cr input
      const crInput = document.getElementById(`cr-${index}`);
      if (crInput) crInput.focus();
    }
  };

  const handleCrKeyDown = (e, index) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const item = items[index];
      // If this row has data, move to next row's ledger or add a new row
      if (item.ledgerId && (item.drAmount > 0 || item.crAmount > 0)) {
        if (index === items.length - 1) {
          addNewRow();
          setTimeout(() => {
            if (selectRefs.current[`ledger-${index + 1}`]) {
              selectRefs.current[`ledger-${index + 1}`].focus();
            }
          }, 100);
        } else {
          if (selectRefs.current[`ledger-${index + 1}`]) {
            selectRefs.current[`ledger-${index + 1}`].focus();
          }
        }
      } else {
        const narrInput = document.getElementById('narration-input');
        if (narrInput) narrInput.focus();
      }
    }
  };

  const removeRow = (index) => {
    if (items.length > 2) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const totalDr = items.reduce((sum, item) => sum + (parseFloat(item.drAmount) || 0), 0);
    const totalCr = items.reduce((sum, item) => sum + (parseFloat(item.crAmount) || 0), 0);
    return { totalDr, totalCr };
  };

  const { totalDr, totalCr } = calculateTotals();
  const isBalanced = Math.abs(totalDr - totalCr) < 0.001;
  const difference = Math.abs(totalDr - totalCr);

  const formatBalance = (amount, type) => {
    const formattedAmt = parseFloat(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const formattedType = (type || '').trim().toLowerCase() === 'cr' ? 'Cr' : 'Dr';
    return `${formattedAmt} ${formattedType}`;
  };

  const displayCurrentBalance = (item) => {
    if (!item.ledgerId) return '0.00 Dr';
    const baseAmt = parseFloat(item.balance || 0);
    const baseType = (item.balanceType || 'Dr').trim().toLowerCase();
    const drAmt = parseFloat(item.drAmount || 0);
    const crAmt = parseFloat(item.crAmount || 0);

    let balanceInDr = baseType === 'dr' ? baseAmt : -baseAmt;
    balanceInDr += drAmt;
    balanceInDr -= crAmt;

    if (balanceInDr >= 0) {
      return formatBalance(balanceInDr, 'Dr');
    } else {
      return formatBalance(Math.abs(balanceInDr), 'Cr');
    }
  };

  const submitVoucher = async (statusId) => {
    if (!journalVoucherConfigId) {
      toast.error('Journal Voucher Configuration not found!');
      return;
    }

    const validItems = items.filter(i => i.ledgerId && (parseFloat(i.drAmount) > 0 || parseFloat(i.crAmount) > 0));
    if (validItems.length < 2) {
      toast.error('Please enter at least two ledger entries!');
      return;
    }

    const { totalDr, totalCr } = calculateTotals();
    if (Math.abs(totalDr - totalCr) > 0.001) {
      toast.error(`Voucher is not balanced! Debit: ₹${totalDr.toFixed(2)}, Credit: ₹${totalCr.toFixed(2)}`);
      return;
    }

    setIsSaving(true);

    try {
      const ledgerEntries = validItems.map(item => {
        const isDebit = parseFloat(item.drAmount) > 0;
        return {
          ledgerId: item.ledgerId.value,
          ledgerEntryType: isDebit ? 1 : 2,
          amount: isDebit ? parseFloat(item.drAmount) : parseFloat(item.crAmount),
          narration: voucherData.narration
        };
      });

      const payload = {
        journalVoucherHeaderId: id ? parseInt(id, 10) : 0,
        voucherConfigId: journalVoucherConfigId,
        voucherNo: voucherData.voucherNo,
        voucherDate: new Date(voucherData.voucherDate).toISOString(),
        totalDebitAmount: totalDr,
        narration: voucherData.narration,
        voucherStatus: statusId,
        ledgerEntries: ledgerEntries
      };

      const res = await saveJournalVoucher(payload);
      if (res.success) {
        toast.success(statusId === 1 ? 'Journal saved as draft!' : 'Journal posted successfully!');
        navigate('/Journal');
      } else {
        toast.error(res.message || 'Failed to save journal voucher.');
      }

    } catch (err) {
      console.error(err);
      toast.error('Failed to save voucher. Please check console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  const getDayOfWeek = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getFormattedDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-');
  };

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      border: 'none',
      boxShadow: 'none',
      backgroundColor: state.isFocused ? '#fef08a' : 'transparent',
      minHeight: '28px',
      height: '28px',
      fontSize: '14px',
      fontWeight: 'bold',
      borderRadius: '0',
      cursor: 'text',
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 4px',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#000000',
      fontWeight: 'bold',
    }),
    input: (provided) => ({
      ...provided,
      margin: '0',
      padding: '0',
    }),
    indicatorsContainer: () => ({
      display: 'none',
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      borderRadius: '2px',
      border: '1px solid #7ea1c4',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      backgroundColor: '#faffff'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#003366'
        : state.isFocused
          ? '#e2eff5'
          : '#faffff',
      color: state.isSelected ? '#ffffff' : '#000000',
      fontSize: '13px',
      padding: '6px 12px',
      cursor: 'pointer'
    })
  };

  return (
    <div style={{ backgroundColor: '#f1f6f8', height: 'calc(100vh - 80px)', overflow: 'hidden', padding: '12px', fontFamily: "'Segoe UI', Consolas, Monaco, monospace", display: 'flex', flexDirection: 'column' }}>
      <style>{`
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          display: none;
          -webkit-appearance: none;
        }
      `}</style>

      {/* Tally Screen Wrapper */}
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        backgroundColor: '#eef6fa',
        border: '1px solid #7ea1c4',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden'
      }}>

        {/* Tally Top Title Bar */}
        <div className="voucher-header-row" style={{ alignItems: 'flex-start', padding: '4px 12px' }}>
          {/* Left: Journal Block & Number */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              backgroundColor: '#5d4037',
              color: '#ffffff',
              padding: '2px 12px',
              fontWeight: 'bold',
              fontSize: '13px',
              textTransform: 'uppercase'
            }}>
              Journal
            </span>
            <span style={{ color: '#555', fontSize: '13px', fontWeight: 'bold' }}>No.</span>
            <input
              type="text"
              value={voucherData.voucherNo}
              onChange={(e) => handleInputChange('voucherNo', e.target.value)}
              disabled={isAutoNumbering}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#000',
                outline: 'none',
                width: '100%',
                maxWidth: '300px',
                padding: '0'
              }}
            />
          </div>

          {/* Right: Date and Day */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#000', fontFamily: 'monospace' }}>
                  {voucherData.voucherDate ? getFormattedDate(voucherData.voucherDate) : ''}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#000' }}>
                  ({getDayOfWeek(voucherData.voucherDate)})
                </span>
              </div>
              <input
                type="date"
                value={voucherData.voucherDate}
                onChange={(e) => handleInputChange('voucherDate', e.target.value)}
                onClick={(e) => { try { e.target.showPicker(); } catch (err) { } }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
        </div>

        {/* Journal info bar */}
        <div style={{ padding: '4px 16px', backgroundColor: '#ddeef5', borderBottom: '1px solid #7ea1c4', display: 'flex', gap: '24px', alignItems: 'center', fontSize: '12px', color: '#003366', fontWeight: 'bold' }}>
          <span>📖 Journal Voucher &mdash; Double-Entry Mode</span>
          <span style={{ color: isBalanced ? '#166534' : '#991b1b' }}>
            {isBalanced ? '✓ Balanced' : `⚠ Difference: ₹${difference.toFixed(2)}`}
          </span>
        </div>

        {/* Tally Main Grid Table */}
        <div className="voucher-grid-container">
          <div className="voucher-grid-table">

            {/* Header Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 160px 160px 40px',
              padding: '4px 16px',
              borderBottom: '1px solid #7ea1c4',
              fontWeight: 'bold',
              fontSize: '13px',
              color: '#000'
            }}>
              <div>Particulars (Ledger Account)</div>
              <div style={{ textAlign: 'right', color: '#166534' }}>Debit (Dr)</div>
              <div style={{ textAlign: 'right', color: '#991b1b' }}>Credit (Cr)</div>
              <div></div>
            </div>

            {/* Rows List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {items.map((item, index) => {
                const isCurrentRowActive = activeRow === index;
                return (
                  <div key={item.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 160px 160px 40px',
                    alignItems: 'flex-start',
                    padding: '2px 16px',
                    backgroundColor: isCurrentRowActive ? '#fef9c3' : index % 2 === 0 ? 'transparent' : '#f8fafc',
                    transition: 'background-color 0.1s',
                    borderBottom: '1px dashed #c8dce9'
                  }}>
                    {/* Ledger Select Column */}
                    <div>
                      <Select
                        ref={el => selectRefs.current[`ledger-${index}`] = el}
                        value={item.ledgerId}
                        onChange={(val) => handleItemChange(index, 'ledgerId', val)}
                        options={allLedgers}
                        styles={customSelectStyles}
                        placeholder="Select Ledger Account"
                        onFocus={() => setActiveRow(index)}
                        onBlur={() => setActiveRow(null)}
                      />
                      {item.ledgerId && (
                        <div style={{ fontSize: '11px', color: '#555', fontStyle: 'italic', marginLeft: '4px', marginTop: '1px', fontWeight: 'bold' }}>
                          Bal: {displayCurrentBalance(item)}
                        </div>
                      )}
                    </div>

                    {/* Dr Amount Column */}
                    <div>
                      <input
                        id={`dr-${index}`}
                        type="number"
                        step="0.01"
                        value={item.drAmount || ''}
                        onChange={(e) => handleItemChange(index, 'drAmount', e.target.value)}
                        onKeyDown={(e) => handleDrKeyDown(e, index)}
                        placeholder="0.00"
                        onFocus={() => setActiveRow(index)}
                        onBlur={() => setActiveRow(null)}
                        style={{
                          width: '100%',
                          border: 'none',
                          background: 'transparent',
                          textAlign: 'right',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          outline: 'none',
                          height: '28px',
                          padding: '0 4px',
                          backgroundColor: isCurrentRowActive ? '#fef08a' : 'transparent',
                          fontFamily: 'monospace',
                          color: '#166534'
                        }}
                      />
                    </div>

                    {/* Cr Amount Column */}
                    <div>
                      <input
                        id={`cr-${index}`}
                        type="number"
                        step="0.01"
                        value={item.crAmount || ''}
                        onChange={(e) => handleItemChange(index, 'crAmount', e.target.value)}
                        onKeyDown={(e) => handleCrKeyDown(e, index)}
                        placeholder="0.00"
                        onFocus={() => setActiveRow(index)}
                        onBlur={() => setActiveRow(null)}
                        style={{
                          width: '100%',
                          border: 'none',
                          background: 'transparent',
                          textAlign: 'right',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          outline: 'none',
                          height: '28px',
                          padding: '0 4px',
                          backgroundColor: isCurrentRowActive ? '#fef08a' : 'transparent',
                          fontFamily: 'monospace',
                          color: '#991b1b'
                        }}
                      />
                    </div>

                    {/* Action Column */}
                    <div style={{ height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      {items.length > 2 && (
                        <button
                          onClick={() => removeRow(index)}
                          style={{ border: 'none', backgroundColor: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}
                          title="Delete Row"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add Row Button */}
              <div style={{ padding: '4px 16px' }}>
                <button
                  onClick={addNewRow}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#1a5276',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    padding: '2px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <i className="fa-solid fa-plus"></i> Add Row
                </button>
              </div>
            </div>

            {/* Table Bottom Divider */}
            <div style={{ height: '1px', backgroundColor: '#7ea1c4' }}></div>

            {/* Grid Total Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 160px 160px 40px',
              padding: '4px 16px',
              fontWeight: 'bold',
              fontSize: '14px',
              color: '#000',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '13px', color: '#555', textAlign: 'right' }}>Total :</div>
              <div style={{
                textAlign: 'right',
                borderTop: '1px solid #000',
                borderBottom: '3px double #000',
                padding: '4px 0',
                fontFamily: 'monospace',
                color: '#166534'
              }}>
                ₹ {totalDr.toFixed(2)}
              </div>
              <div style={{
                textAlign: 'right',
                borderTop: '1px solid #000',
                borderBottom: `3px double ${isBalanced ? '#000' : '#ef4444'}`,
                padding: '4px 0',
                fontFamily: 'monospace',
                color: '#991b1b'
              }}>
                ₹ {totalCr.toFixed(2)}
              </div>
              <div></div>
            </div>

            {/* Difference indicator */}
            {!isBalanced && (
              <div style={{ padding: '2px 16px', textAlign: 'right', fontSize: '12px', color: '#ef4444', fontWeight: 'bold', paddingRight: '56px' }}>
                Difference: ₹ {difference.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Tally Bottom Narration and Action Block */}
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#eef6fa',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '24px'
        }}>
          {/* Narration input on the left */}
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>Narration:</label>
            <textarea
              id="narration-input"
              value={voucherData.narration}
              onChange={(e) => handleInputChange('narration', e.target.value)}
              placeholder="Enter narration remarks"
              onFocus={() => setActiveRow('narration')}
              onBlur={() => setActiveRow(null)}
              style={{
                width: '100%',
                height: '48px',
                border: 'none',
                outline: 'none',
                padding: '6px',
                fontSize: '13px',
                resize: 'none',
                fontWeight: 'bold',
                backgroundColor: activeRow === 'narration' ? '#fef08a' : '#fff',
                borderBottom: '1px solid #7ea1c4'
              }}
            />
          </div>

          {/* Action buttons on the right */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/Journal')}
              style={{
                padding: '8px 20px',
                backgroundColor: '#fff',
                color: '#475569',
                border: '1px solid #7ea1c4',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
                borderRadius: '2px'
              }}
            >
              Esc: Cancel
            </button>

            <button
              onClick={() => submitVoucher(1)}
              disabled={isSaving}
              style={{
                padding: '8px 20px',
                backgroundColor: '#fff',
                color: 'var(--color-primary)',
                border: '1px solid var(--color-primary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
                borderRadius: '2px',
                opacity: isSaving ? 0.5 : 1
              }}
            >
              Draft
            </button>

            <button
              onClick={() => submitVoucher(2)}
              disabled={isSaving || !isBalanced}
              title={!isBalanced ? 'Voucher must be balanced before posting' : ''}
              style={{
                padding: '8px 20px',
                backgroundColor: isBalanced ? 'var(--color-primary)' : '#94a3b8',
                color: '#fff',
                border: 'none',
                cursor: isSaving || !isBalanced ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
                borderRadius: '2px',
                opacity: isSaving ? 0.5 : 1
              }}
            >
              Accept (Yes)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default JournalVoucher;
