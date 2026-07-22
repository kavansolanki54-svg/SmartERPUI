import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getEmployees, deleteEmployee } from '../services/api';
import EnterpriseDataGrid from '../components/EnterpriseDataGrid';

const COLUMNS = [
  { key: 'firstName', label: 'FIRST NAME', align: 'left', sortable: true, filterable: true, filterType: 'text', width: '160px' },
  { key: 'lastName', label: 'LAST NAME', align: 'left', sortable: true, filterable: true, filterType: 'text', width: '160px' },
  { key: 'email', label: 'EMAIL', align: 'left', sortable: true, filterable: true, filterType: 'text', width: '220px' },
  { key: 'mobileNo', label: 'MOBILE NO.', align: 'left', sortable: true, filterable: true, filterType: 'text', width: '150px' },
  { key: 'designation', label: 'DESIGNATION', align: 'left', sortable: true, filterable: true, filterType: 'text', width: '180px' },
  { key: 'action', label: 'ACTION', align: 'center', sortable: false, filterable: false, width: '100px' },
];

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await getEmployees();
      if (response.success && response.data) {
        setEmployees(response.data);
      } else {
        toast.error(response.message || 'Failed to load employees');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = (id) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>Delete this employee?</span>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={() => toast.dismiss(t.id)} style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Cancel</button>
          <button onClick={async () => {
            toast.dismiss(t.id);
            try {
              const res = await deleteEmployee(id);
              if (res.success) {
                toast.success('Employee deleted');
                fetchEmployees();
              } else {
                toast.error(res.message || 'Failed to delete');
              }
            } catch {
              toast.error('Error deleting employee');
            }
          }} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Delete</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  return (
    <div className="list-page-container">
      <EnterpriseDataGrid
        title="Employee Master"
        icon="fa-users"
        columns={COLUMNS}
        data={employees}
        loading={loading}
        createLink="/employee/create"
        createLabel="Add Employee"
        editLinkPrefix="/employee/edit"
        onDelete={handleDelete}
        idKey="employeeId"
        onRefresh={fetchEmployees}
      />
    </div>
  );
};

export default EmployeeList;
