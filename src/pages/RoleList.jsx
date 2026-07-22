import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getRoles, deleteRole } from '../services/api';
import EnterpriseDataGrid from '../components/EnterpriseDataGrid';

const COLUMNS = [
  { key: 'roleName', label: 'ROLE NAME', align: 'left', sortable: true, filterable: true, filterType: 'text', width: '250px' },
  { key: 'roleDescription', label: 'DESCRIPTION', align: 'left', sortable: true, filterable: true, filterType: 'text', width: '350px' },
  { key: 'isSystemRole', label: 'SYSTEM ROLE', align: 'center', sortable: true, filterable: true, filterType: 'select', options: ['All', 'Yes', 'No'], width: '150px' },
  { key: 'action', label: 'ACTION', align: 'center', sortable: false, filterable: false, width: '100px' },
];

const RoleList = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await getRoles();
      if (response.success && response.data) {
        setRoles(response.data);
      } else {
        toast.error(response.message || 'Failed to load roles');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDelete = (id) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>Delete this role?</span>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={() => toast.dismiss(t.id)} style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Cancel</button>
          <button onClick={async () => {
            toast.dismiss(t.id);
            try {
              const res = await deleteRole(id);
              if (res.success) {
                toast.success('Role deleted');
                fetchRoles();
              } else {
                toast.error(res.message || 'Failed to delete');
              }
            } catch {
              toast.error('Error deleting role');
            }
          }} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Delete</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const customRenderers = {
    isSystemRole: (val) => (
      <span style={{
        padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700',
        backgroundColor: val ? '#d1fae5' : '#f1f5f9',
        color: val ? '#065f46' : '#64748b'
      }}>
        {val ? 'YES' : 'NO'}
      </span>
    )
  };

  return (
    <div className="list-page-container">
      <EnterpriseDataGrid
        title="Role Master"
        icon="fa-user-shield"
        columns={COLUMNS}
        data={roles}
        loading={loading}
        createLink="/role/create"
        createLabel="Add Role"
        editLinkPrefix="/role/edit"
        onDelete={handleDelete}
        idKey="roleMasterId"
        customRenderers={customRenderers}
        onRefresh={fetchRoles}
      />
    </div>
  );
};

export default RoleList;
