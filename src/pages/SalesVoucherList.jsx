import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { getSalesVouchers, deleteSalesVoucher } from '../services/api';
import EnterpriseDataGrid from '../components/EnterpriseDataGrid';

const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '-';
  return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${dt.getFullYear()}`;
};

const statusLabel = (id) => id === 2 ? 'Posted' : id === 3 ? 'Cancelled' : 'Draft';

const COLUMNS = [
  { key: 'voucherNo', label: 'VOUCHER NO.', align: 'left', sortable: true, filterable: true, filterType: 'text', width: '150px' },
  { key: 'voucherDateFormatted', label: 'DATE', align: 'left', sortable: true, filterable: true, filterType: 'text', width: '130px' },
  { key: 'partyName', label: 'PARTY / CUSTOMER', align: 'left', sortable: true, filterable: true, filterType: 'text', width: '220px' },
  { key: 'narration', label: 'NARRATION', align: 'left', sortable: true, filterable: true, filterType: 'text', width: null },
  { key: 'totalAmount', label: 'AMOUNT', align: 'right', sortable: true, filterable: true, filterType: 'text', width: '150px', isSum: true },
  { key: 'statusText', label: 'STATUS', align: 'center', sortable: true, filterable: true, filterType: 'select', options: ['All', 'Draft', 'Posted', 'Cancelled'], width: '130px' },
  { key: 'action', label: 'ACTION', align: 'center', sortable: false, filterable: false, width: '100px' },
];

const SalesVoucherList = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const response = await getSalesVouchers();
      if (response.success && response.data) {
        setVouchers(response.data);
      } else {
        toast.error(response.message || 'Failed to load sales vouchers');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error loading sales vouchers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleDelete = (id) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>Delete this sales voucher?</span>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={() => toast.dismiss(t.id)} style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Cancel</button>
          <button onClick={async () => {
            toast.dismiss(t.id);
            try {
              const res = await deleteSalesVoucher(id);
              if (res.success) {
                toast.success('Deleted successfully');
                fetchVouchers();
              } else {
                toast.error(res.message || 'Failed to delete');
              }
            } catch {
              toast.error('Error deleting sales voucher');
            }
          }} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Delete</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const enrichedData = useMemo(() => {
    return vouchers.map(v => ({
      ...v,
      voucherDateFormatted: fmtDate(v.voucherDate),
      partyName: v.partyLedgerName || v.customerLedgerName || '-',
      statusText: statusLabel(v.voucherStatus),
      totalAmount: parseFloat(v.totalAmount || 0)
    }));
  }, [vouchers]);

  const customRenderers = {
    statusText: (val, row) => {
      const id = row.voucherStatus;
      const c = id === 2 ? { icon: 'fa-circle-check', bg: '#d1fae5', color: '#065f46' }
              : id === 3 ? { icon: 'fa-circle-xmark', bg: '#fee2e2', color: '#dc2626' }
              :            { icon: 'fa-clock', bg: '#fef3c7', color: '#92400e' };
      return (
        <span style={{ color: c.color, backgroundColor: c.bg, padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <i className={`fa-solid ${c.icon}`} style={{ fontSize: '9px' }}></i>{val.toUpperCase()}
        </span>
      );
    }
  };

  return (
    <div className="list-page-container">
      <EnterpriseDataGrid
        title="Sales Voucher"
        icon="fa-chart-line"
        columns={COLUMNS}
        data={enrichedData}
        loading={loading}
        createLink="/Sales/create"
        createLabel="Add Sales Voucher"
        editLinkPrefix="/Sales/edit"
        onDelete={handleDelete}
        idKey="salesVoucherHeaderId"
        customRenderers={customRenderers}
        onRefresh={fetchVouchers}
      />
    </div>
  );
};

export default SalesVoucherList;
