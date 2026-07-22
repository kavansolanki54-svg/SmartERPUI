import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getLedgers, deleteLedger } from '../services/api';
import EnterpriseDataGrid from '../components/EnterpriseDataGrid';

const COLUMNS = [
  { key: 'ledgerName', label: 'LEDGER NAME', align: 'left', sortable: true, filterable: true, filterType: 'text', width: '220px' },
  { key: 'groupName', label: 'GROUP NAME', align: 'left', sortable: true, filterable: true, filterType: 'text', width: '200px' },
  { key: 'openingBalance', label: 'OPENING BALANCE', align: 'right', sortable: true, filterable: true, filterType: 'text', width: '160px', isSum: true },
  { key: 'crDr', label: 'CR/DR', align: 'center', sortable: true, filterable: true, filterType: 'select', options: ['All', 'Dr', 'Cr'], width: '100px' },
  { key: 'action', label: 'ACTION', align: 'center', sortable: false, filterable: false, width: '100px' },
];

const LedgerList = () => {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLedgers = async () => {
    setLoading(true);
    try {
      const response = await getLedgers();
      if (response.success && response.data) {
        setLedgers(response.data);
      } else {
        toast.error(response.message || 'Failed to load ledgers');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching ledgers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgers();
  }, []);

  const handleDelete = (id) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>Delete this ledger?</span>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={() => toast.dismiss(t.id)} style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Cancel</button>
          <button onClick={async () => {
            toast.dismiss(t.id);
            try {
              const res = await deleteLedger(id);
              if (res.success) {
                toast.success('Ledger deleted');
                fetchLedgers();
              } else {
                toast.error(res.message || 'Failed to delete');
              }
            } catch {
              toast.error('Error deleting ledger');
            }
          }} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Delete</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  return (
    <div className="list-page-container">
      <EnterpriseDataGrid
        title="Ledger Master"
        icon="fa-book-bookmark"
        columns={COLUMNS}
        data={ledgers}
        loading={loading}
        createLink="/ledger/create"
        createLabel="Add Ledger"
        editLinkPrefix="/ledger/edit"
        onDelete={handleDelete}
        idKey="ledgerId"
        onRefresh={fetchLedgers}
      />
    </div>
  );
};

export default LedgerList;
