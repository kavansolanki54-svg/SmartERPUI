import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Select from 'react-select';
import { getLedgers, getGroups, getVoucherConfigurations, saveSalesVoucher, getSalesVoucherById, getLedgerCurrentBalance, getNextVoucherNumber } from '../services/api';

// Simplified and Detailed Sales Voucher
const SalesVoucher = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [partyLedgers, setPartyLedgers] = useState([]);
  const [particularLedgers, setParticularLedgers] = useState([]);
  const [salesVoucherConfigId, setSalesVoucherConfigId] = useState(null);
  const [isAutoNumbering, setIsAutoNumbering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [partyBalance, setPartyBalance] = useState({ amount: 0, type: 'Dr' });
  const [activeRow, setActiveRow] = useState(null);

  const partySelectRef = useRef(null);
  const selectRefs = useRef({});

  const [voucherData, setVoucherData] = useState({
    voucherNo: '1',
    voucherDate: new Date().toISOString().split('T')[0],
    partyLedgerId: null,
    narration: '',
  });

  const [items, setItems] = useState([
    { id: 1, ledgerId: null, rate: '', amount: 0 }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      // 1. Accept (Save as Posted) on Ctrl + A
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        submitVoucher(2);
      }

      // 2. Draft (Save as Draft) on Ctrl + D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        submitVoucher(1);
      }

      // 3. Cancel (Esc)
      if (e.key === 'Escape') {
        e.preventDefault();
        navigate('/Sales');
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [navigate, voucherData, items, salesVoucherConfigId]);

  const fetchData = async () => {
    try {
      const [ledgersRes, groupsRes, configsRes] = await Promise.all([
        getLedgers(),
        getGroups(),
        getVoucherConfigurations()
      ]);

      const ledgersList = ledgersRes.data || [];
      const groupsList = groupsRes.data || [];
      const configsList = configsRes.data || [];

      // Find the Voucher Config for "Sales" (VoucherCategory === 1)
      const salesConfig = configsList.find(c => c.voucherCategory === 1);
      let configId = null;
      if (salesConfig) {
        configId = salesConfig.voucherConfigId;
        setSalesVoucherConfigId(salesConfig.voucherConfigId);
        setIsAutoNumbering(salesConfig.methodOfNumbering === 1);
      } else if (configsList.length > 0) {
        configId = configsList[0].voucherConfigId;
        setSalesVoucherConfigId(configsList[0].voucherConfigId);
        setIsAutoNumbering(configsList[0].methodOfNumbering === 1);
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

      const groupMap = {};
      groupsList.forEach(g => {
        groupMap[g.groupId] = g.parentGroupId;
      });

      const isPartyLedger = (ledger) => {
        let currentGroupId = ledger.groupId;
        while (currentGroupId) {
          const group = groupsList.find(g => g.groupId === currentGroupId);
          if (group) {
            const name = (group.groupName || '').toLowerCase();
            if (['sundry debtors', 'sundry creditors', 'cash-in-hand', 'bank accounts', 'bank od a/c', 'bank occ a/c'].includes(name)) {
              return true;
            }
            currentGroupId = group.parentGroupId;
          } else {
            break;
          }
        }
        return false;
      };

      const pLedgers = [];
      const partLedgers = [];

      ledgersList.forEach(l => {
        const option = { 
          value: l.ledgerId, 
          label: l.ledgerName,
          balance: l.openingBalance || 0,
          balanceType: l.balanceType || 'Dr'
        };
        if (isPartyLedger(l)) {
          pLedgers.push(option);
        } else {
          partLedgers.push(option);
        }
      });

      pLedgers.sort((a, b) => a.label.localeCompare(b.label));
      partLedgers.sort((a, b) => a.label.localeCompare(b.label));

      setPartyLedgers(pLedgers);
      setParticularLedgers(partLedgers);

      // If we are editing, fetch the existing voucher
      if (id) {
        const voucherRes = await getSalesVoucherById(id);
        if (voucherRes.success && voucherRes.data) {
          const vData = voucherRes.data;

          const partyId = vData.partyLedgerId;
          const matchingParty = pLedgers.find(p => p.value === partyId) || null;
          
          setVoucherData({
            voucherNo: vData.voucherNo || '',
            voucherDate: vData.voucherDate ? vData.voucherDate.split('T')[0] : '',
            partyLedgerId: matchingParty,
            narration: vData.narration || ''
          });

          if (matchingParty) {
            fetchPartyBalance(matchingParty.value);
          }

          // Map LedgerEntries (excluding the Party Debit entry) to Items
          const particularEntries = (vData.ledgerEntries || []).filter(e => e.ledgerEntryType === 2); // 2 = Credit
          if (particularEntries.length > 0) {
            const loadedItems = particularEntries.map(e => {
              const matchingParticular = partLedgers.find(p => p.value === e.ledgerId) || null;
              return {
                id: e.salesVoucherLedgerEntryId || Date.now() + Math.random(),
                ledgerId: matchingParticular,
                amount: e.amount,
                rate: ''
              };
            });
            setItems(loadedItems);
          }
        } else {
          toast.error("Failed to load voucher for editing.");
        }
      }

    } catch (err) {
      console.error("Failed to load data", err);
    }
  };

  const handleInputChange = (field, value) => {
    setVoucherData(prev => ({ ...prev, [field]: value }));
    if (field === 'partyLedgerId') {
      if (value) {
        fetchPartyBalance(value.value);
      } else {
        setPartyBalance({ amount: 0, type: 'Dr' });
      }
    }
  };

  const fetchPartyBalance = async (ledgerId) => {
    try {
      const res = await getLedgerCurrentBalance(ledgerId);
      if (res.success && res.data) {
        setPartyBalance({ amount: res.data.balance, type: res.data.balanceType });
      }
    } catch (err) {
      console.error("Failed to fetch balance", err);
    }
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
          }
        } catch (err) {
          console.error(err);
        }
        setTimeout(() => {
          const amtInput = document.getElementById(`amount-${index}`);
          if (amtInput) amtInput.focus();
        }, 50);
      }
    }
    setItems(updatedItems);
  };

  const addNewRow = () => {
    setItems([...items, { id: Date.now(), ledgerId: null, rate: '', amount: 0 }]);
  };

  const handleAmountKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const amountVal = parseFloat(items[index].amount) || 0;
      if (amountVal > 0) {
        if (index === items.length - 1) {
          addNewRow();
          setTimeout(() => {
            const nextSelect = selectRefs.current[`particular-${index + 1}`];
            if (nextSelect) nextSelect.focus();
          }, 50);
        } else {
          const nextSelect = selectRefs.current[`particular-${index + 1}`];
          if (nextSelect) nextSelect.focus();
        }
      } else {
        const narrationInput = document.getElementById('narration-input');
        if (narrationInput) narrationInput.focus();
      }
    }
  };

  const removeRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const submitVoucher = async (statusId) => {
    if (!salesVoucherConfigId) {
      toast.error("Sales Voucher Configuration not found!");
      return;
    }
    if (!voucherData.partyLedgerId) {
      toast.error("Please select a Party A/C Name!");
      return;
    }

    const validItems = items.filter(i => i.ledgerId && parseFloat(i.amount) > 0);
    if (validItems.length === 0) {
      toast.error("Please enter at least one valid particular with an amount!");
      return;
    }

    setIsSaving(true);

    try {
      const totalAmount = calculateTotal();

      // Construct Ledger Entries for Double-Entry Accounting
      const ledgerEntries = [];

      // 1. Debit the Party for the total amount
      ledgerEntries.push({
        ledgerId: voucherData.partyLedgerId.value,
        ledgerEntryType: 1, // Debit
        amount: totalAmount,
        narration: voucherData.narration
      });

      // 2. Credit the Particulars for their respective amounts
      validItems.forEach(item => {
        ledgerEntries.push({
          ledgerId: item.ledgerId.value,
          ledgerEntryType: 2, // Credit
          amount: parseFloat(item.amount),
          narration: voucherData.narration
        });
      });

      const payload = {
        salesVoucherHeaderId: id ? parseInt(id, 10) : 0,
        voucherConfigId: salesVoucherConfigId,
        voucherNo: voucherData.voucherNo,
        voucherDate: new Date(voucherData.voucherDate).toISOString(),
        partyLedgerId: voucherData.partyLedgerId.value,
        totalAmount: totalAmount,
        narration: voucherData.narration,
        voucherStatus: statusId, // 1 = Draft, 2 = Posted
        ledgerEntries: ledgerEntries
      };

      const res = await saveSalesVoucher(payload);
      if (res.success) {
        toast.success(statusId === 1 ? "Voucher saved as draft!" : "Voucher posted successfully!");
        navigate('/Sales');
      } else {
        toast.error(res.message || "Failed to save voucher.");
      }

    } catch (err) {
      console.error(err);
      toast.error("Failed to save voucher. Please check console for details.");
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

  const formatBalance = (amount, type) => {
    const formattedAmt = parseFloat(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const formattedType = (type || '').trim().toLowerCase() === 'cr' ? 'Cr' : 'Dr';
    return `${formattedAmt} ${formattedType}`;
  };

  const getUpdatedBalance = (ledgerOption, currentAmount, entryType) => {
    if (!ledgerOption) return { amount: 0, type: 'Dr' };
    const baseAmt = parseFloat(ledgerOption.balance || 0);
    const baseType = (ledgerOption.balanceType || 'Dr').trim().toLowerCase();
    const amountVal = parseFloat(currentAmount || 0);

    let balanceInDr = baseType === 'dr' ? baseAmt : -baseAmt;
    if (entryType === 1) {
      balanceInDr += amountVal;
    } else {
      balanceInDr -= amountVal;
    }

    if (balanceInDr >= 0) {
      return { amount: balanceInDr, type: 'Dr' };
    } else {
      return { amount: Math.abs(balanceInDr), type: 'Cr' };
    }
  };

  const displayPartyBalance = () => {
    if (!voucherData.partyLedgerId) return '0.00 Dr';
    const totalAmount = calculateTotal();
    const updated = getUpdatedBalance(
      { balance: partyBalance.amount, balanceType: partyBalance.type },
      totalAmount,
      1
    );
    return formatBalance(updated.amount, updated.type);
  };

  const displayParticularBalance = (item) => {
    if (!item.ledgerId) return '0.00 Dr';
    const updated = getUpdatedBalance(
      { balance: item.balance, balanceType: item.balanceType },
      item.amount,
      2
    );
    return formatBalance(updated.amount, updated.type);
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
        /* Hide HTML5 Up/Down Spinners */
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
        /* Hide Calendar Picker Icon */
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
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          padding: '4px 12px',
          borderBottom: '1px solid #7ea1c4'
        }}>
          {/* Left: Sales Block & Number */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              backgroundColor: '#003366', 
              color: '#ffffff', 
              padding: '2px 12px', 
              fontWeight: 'bold', 
              fontSize: '13px',
              textTransform: 'uppercase'
            }}>
              Sales
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
                width: '300px',
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
                onClick={(e) => { try { e.target.showPicker(); } catch(err) {} }}
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

        {/* Tally Account Selection Block */}
        <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ width: '120px', fontSize: '14px', color: '#333', fontWeight: 'bold' }}>Party A/c Name</span>
            <span style={{ color: '#333', marginRight: '16px', fontWeight: 'bold' }}>:</span>
            <div style={{ width: '350px' }}>
              <Select
                ref={partySelectRef}
                value={voucherData.partyLedgerId}
                onChange={val => handleInputChange('partyLedgerId', val)}
                options={partyLedgers}
                styles={customSelectStyles}
                placeholder="Select Party Account"
                onFocus={() => setActiveRow('party')}
                onBlur={() => setActiveRow(null)}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ width: '120px', fontSize: '12px', color: '#555', fontStyle: 'italic' }}>Current balance</span>
            <span style={{ color: '#555', marginRight: '16px', fontStyle: 'italic' }}>:</span>
            <span style={{ fontSize: '13px', fontWeight: 'bold', fontStyle: 'italic', color: '#333' }}>
              {voucherData.partyLedgerId ? displayPartyBalance() : '0.00 Dr'}
            </span>
          </div>
        </div>

        {/* Tally Main Grid Table */}
        <div style={{ borderTop: '2px solid #7ea1c4', borderBottom: '2px solid #7ea1c4', backgroundColor: '#eef6fa', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          
          {/* Header Row */}
          <div style={{ 
            display: 'flex', 
            padding: '4px 16px', 
            borderBottom: '1px solid #7ea1c4',
            fontWeight: 'bold',
            fontSize: '13px',
            color: '#000'
          }}>
            <div style={{ flex: 1 }}>Particulars</div>
            <div style={{ width: '180px', textAlign: 'right' }}>Amount</div>
            <div style={{ width: '40px' }}></div>
          </div>

          {/* Rows List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {items.map((item, index) => {
              const isCurrentRowActive = activeRow === index;
              return (
                <div key={item.id} style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  padding: '2px 16px',
                  backgroundColor: isCurrentRowActive ? '#fef08a' : 'transparent',
                  transition: 'background-color 0.1s'
                }}>
                  {/* Particulars Select Column */}
                  <div style={{ flex: 1 }}>
                    <Select
                      ref={el => selectRefs.current[`particular-${index}`] = el}
                      value={item.ledgerId}
                      onChange={(val) => handleItemChange(index, 'ledgerId', val)}
                      options={particularLedgers}
                      styles={customSelectStyles}
                      placeholder="Select Ledger Account"
                      onFocus={() => setActiveRow(index)}
                      onBlur={() => setActiveRow(null)}
                    />
                    
                    {/* Live balance indicator below particular dropdown */}
                    {item.ledgerId && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#555', 
                        fontStyle: 'italic', 
                        marginLeft: '4px',
                        marginTop: '2px',
                        fontWeight: 'bold'
                      }}>
                        Cur Bal: {displayParticularBalance(item)}
                      </div>
                    )}
                  </div>

                  {/* Amount Column */}
                  <div style={{ width: '180px' }}>
                    <input
                      id={`amount-${index}`}
                      type="number"
                      step="0.01"
                      value={item.amount || ''}
                      onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                      onKeyDown={(e) => handleAmountKeyDown(e, index)}
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
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>

                  {/* Action Column */}
                  <div style={{ width: '40px', textAlign: 'right', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    {items.length > 1 && (
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
          </div>

          {/* Table Bottom Divider */}
          <div style={{ height: '1px', backgroundColor: '#7ea1c4' }}></div>

          {/* Grid Total Row */}
          <div style={{ 
            display: 'flex', 
            padding: '4px 16px', 
            fontWeight: 'bold',
            fontSize: '15px',
            color: '#000',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1, textAlign: 'right', fontSize: '13px', color: '#555' }}>Total :</div>
            <div style={{ 
              width: '180px', 
              textAlign: 'right',
              borderTop: '1px solid #000',
              borderBottom: '3px double #000',
              padding: '4px 0',
              fontFamily: 'monospace'
            }}>
              ₹ {calculateTotal().toFixed(2)}
            </div>
            <div style={{ width: '40px' }}></div>
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
              onClick={() => navigate('/Sales')}
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
              disabled={isSaving}
              style={{ 
                padding: '8px 20px', 
                backgroundColor: 'var(--color-primary)', 
                color: '#fff', 
                border: 'none', 
                cursor: 'pointer', 
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

export default SalesVoucher;
