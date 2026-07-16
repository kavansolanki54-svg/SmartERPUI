import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Select from 'react-select';
import {
  getEmployeeById,
  saveEmployee,
  getMasterGenders,
  getRoleMastersDropdown,
  getMasterBranches
} from '../services/api';

const EmployeeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    employeeId: 0,
    companyId: 1,
    defaultBreakDuration: 30,
    roleMasterId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    designation: '',
    email: '',
    passwords: '',
    mobileNo: '',
    employeePhotoFile: '',
    isAllowLogin: false,
    employeeCode: '',
    birthDate: '',
    dateOfJoining: '',
    genderId: '',
    address: '',
    signInAttempt: 0,
    activeStatus: 1,
    branchIds: []
  });

  const [loading, setLoading] = useState(false);
  const [genders, setGenders] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);

  // Fetch dropdown lists and load employee data if edit mode
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch genders
        const genderRes = await getMasterGenders();
        if (genderRes.success && genderRes.data) {
          setGenders(genderRes.data.map(g => ({
            value: Number(g.value),
            label: g.text
          })));
        }

        // Fetch roles
        const roleRes = await getRoleMastersDropdown();
        if (roleRes.success && roleRes.data) {
          setRoles(roleRes.data.map(r => ({
            value: Number(r.value),
            label: r.text
          })));
        }

        // Fetch branches
        const branchRes = await getMasterBranches();
        let branchOptions = [];
        if (branchRes.success && branchRes.data) {
          branchOptions = branchRes.data.map(b => ({
            value: Number(b.branchId),
            label: b.branchName
          }));
          setBranches(branchOptions);
        }

        // Load employee details if in edit mode
        if (id) {
          const empRes = await getEmployeeById(id);
          if (empRes.success && empRes.data) {
            const data = empRes.data;

            // Map branchIds from existing structures
            let mappedBranchIds = [];
            if (Array.isArray(data.branchIds)) {
              mappedBranchIds = data.branchIds.map(Number);
            } else if (Array.isArray(data.employeeBranches)) {
              mappedBranchIds = data.employeeBranches
                .filter(b => b.activeStatus === true || b.activeStatus === 1)
                .map(b => Number(b.branchId));
            }

            setFormData({
              employeeId: data.employeeId || parseInt(id),
              companyId: data.companyId || 1,
              defaultBreakDuration: data.defaultBreakDuration ?? 30,
              roleMasterId: data.roleMasterId || '',
              firstName: data.firstName || '',
              middleName: data.middleName || '',
              lastName: data.lastName || '',
              designation: data.designation || '',
              email: data.email || '',
              passwords: data.passwords || '',
              mobileNo: data.mobileNo || '',
              employeePhotoFile: data.employeePhotoFile || '',
              isAllowLogin: data.isAllowLogin || false,
              employeeCode: data.employeeCode || '',
              birthDate: data.birthDate || '',
              dateOfJoining: data.dateOfJoining || '',
              genderId: data.genderId || '',
              address: data.address || '',
              signInAttempt: data.signInAttempt || 0,
              activeStatus: data.activeStatus ?? 1,
              branchIds: mappedBranchIds
            });
          } else {
            toast.error(empRes.message || "Failed to load employee details");
          }
        }
      } catch (err) {
        console.error("Failed to load initial form data", err);
        toast.error("Error loading form dependencies");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleBranchChange = (selectedOptions) => {
    const selectedIds = selectedOptions ? selectedOptions.map(o => o.value) : [];
    setFormData({
      ...formData,
      branchIds: selectedIds
    });
    if (errors.branchIds) {
      setErrors({ ...errors, branchIds: null });
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.firstName) newErrors.firstName = "First name is required.";
    if (!formData.roleMasterId) newErrors.roleMasterId = "Role is required.";
    if (!formData.email) {
      newErrors.email = "Email address is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address.";
      }
    }

    // Password is required only in create mode
    if (!id && !formData.passwords) {
      newErrors.passwords = "Password is required.";
    } else if (formData.passwords && formData.passwords.length < 6) {
      newErrors.passwords = "Password must be at least 6 characters long.";
    }

    if (!formData.branchIds || formData.branchIds.length === 0) {
      newErrors.branchIds = "At least one branch must be selected.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    setLoading(true);
    try {
      // Prepare payload - convert fields to correct types
      const payload = {
        ...formData,
        employeeCode: formData.employeeCode ? parseInt(formData.employeeCode) : null,
        roleMasterId: parseInt(formData.roleMasterId),
        genderId: formData.genderId ? parseInt(formData.genderId) : null,
        defaultBreakDuration: parseInt(formData.defaultBreakDuration),
        birthDate: formData.birthDate || null,
        dateOfJoining: formData.dateOfJoining || null
      };

      const res = await saveEmployee(payload);
      if (res.success) {
        toast.success(id ? "Employee updated successfully!" : "Employee created successfully!");
        navigate('/employee');
      } else {
        toast.error(res.message || "Failed to save employee");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--color-on-surface-variant)',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '4px',
    border: '1px solid var(--color-border-structural)',
    outline: 'none',
    fontSize: '13px',
    color: 'var(--color-on-surface)',
    backgroundColor: '#fff',
    transition: 'border-color 0.2s',
    height: '38px'
  };

  const getInputStyle = (fieldName) => ({
    ...inputStyle,
    borderColor: errors[fieldName] ? 'var(--color-error)' : 'var(--color-border-structural)'
  });

  const getSelectStyle = (fieldName) => ({
    ...inputStyle,
    borderColor: errors[fieldName] ? 'var(--color-error)' : 'var(--color-border-structural)',
    appearance: 'auto'
  });

  const sectionHeaderStyle = {
    backgroundColor: '#f1f5f9',
    padding: '12px 16px',
    borderRadius: '6px 6px 0 0',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-on-surface-variant)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const sectionBodyStyle = {
    padding: '24px',
    backgroundColor: '#fff',
    border: '1px solid var(--color-border-structural)',
    borderTop: 'none',
    borderRadius: '0 0 6px 6px'
  };

  const getSingleSelectStyles = (hasError) => ({
    control: (provided, state) => ({
      ...provided,
      borderColor: hasError
        ? 'var(--color-error)'
        : state.isFocused
          ? 'var(--color-primary)'
          : 'var(--color-border-structural)',
      boxShadow: state.isFocused ? '0 0 0 1px var(--color-primary)' : 'none',
      '&:hover': {
        borderColor: 'var(--color-primary)',
      },
      fontSize: '13px',
      height: '38px',
      borderRadius: '4px',
      backgroundColor: '#fff',
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 8px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '36px',
    }),
  });

  // react-select custom styles to match the input fields
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: errors.branchIds
        ? 'var(--color-error)'
        : state.isFocused
          ? 'var(--color-primary)'
          : 'var(--color-border-structural)',
      boxShadow: state.isFocused ? '0 0 0 1px var(--color-primary)' : 'none',
      '&:hover': {
        borderColor: 'var(--color-primary)',
      },
      fontSize: '13px',
      minHeight: '38px',
      borderRadius: '4px',
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '2px 8px',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: 'var(--color-surface-container-low)',
      borderRadius: '4px',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'var(--color-primary)',
      fontWeight: '500',
      fontSize: '12px',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'var(--color-outline)',
      '&:hover': {
        backgroundColor: 'var(--color-error-container)',
        color: 'var(--color-error)',
      },
    }),
  };

  // Map current values to options format for react-select
  const currentSelectedBranches = branches.filter(option =>
    formData.branchIds.includes(option.value)
  );

  const selectedGenderOption = genders.find(g => g.value === Number(formData.genderId)) || null;
  const selectedRoleOption = roles.find(r => r.value === Number(formData.roleMasterId)) || null;

  if (loading && id) {
    return (
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100%', padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <i className="fa-solid fa-circle-notch fa-spin fa-3x" style={{ color: 'var(--color-primary)' }}></i>
      </div>
    );
  }

  return (
    <>
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          {id && (
            <span style={{ backgroundColor: '#e0e7ff', color: 'var(--color-primary)', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Edit Mode</span>
          )}
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* GENERAL INFORMATION */}
          <div>
            <div style={sectionHeaderStyle}>General Information</div>
            <div style={sectionBodyStyle}>

              {/* Row 1: EMPLOYEE CODE | FIRST NAME * | MIDDLE NAME | LAST NAME */}
              <div className="form-grid-4" style={{ marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Employee Code</label>
                  <input
                    type="number"
                    name="employeeCode"
                    value={formData.employeeCode}
                    onChange={handleChange}
                    style={getInputStyle('employeeCode')}
                    placeholder="Enter Employee Code"
                  />
                  {errors.employeeCode && <span style={{ color: 'var(--color-error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.employeeCode}</span>}
                </div>
                <div>
                  <label style={labelStyle}>First Name <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    style={getInputStyle('firstName')}
                    placeholder="Enter First Name"
                  />
                  {errors.firstName && <span style={{ color: 'var(--color-error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.firstName}</span>}
                </div>
                <div>
                  <label style={labelStyle}>Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Enter Middle Name"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Enter Last Name"
                  />
                </div>
              </div>

              {/* Row 2: GENDER | ROLE NAME * | EMAIL ADDRESS * | PASSWORD */}
              <div className="form-grid-4" style={{ marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Gender</label>
                  <Select
                    name="genderId"
                    value={selectedGenderOption}
                    onChange={(option) => setFormData({ ...formData, genderId: option ? option.value : '' })}
                    options={genders}
                    styles={getSingleSelectStyles(false)}
                    placeholder="Choose..."
                    isClearable
                  />
                </div>
                <div>
                  <label style={labelStyle}>Role Name <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <Select
                    name="roleMasterId"
                    value={selectedRoleOption}
                    onChange={(option) => {
                      setFormData({ ...formData, roleMasterId: option ? option.value : '' });
                      if (errors.roleMasterId) setErrors({ ...errors, roleMasterId: null });
                    }}
                    options={roles}
                    styles={getSingleSelectStyles(!!errors.roleMasterId)}
                    placeholder="Choose..."
                    isClearable
                  />
                  {errors.roleMasterId && <span style={{ color: 'var(--color-error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.roleMasterId}</span>}
                </div>
                <div>
                  <label style={labelStyle}>Email Address <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={getInputStyle('email')}
                    placeholder="name@smarterp.com"
                  />
                  {errors.email && <span style={{ color: 'var(--color-error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.email}</span>}
                </div>
                <div>
                  <label style={labelStyle}>Password {id ? '(Optional)' : <span style={{ color: 'var(--color-error)' }}>*</span>}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="passwords"
                      value={formData.passwords}
                      onChange={handleChange}
                      style={getInputStyle('passwords')}
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-outline)'
                      }}
                    >
                      <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  {errors.passwords && <span style={{ color: 'var(--color-error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.passwords}</span>}
                </div>
              </div>

              {/* Row 3: BRANCH NAME * (Multiselect full-width dropdown) */}
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Branch Name <span style={{ color: 'var(--color-error)' }}>*</span></label>
                <Select
                  isMulti
                  name="branchIds"
                  options={branches}
                  value={currentSelectedBranches}
                  onChange={handleBranchChange}
                  styles={customSelectStyles}
                  placeholder="Choose..."
                />
                {errors.branchIds && <span style={{ color: 'var(--color-error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.branchIds}</span>}
              </div>

              {/* Row 4: ALLOW LOGIN * (Pill Toggle Switch) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '42px',
                  height: '22px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    name="isAllowLogin"
                    checked={formData.isAllowLogin}
                    onChange={handleChange}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: formData.isAllowLogin ? 'var(--color-primary)' : '#cbd5e1',
                    transition: '0.3s',
                    borderRadius: '34px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '16px',
                      width: '16px',
                      left: formData.isAllowLogin ? '22px' : '4px',
                      bottom: '3px',
                      backgroundColor: 'white',
                      transition: '0.3s',
                      borderRadius: '50%'
                    }} />
                  </span>
                </label>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-on-surface)' }}>
                  ALLOW LOGIN <span style={{ color: 'var(--color-error)' }}>*</span>
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="form-actions-row" style={{ paddingBottom: '32px' }}>
          <Link
            to="/employee"
            style={{
              backgroundColor: '#fff',
              color: 'var(--color-on-surface-variant)',
              padding: '10px 24px',
              borderRadius: '4px',
              border: '1px solid var(--color-border-structural)',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              textDecoration: 'none'
            }}
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              padding: '10px 24px',
              borderRadius: '4px',
              border: 'none',
              fontWeight: '600',
              fontSize: '13px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
            Save Employee
          </button>
        </div>

      </div>
    </>
  );
};

export default EmployeeForm;
