import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getPurchaseVouchers, deletePurchaseVoucher } from '../services/api';

const PurchaseVoucherList = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const response = await getPurchaseVouchers();
      if (response.success && response.data) {
        setVouchers(response.data);
      } else {
        toast.error(response.message || "Failed to load purchase vouchers");
      }
    } catch (error) {
      console.error("Failed to fetch purchase vouchers", error);
      toast.error("An error occurred while loading purchase vouchers");
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
        <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-on-surface)' }}>
          Are you sure you want to delete this purchase voucher?
        </span>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              toast.dismiss(t.id);
            }}
            style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', color: 'var(--color-on-surface-variant)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await deletePurchaseVoucher(id);
                if (res.success) {
                  toast.success('Purchase voucher deleted successfully');
                  fetchVouchers();
                } else {
                  toast.error(res.message || 'Failed to delete purchase voucher');
                }
              } catch (err) {
                console.error(err);
                toast.error('An error occurred while deleting');
              }
            }}
            style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
          >
            Delete
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  // Filter and paginate
  const filteredVouchers = vouchers.filter(v => {
    const vNo = String(v.voucherNo || '').toLowerCase();
    const date = String(v.voucherDate || '').toLowerCase();
    
    return vNo.includes(searchTerm.toLowerCase()) ||
           date.includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredVouchers.length / entriesPerPage);
  const currentEntries = filteredVouchers.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderStatus = (statusId) => {
    if (statusId === 2) {
      return <span style={{ color: '#16a34a', backgroundColor: '#dcfce7', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>POSTED</span>;
    } else if (statusId === 3) {
      return <span style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>CANCELLED</span>;
    }
    return <span style={{ color: '#ca8a04', backgroundColor: '#fef9c3', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>DRAFT</span>;
  };

  return (
    <>
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100%', padding: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-on-surface)' }}>Purchase Voucher</div>
          <Link
            to="/Purchase/create"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              padding: '8px 20px',
              borderRadius: '4px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i className="fa-solid fa-plus"></i> Add Purchase Voucher
          </Link>
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--color-border-structural)', marginBottom: '24px' }}></div>

        {/* Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={entriesPerPage}
                onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                style={{ padding: '6px 32px 6px 12px', borderRadius: '6px', border: '1px solid var(--color-border-structural)', backgroundColor: '#fff', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236c757d\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', fontSize: '13px' }}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>entries per page</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Voucher No, Date..."
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-border-structural)', width: '250px', fontSize: '13px', outline: 'none' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--color-border-structural)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border-structural)', backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: 'var(--color-on-surface)' }}>Voucher No</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: 'var(--color-on-surface)' }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: 'var(--color-on-surface)' }}>Total Amount</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: 'var(--color-on-surface)' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: 'var(--color-on-surface)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-primary)' }}>
                    <i className="fa-solid fa-circle-notch fa-spin fa-2x"></i>
                  </td>
                </tr>
              ) : currentEntries.length > 0 ? currentEntries.map((v) => {
                const dateObj = new Date(v.voucherDate);
                const formattedDate = !isNaN(dateObj.getTime()) ? 
                  `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}` : '-';
                return (
                  <tr key={v.purchaseVoucherHeaderId} style={{ borderBottom: '1px solid var(--color-border-structural)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--color-on-surface-variant)', fontWeight: '500' }}>{v.voucherNo || '-'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-on-surface)' }}>{formattedDate}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-on-surface-variant)', fontWeight: '600' }}>₹ {parseFloat(v.totalAmount || 0).toFixed(2)}</td>
                    <td style={{ padding: '12px 16px' }}>{renderStatus(v.voucherStatus)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link to={`/Purchase/edit/${v.purchaseVoucherHeaderId}`} style={{ backgroundColor: '#f1f5f9', color: '#0ea5e9', border: '1px solid #e2e8f0', borderRadius: '4px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none' }}>
                          <i className="fa-solid fa-pencil" style={{ fontSize: '12px' }}></i>
                        </Link>
                        <button onClick={() => handleDelete(v.purchaseVoucherHeaderId)} style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '4px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <i className="fa-solid fa-trash-can" style={{ fontSize: '12px' }}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="5" style={{ padding: '16px', textAlign: 'center', color: 'var(--color-outline)' }}>No purchase vouchers found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <div style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>
            Showing {filteredVouchers.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, filteredVouchers.length)} of {filteredVouchers.length} entries
          </div>

          {totalPages > 0 && (
           <div style={{ display: 'flex', gap: '4px' }}>
              <button disabled={currentPage === 1} onClick={() => handlePageChange(1)} style={{ padding: '6px 12px', backgroundColor: '#fff', border: '1px solid var(--color-border-structural)', borderRadius: '4px', color: currentPage === 1 ? 'var(--color-outline)' : 'var(--color-on-surface-variant)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>&laquo;</button>
              <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} style={{ padding: '6px 12px', backgroundColor: '#fff', border: '1px solid var(--color-border-structural)', borderRadius: '4px', color: currentPage === 1 ? 'var(--color-outline)' : 'var(--color-on-surface-variant)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>&#8249;</button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: currentPage === page ? 'var(--color-primary)' : '#fff',
                    border: `1px solid ${currentPage === page ? 'var(--color-primary)' : 'var(--color-border-structural)'}`,
                    borderRadius: '4px',
                    color: currentPage === page ? '#fff' : 'var(--color-on-surface-variant)',
                    cursor: 'pointer'
                  }}>
                  {page}
                </button>
              ))}

              <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} style={{ padding: '6px 12px', backgroundColor: '#fff', border: '1px solid var(--color-border-structural)', borderRadius: '4px', color: currentPage === totalPages ? 'var(--color-outline)' : 'var(--color-on-surface-variant)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>&#8250;</button>
              <button disabled={currentPage === totalPages} onClick={() => handlePageChange(totalPages)} style={{ padding: '6px 12px', backgroundColor: '#fff', border: '1px solid var(--color-border-structural)', borderRadius: '4px', color: currentPage === totalPages ? 'var(--color-outline)' : 'var(--color-on-surface-variant)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>&raquo;</button>
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default PurchaseVoucherList;
