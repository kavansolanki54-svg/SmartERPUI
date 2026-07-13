import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { getMenus } from '../services/api';

const Layout = ({ children }) => {
  const [menus, setMenus] = useState([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const roleId = user.roleId !== undefined ? user.roleId : 1;
          const isTenant = user.isTenant !== undefined ? user.isTenant : true;
          
          const response = await getMenus(roleId, isTenant);
          if (response.success && response.data) {
            setMenus(response.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch menus:", error);
      }
    };
    
    fetchMenus();
  }, []);



  return (
    <div className="layout-app" style={{ backgroundColor: '#f5f7fb' }}>
      <Sidebar menus={menus} />
      <div className="layout-main-wrapper">
        <Header />
        <main className="layout-content" style={{ padding: '32px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
