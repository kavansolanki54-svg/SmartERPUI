import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getGroups, deleteGroup } from '../services/api';
import EnterpriseDataGrid from '../components/EnterpriseDataGrid';

const COLUMNS = [
  { key: 'groupName', label: 'GROUP NAME', align: 'left', sortable: true, filterable: true, filterType: 'text', width: '250px' },
  { key: 'parentGroupName', label: 'PARENT GROUP', align: 'left', sortable: true, filterable: true, filterType: 'text', width: '250px' },
  { key: 'nature', label: 'NATURE', align: 'center', sortable: true, filterable: true, filterType: 'text', width: '180px' },
  { key: 'action', label: 'ACTION', align: 'center', sortable: false, filterable: false, width: '100px' },
];

const GroupList = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await getGroups();
      if (response.success && response.data) {
        setGroups(response.data);
      } else {
        toast.error(response.message || 'Failed to load groups');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleDelete = (id) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>Delete this group?</span>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={() => toast.dismiss(t.id)} style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Cancel</button>
          <button onClick={async () => {
            toast.dismiss(t.id);
            try {
              const res = await deleteGroup(id);
              if (res.success) {
                toast.success('Group deleted');
                fetchGroups();
              } else {
                toast.error(res.message || 'Failed to delete');
              }
            } catch {
              toast.error('Error deleting group');
            }
          }} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Delete</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  return (
    <div className="list-page-container">
      <EnterpriseDataGrid
        title="Group Master"
        icon="fa-object-group"
        columns={COLUMNS}
        data={groups}
        loading={loading}
        createLink="/group/create"
        createLabel="Add Group"
        editLinkPrefix="/group/edit"
        onDelete={handleDelete}
        idKey="groupId"
        onRefresh={fetchGroups}
      />
    </div>
  );
};

export default GroupList;
