export const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7290';

const request = async (endpoint, method, body = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers: {
      ...headers,
    },
  };

  if (body) {
    if (body instanceof FormData) {
      options.body = body;
      delete options.headers['Content-Type'];
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(`${API_URL}/api/${endpoint}`, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};

export const login = async (email, password) => {
  return await request('Auth/Login', 'POST', { email, password });
};

export const signup = async (companyName, fullName, email, password, confirmPassword) => {
  return await request('Auth/SignUp', 'POST', { companyName, fullName, email, password, confirmPassword });
};

export const getMenus = async (roleId, isTenant) => {
  return await request(`Menu/${roleId}/${isTenant}`, 'GET');
};

export const getCompany = async (id) => {
  return await request(`CompanyMaster/${id}`, 'GET');
};

export const updateCompany = async (id, formData) => {
  // Since it's a [FromForm] request, we need to pass a FormData object directly,
  // bypassing the default JSON stringification in the request function.
  // Wait, our `request` function in api.js currently stringifies the body to JSON.
  // We should either modify `request` to handle FormData or fetch directly here.
  // Let's modify the api.js `request` to check if body is FormData.
  return await request(`CompanyMaster/${id}`, 'PUT', formData);
};

export const getMasterRoles = async () => {
  return await request('MasterData/GetRoles', 'GET');
};

export const getLookups = async (typeId) => {
  return await request(`MasterData/GetLookups/${typeId}`, 'GET');
};

export const getCountries = async () => {
  return await request('MasterData/GetCountries', 'GET');
};

export const getStates = async (countryId) => {
  return await request(`MasterData/GetStates/${countryId}`, 'GET');
};

export const getBranches = async () => {
  return await request('BranchMaster/Get', 'GET');
};

export const getBranchById = async (id) => {
  return await request(`BranchMaster/GetById/${id}`, 'GET');
};

export const saveBranch = async (data) => {
  return await request('BranchMaster', 'POST', data);
};

export const deleteBranch = async (id) => {
  return await request(`BranchMaster/Delete/${id}`, 'DELETE');
};

export const getRoles = async (companyId) => {
  // Using 1 as a fallback companyId if not provided
  return await request(`RoleMaster/List/${companyId || 1}`, 'GET');
};

export const getRoleById = async (id) => {
  return await request(`RoleMaster/GetById/${id}`, 'GET');
};

export const saveRole = async (data) => {
  return await request('RoleMaster', 'POST', data);
};

export const deleteRole = async (id) => {
  return await request(`RoleMaster/Delete/${id}`, 'DELETE');
};


export const getRoleMastersDropdown = async (typeId = 1) => {
  return await request(`MasterData/GetRoleMasters`, 'GET');
};

export const getAccessControlHierarchy = async (roleId) => {
  return await request(`RoleMasterSoftwareModules/GetHierarchy/${roleId}`, 'GET');
};

export const saveRolePermissions = async (data) => {
  return await request('RoleMasterSoftwareModules/Post', 'POST', data);
};

// Mobile App Menu endpoints
export const getMobileAppMenusByCompany = async () => {
  return await request('MobileAppMenu/GetByCompany', 'GET');
};

export const saveMobileAppMenus = async (data) => {
  return await request('MobileAppMenu/Save', 'POST', data);
};

export const getMobileAppActiveModules = async () => {
  return await request('MobileAppMenu/GetActiveModules', 'GET');
};

// Employee Master API endpoints
export const getEmployees = async () => {
  return await request('EmployeeMaster/Get', 'GET');
};

export const getEmployeeById = async (id) => {
  return await request(`EmployeeMaster/GetById/${id}`, 'GET');
};

export const saveEmployee = async (data) => {
  return await request('EmployeeMaster', 'POST', data);
};

export const deleteEmployee = async (id) => {
  return await request(`EmployeeMaster/Delete/${id}`, 'DELETE');
};

export const getMasterGenders = async () => {
  return await request('MasterData/GetGender', 'GET');
};

export const getMasterBranches = async () => {
  return await request('MasterData/GetBranchs', 'GET');
};

export const getMasterGroups = async () => {
  return await request('MasterData/GetGroups', 'GET');
};

// Group Master API endpoints
export const getGroups = async () => {
  return await request('GroupMaster/Get', 'GET');
};

export const getGroupById = async (id) => {
  return await request(`GroupMaster/GetById/${id}`, 'GET');
};

export const saveGroup = async (data) => {
  return await request('GroupMaster', 'POST', data);
};

export const deleteGroup = async (id) => {
  return await request(`GroupMaster/Delete/${id}`, 'DELETE');
};

// Ledger Master API endpoints
export const getLedgers = async () => {
  return await request('LedgerMaster/Get', 'GET');
};

export const getLedgerById = async (id) => {
  return await request(`LedgerMaster/GetById/${id}`, 'GET');
};

export const getLedgerCurrentBalance = async (id) => {
  return await request(`LedgerMaster/GetCurrentBalance/${id}`, 'GET');
};

export const saveLedger = async (data) => {
  return await request('LedgerMaster', 'POST', data);
};

export const deleteLedger = async (id) => {
  return await request(`LedgerMaster/Delete/${id}`, 'DELETE');
};

// Voucher Configuration API endpoints
export const getVoucherConfigurations = async () => {
  return await request('VoucherConfiguration/Get', 'GET');
};

export const getVoucherConfigurationById = async (id) => {
  return await request(`VoucherConfiguration/GetById/${id}`, 'GET');
};

export const saveVoucherConfiguration = async (data) => {
  return await request('VoucherConfiguration', 'POST', data);
};

export const deleteVoucherConfiguration = async (id) => {
  return await request(`VoucherConfiguration/Delete/${id}`, 'DELETE');
};

export const saveVoucherConfigurationsBatch = async (data) => {
  return await request('VoucherConfiguration/BatchSave', 'POST', data);
};

export const getNextVoucherNumber = async (configId) => {
  return await request(`VoucherConfiguration/GetNextVoucherNumber/${configId}`, 'GET');
};

// Dashboard API endpoints
export const getDashboardStats = async (filter = '30days', startDate = null, endDate = null) => {
  let url = `Dashboard/GetStats?filter=${filter}`;
  if (startDate) url += `&startDate=${startDate}`;
  if (endDate) url += `&endDate=${endDate}`;
  return await request(url, 'GET');
};

// Tally Configuration API endpoints
export const getTallyConfigurations = async () => {
  return await request('TallyConfiguration/Get', 'GET');
};

export const getTallyConfigurationById = async (id) => {
  return await request(`TallyConfiguration/GetById/${id}`, 'GET');
};

export const saveTallyConfiguration = async (data) => {
  return await request('TallyConfiguration', 'POST', data);
};

export const deleteTallyConfiguration = async (id) => {
  return await request(`TallyConfiguration/Delete/${id}`, 'DELETE');
};

export const testTallyConnection = async (data) => {
  return await request('TallyConfiguration/TestConnection', 'POST', data);
};

// Sales Voucher API endpoints
export const getSalesVouchers = async () => {
  return await request('SalesVoucher/Get', 'GET');
};

export const getSalesVoucherById = async (id) => {
  return await request(`SalesVoucher/GetById/${id}`, 'GET');
};

export const saveSalesVoucher = async (data) => {
  return await request('SalesVoucher', 'POST', data);
};

export const deleteSalesVoucher = async (id) => {
  return await request(`SalesVoucher/Delete/${id}`, 'DELETE');
};

// ============ Purchase Voucher ============
export const getPurchaseVouchers = async () => {
  return await request('PurchaseVoucher/Get', 'GET');
};

export const getPurchaseVoucherById = async (id) => {
  return await request(`PurchaseVoucher/GetById/${id}`, 'GET');
};

export const savePurchaseVoucher = async (data) => {
  return await request('PurchaseVoucher', 'POST', data);
};

export const deletePurchaseVoucher = async (id) => {
  return await request(`PurchaseVoucher/Delete/${id}`, 'DELETE');
};

// ============ Receipt Voucher ============
export const getReceiptVouchers = async () => {
  return await request('ReceiptVoucher/Get', 'GET');
};

export const getReceiptVoucherById = async (id) => {
  return await request(`ReceiptVoucher/GetById/${id}`, 'GET');
};

export const saveReceiptVoucher = async (data) => {
  return await request('ReceiptVoucher', 'POST', data);
};

export const deleteReceiptVoucher = async (id) => {
  return await request(`ReceiptVoucher/Delete/${id}`, 'DELETE');
};

// ============ Payment Voucher ============
export const getPaymentVouchers = async () => {
  return await request('PaymentVoucher/Get', 'GET');
};

export const getPaymentVoucherById = async (id) => {
  return await request(`PaymentVoucher/GetById/${id}`, 'GET');
};

export const savePaymentVoucher = async (data) => {
  return await request('PaymentVoucher', 'POST', data);
};

export const deletePaymentVoucher = async (id) => {
  return await request(`PaymentVoucher/Delete/${id}`, 'DELETE');
};

// ============ Contra Voucher ============
export const getContraVouchers = async () => {
  return await request('ContraVoucher/Get', 'GET');
};

export const getContraVoucherById = async (id) => {
  return await request(`ContraVoucher/GetById/${id}`, 'GET');
};

export const saveContraVoucher = async (data) => {
  return await request('ContraVoucher', 'POST', data);
};

export const deleteContraVoucher = async (id) => {
  return await request(`ContraVoucher/Delete/${id}`, 'DELETE');
};

// ============ Journal Voucher ============
export const getJournalVouchers = async () => {
  return await request('JournalVoucher/Get', 'GET');
};

export const getJournalVoucherById = async (id) => {
  return await request(`JournalVoucher/GetById/${id}`, 'GET');
};

export const saveJournalVoucher = async (data) => {
  return await request('JournalVoucher', 'POST', data);
};

export const deleteJournalVoucher = async (id) => {
  return await request(`JournalVoucher/Delete/${id}`, 'DELETE');
};

// ============ Tally Sync ============
export const getTallySyncStats = async () => {
  return await request('TallySync/Stats', 'GET');
};

export const syncTallyMasters = async () => {
  return await request('TallySync/SyncMasters', 'POST');
};

export const syncTallyVouchers = async () => {
  return await request('TallySync/SyncVouchers', 'POST');
};

export const getTallySyncLogs = async (syncType = '', status = '') => {
  let query = '';
  const params = [];
  if (syncType) params.push(`syncType=${encodeURIComponent(syncType)}`);
  if (status !== undefined && status !== '') params.push(`status=${encodeURIComponent(status)}`);
  if (params.length > 0) {
    query = `?${params.join('&')}`;
  }
  return await request(`TallySync/Logs${query}`, 'GET');
};


