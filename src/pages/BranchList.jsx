import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getBranches, deleteBranch } from '../services/api';
import EnterpriseDataGrid from '../components/EnterpriseDataGrid';

const COLUMNS = [
  { key: 'branchName', label: 'BRANCH NAME', align: 'left', sortable: true, filterable: true, filterType: 'text', width: '220px' },
  { key: 'branchCode', label: 'BRANCH CODE', align: 'left', sortable: true, filterable: true, filterType: 'text', width: '150px' },
  { key: 'city', label: 'CITY', align: 'left', sortable: true, filterable: true, filterType: 'text', width: '160px' },
  { key: 'state', label: 'STATE', align: 'left', sortable: true, filterable: true, filterType: 'text', width: '160px' },
  { key: 'action', label: 'ACTION', align: 'center', sortable: false, filterable: false, width: '100px' },
];

const BranchList = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await getBranches();
      if (response.success && response.data) {
        setBranches(response.data);
      } else {
        toast.error(response.message || 'Failed to load branches');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleDelete = (id) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>Delete this branch?</span>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={() => toast.dismiss(t.id)} style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Cancel</button>
          <button onClick={async () => {
            toast.dismiss(t.id);
            try {
              const res = await deleteBranch(id);
              if (res.success) {
                toast.success('Branch deleted');
                fetchBranches();
              } else {
                toast.error(res.message || 'Failed to delete');
              }
            } catch {
              toast.error('Error deleting branch');
            }
          }} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Delete</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  return (
    <div className="list-page-container">
      <EnterpriseDataGrid
        title="Branch Master"
        icon="fa-code-branch"
        columns={COLUMNS}
        data={branches}
        loading={loading}
        createLink="/branch/create"
        createLabel="Add Branch"
        editLinkPrefix="/branch/edit"
        onDelete={handleDelete}
        idKey="branchId"
        onRefresh={fetchBranches}
      />
    </div>
  );
};

export default BranchList;
