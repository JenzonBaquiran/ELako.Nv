import React, { useState, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import { useNotification } from "../components/NotificationProvider";
import "../css/AdminUserManagement-standalone.css";

const AdminUserManagement = () => {
  const { showConfirm, showSuccess, showError } = useNotification();
  const [sidebarState, setSidebarState] = useState({
    isOpen: true,
    isMobile: false,
    isCollapsed: false
  });
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeStatFilter, setActiveStatFilter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showAddMsmeModal, setShowAddMsmeModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddUserDropdown, setShowAddUserDropdown] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    username: '',
    password: '',
    firstname: '',
    lastname: '',
    email: ''
  });
  const [msmeFormData, setMsmeFormData] = useState({
    username: '',
    password: '',
    businessName: '',
    email: '',
    category: '',
    address: '',
    contactNumber: '',
    clientProfilingNumber: ''
  });
  const [editUserFormData, setEditUserFormData] = useState({
    username: '',
    firstname: '',
    lastname: '',
    email: '',
    businessName: '',
    category: '',
    address: '',
    contactNumber: '',
    clientProfilingNumber: ''
  });
  const [adminFormLoading, setAdminFormLoading] = useState(false);
  const [msmeFormLoading, setMsmeFormLoading] = useState(false);
  const [editUserFormLoading, setEditUserFormLoading] = useState(false);
  const [certificates, setCertificates] = useState(null);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [showCertificateViewer, setShowCertificateViewer] = useState(false);
  const [currentCertificate, setCurrentCertificate] = useState({ title: '', url: '' });

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await fetch("http://localhost:1337/api/admin/admins");
      
      if (!response.ok) {
        throw new Error("Failed to fetch admins");
      }
      
      const data = await response.json();
      
      // Format admins data
      const formattedAdmins = data.admins.map(admin => ({
        id: admin._id,
        name: `${admin.firstname} ${admin.lastname}`,
        email: admin.email,
        type: "Admin",
        status: admin.status,
        joinDate: new Date(admin.createdAt).toLocaleDateString(),
        activity: new Date(admin.updatedAt).toLocaleDateString(),
        username: admin.username,
        role: admin.role
      }));
      
      setAdmins(formattedAdmins);
    } catch (err) {
      console.error("Error fetching admins:", err);
      showError("Failed to load admins. Please try again.");
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:1337/api/admin/users");
      
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      
      const data = await response.json();
      
      // Combine customers and MSMEs into a single array with proper formatting
      const allUsers = [
        ...data.customers.map(customer => ({
          id: customer.id,
          name: `${customer.firstname} ${customer.lastname}`,
          email: customer.email,
          type: "Customer",
          status: "active", // You can add status field to customer model if needed
          joinDate: new Date(customer.createdAt).toLocaleDateString(),
          activity: new Date(customer.updatedAt).toLocaleDateString(),
          username: customer.username,
          firstname: customer.firstname,
          lastname: customer.lastname,
          contactNumber: customer.contactNumber,
          address: customer.address
        })),
        ...data.msmes.map(msme => ({
          id: msme.id,
          name: msme.businessName,
          email: msme.email || `${msme.username}@msme.com`, // Use actual email if available
          type: "MSME",
          status: msme.status,
          joinDate: new Date(msme.createdAt).toLocaleDateString(),
          activity: new Date(msme.updatedAt).toLocaleDateString(),
          username: msme.username,
          category: msme.category,
          clientProfilingNumber: msme.clientProfilingNumber,
          contactNumber: msme.contactNumber || '', // Include contact number
          address: msme.address || '' // Include address for consistency
        }))
      ];
      
      setUsers(allUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
      showError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on active tab, search term, status, and stat filter
  const filteredUsers = users.filter(user => {
    const matchesTab = activeTab === "all" || 
                      (activeTab === "customers" && user.type === "Customer") ||
                      (activeTab === "msmes" && user.type === "MSME");
    
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    
    // Apply stat filter
    let matchesStatFilter = true;
    if (activeStatFilter) {
      switch (activeStatFilter) {
        case 'customers':
          matchesStatFilter = user.type === "Customer";
          break;
        case 'msmes':
          matchesStatFilter = user.type === "MSME";
          break;
        case 'active':
          matchesStatFilter = user.status === "active" || user.status === "approved";
          break;
        case 'pending':
          matchesStatFilter = user.status === "pending";
          break;
        case 'suspended':
          matchesStatFilter = user.status === "suspended" || user.status === "rejected";
          break;
        default:
          matchesStatFilter = true;
      }
    }
    
    return matchesTab && matchesSearch && matchesStatus && matchesStatFilter;
  }).sort((a, b) => {
    // Sort by newest first (assuming joinDate is in MM/DD/YYYY format or createdAt exists)
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(a.joinDate);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(b.joinDate);
    return dateB - dateA; // Newest first
  });

  // Filter admins based on search term, status, and stat filter
  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || admin.status === statusFilter;
    
    // Apply stat filter for admins
    let matchesStatFilter = true;
    if (activeStatFilter) {
      switch (activeStatFilter) {
        case 'admins':
          matchesStatFilter = true; // Already filtering admins
          break;
        case 'active':
          matchesStatFilter = admin.status === "active";
          break;
        case 'suspended':
          matchesStatFilter = admin.status === "suspended";
          break;
        default:
          matchesStatFilter = activeStatFilter === 'total' || activeStatFilter === 'admins';
      }
    }
    
    return matchesSearch && matchesStatus && matchesStatFilter;
  }).sort((a, b) => {
    // Sort by newest first (assuming joinDate is in MM/DD/YYYY format or createdAt exists)
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(a.joinDate);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(b.joinDate);
    return dateB - dateA; // Newest first
  });

  // Get current display data based on active tab and stat filter
  const getCurrentDisplayData = () => {
    // If stat filter is active, override tab selection for certain filters
    if (activeStatFilter) {
      switch (activeStatFilter) {
        case 'customers':
          return filteredUsers.filter(user => user.type === "Customer");
        case 'msmes':
          return filteredUsers.filter(user => user.type === "MSME");
        case 'admins':
          return filteredAdmins;
        case 'total':
          // Combine and sort all users by newest first
          const combined = [...filteredUsers, ...filteredAdmins];
          return combined.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(a.joinDate);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(b.joinDate);
            return dateB - dateA; // Newest first
          });
        case 'active':
        case 'pending':
        case 'suspended':
          return activeTab === "admins" ? filteredAdmins : filteredUsers;
        default:
          break;
      }
    }
    
    // Default behavior based on active tab
    if (activeTab === "admins") {
      return filteredAdmins;
    }
    return filteredUsers;
  };

  const currentDisplayData = getCurrentDisplayData();

  // Handle stat box clicks
  const handleStatBoxClick = (statType) => {
    // Special case for 'active' - show all users instead of filtering
    if (statType === 'active') {
      setActiveStatFilter(null);
      setActiveTab('all');
      setSearchTerm('');
      setStatusFilter('all');
      return;
    }

    // Toggle the stat filter - if same is clicked, clear it
    if (activeStatFilter === statType) {
      setActiveStatFilter(null);
      // Reset to show all users by default
      if (statType === 'admins') {
        setActiveTab('all');
      }
    } else {
      setActiveStatFilter(statType);
      
      // Set appropriate tab based on stat type
      switch (statType) {
        case 'customers':
          setActiveTab('customers');
          break;
        case 'msmes':
          setActiveTab('msmes');
          break;
        case 'admins':
          setActiveTab('admins');
          break;
        case 'total':
          setActiveTab('all');
          break;
        default:
          // For status-based filters (pending, suspended), keep current tab
          break;
      }
    }
    
    // Clear search and status filters when stat filter is applied
    if (activeStatFilter !== statType) {
      setSearchTerm('');
      setStatusFilter('all');
    }
  };

  // Calculate statistics
  const stats = {
    total: users.length + admins.length,
    customers: users.filter(user => user.type === "Customer").length,
    msmes: users.filter(user => user.type === "MSME").length,
    admins: admins.length,
    active: users.filter(user => user.status === "active" || user.status === "approved").length + 
            admins.filter(admin => admin.status === "active").length,
    pending: users.filter(user => user.status === "pending").length,
    suspended: users.filter(user => user.status === "suspended" || user.status === "rejected").length +
               admins.filter(admin => admin.status === "suspended").length
  };

  const handleDeleteUser = async (userId, userType) => {
    const confirmed = await showConfirm(
      `Are you sure you want to delete this ${userType.toLowerCase()}?`,
      `Delete ${userType}`
    );
    
    if (confirmed) {
      try {
        let endpoint;
        if (userType === "Customer") {
          endpoint = `http://localhost:1337/api/admin/customers/${userId}`;
        } else if (userType === "MSME") {
          endpoint = `http://localhost:1337/api/admin/msme/${userId}`;
        } else if (userType === "Admin") {
          endpoint = `http://localhost:1337/api/admin/admins/${userId}`;
        }
        
        const response = await fetch(endpoint, { method: "DELETE" });
        
        if (response.ok) {
          showSuccess(`${userType} deleted successfully`);
          if (userType === "Admin") {
            fetchAdmins();
          } else {
            fetchUsers();
          }
        } else {
          throw new Error(`Failed to delete ${userType.toLowerCase()}`);
        }
      } catch (err) {
        console.error(`Error deleting ${userType.toLowerCase()}:`, err);
        showError(`Failed to delete ${userType.toLowerCase()}. Please try again.`);
      }
    }
  };

  const handleStatusUpdate = async (userId, newStatus, userType = "MSME") => {
    try {
      let endpoint;
      if (userType === "Admin") {
        endpoint = `http://localhost:1337/api/admin/admins/${userId}/status`;
      } else {
        endpoint = `http://localhost:1337/api/msme/${userId}/status`;
      }
      
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        showSuccess(`Status updated to ${newStatus}`, "Status Updated");
        if (userType === "Admin") {
          fetchAdmins();
        } else {
          fetchUsers();
        }
        setActiveDropdown(null);
      } else {
        throw new Error("Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      showError("Failed to update status. Please try again.");
    }
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setShowModal(true);
    setActiveDropdown(null);
    
    // Fetch certificates if user is MSME
    if (user.type === 'MSME') {
      setLoadingCertificates(true);
      try {
        const response = await fetch(`http://localhost:1337/api/msme/${user.id}/certificates`);
        const data = await response.json();
        
        if (data.success) {
          setCertificates(data.certificates);
        } else {
          console.error('Error fetching certificates:', data.error);
          setCertificates(null);
        }
      } catch (error) {
        console.error('Error fetching certificates:', error);
        setCertificates(null);
      } finally {
        setLoadingCertificates(false);
      }
    } else {
      setCertificates(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setCertificates(null);
  };

  // Helper function to get the correct certificate URL
  const getCertificateUrl = (certificatePath) => {
    if (!certificatePath) return null;
    
    // If it's already a full URL (Cloudinary), use it as-is
    if (certificatePath.startsWith('http://') || certificatePath.startsWith('https://')) {
      return certificatePath;
    }
    
    // If it's a legacy local path, construct the local URL
    if (certificatePath.includes('certificates/')) {
      return `http://localhost:1337/uploads/${certificatePath}`;
    }
    
    // If it's just a filename, construct the local URL
    return `http://localhost:1337/uploads/certificates/${certificatePath}`;
  };

  const handleViewCertificate = (title, url) => {
    console.log('Viewing certificate:', title, 'URL:', url);
    setCurrentCertificate({ title, url });
    setShowCertificateViewer(true);
  };

  const handleCloseCertificateViewer = () => {
    setShowCertificateViewer(false);
    setCurrentCertificate({ title: '', url: '' });
  };

  const handleAddMsme = async (e) => {
    e.preventDefault();
    setMsmeFormLoading(true);

    try {
      const response = await fetch("http://localhost:1337/api/admin/msme/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msmeFormData)
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("MSME created successfully!", "Success");
        setShowAddMsmeModal(false);
        setMsmeFormData({
          username: '',
          password: '',
          businessName: '',
          category: '',
          address: '',
          contactNumber: '',
          clientProfilingNumber: ''
        });
        // Refresh users list
        fetchUsers();
      } else {
        showError(data.error || "Failed to create MSME", "Error");
      }
    } catch (err) {
      console.error("Error creating MSME:", err);
      showError("Failed to create MSME. Please try again.", "Error");
    } finally {
      setMsmeFormLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAdminFormLoading(true);

    try {
      // Get current admin info from localStorage
      const currentAdmin = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await fetch("http://localhost:1337/api/admin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...adminFormData,
          createdBy: currentAdmin.id || 'admin'
        })
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("Admin created successfully!", "Success");
        setShowAddAdminModal(false);
        setAdminFormData({
          username: '',
          password: '',
          firstname: '',
          lastname: '',
          email: ''
        });
        // Refresh admins list
        fetchAdmins();
      } else {
        showError(data.error || "Failed to create admin", "Error");
      }
    } catch (err) {
      console.error("Error creating admin:", err);
      showError("Failed to create admin. Please try again.", "Error");
    } finally {
      setAdminFormLoading(false);
    }
  };

  const handleAdminFormChange = (e) => {
    const { name, value } = e.target;
    setAdminFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCloseAddAdminModal = () => {
    setShowAddAdminModal(false);
    setAdminFormData({
      username: '',
      password: '',
      firstname: '',
      lastname: '',
      email: ''
    });
  };

  const handleMsmeFormChange = (e) => {
    const { name, value } = e.target;
    setMsmeFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    // Populate form data based on user type
    if (user.type === 'Admin') {
      setEditUserFormData({
        username: user.username,
        firstname: user.name.split(' ')[0] || '',
        lastname: user.name.split(' ').slice(1).join(' ') || '',
        email: user.email,
        businessName: '',
        category: '',
        address: '',
        contactNumber: '',
        clientProfilingNumber: ''
      });
    } else if (user.type === 'MSME') {
      setEditUserFormData({
        username: user.username,
        firstname: '',
        lastname: '',
        email: user.email,
        businessName: user.name,
        category: user.category || '',
        address: '', // No longer using address for MSME
        contactNumber: user.contactNumber || '',
        clientProfilingNumber: user.clientProfilingNumber || ''
      });
    } else if (user.type === 'Customer') {
      setEditUserFormData({
        username: user.username,
        firstname: user.name.split(' ')[0] || '',
        lastname: user.name.split(' ').slice(1).join(' ') || '',
        email: user.email,
        businessName: '',
        category: '',
        address: user.address || '',
        contactNumber: user.contactNumber || '',
        clientProfilingNumber: ''
      });
    }
    setShowEditUserModal(true);
    setActiveDropdown(null);
  };

  const handleEditUserFormChange = (e) => {
    const { name, value } = e.target;
    setEditUserFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    setEditUserFormLoading(true);

    try {
      let endpoint;
      let requestBody = {};

      if (editingUser.type === 'Admin') {
        endpoint = `http://localhost:1337/api/admin/admins/${editingUser.id}`;
        requestBody = {
          username: editUserFormData.username,
          firstname: editUserFormData.firstname,
          lastname: editUserFormData.lastname,
          email: editUserFormData.email
        };
      } else if (editingUser.type === 'MSME') {
        // Validate email if provided
        if (editUserFormData.email && editUserFormData.email.trim() === "") {
          throw new Error("Email cannot be empty. Please provide a valid email or leave it blank.");
        }
        
        endpoint = `http://localhost:1337/api/admin/msme/${editingUser.id}/update`;
        requestBody = {
          username: editUserFormData.username,
          businessName: editUserFormData.businessName,
          category: editUserFormData.category,
          contactNumber: editUserFormData.contactNumber,
          clientProfilingNumber: editUserFormData.clientProfilingNumber,
          email: editUserFormData.email
        };
      } else if (editingUser.type === 'Customer') {
        endpoint = `http://localhost:1337/api/admin/customers/${editingUser.id}/update`;
        requestBody = {
          username: editUserFormData.username,
          firstname: editUserFormData.firstname,
          lastname: editUserFormData.lastname,
          email: editUserFormData.email,
          address: editUserFormData.address,
          contactNumber: editUserFormData.contactNumber
        };
      }

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Server returned non-JSON response (${response.status}). The edit endpoint may not exist on the server.`);
      }

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccess(`${editingUser.type} updated successfully!`, "Success");
        setShowEditUserModal(false);
        setEditingUser(null);
        
        // Refresh appropriate data
        if (editingUser.type === "Admin") {
          fetchAdmins();
        } else {
          fetchUsers();
        }
      } else {
        throw new Error(data.error || `Failed to update ${editingUser.type.toLowerCase()}`);
      }
    } catch (err) {
      console.error(`Error updating ${editingUser.type.toLowerCase()}:`, err);
      
      // Show more specific error message
      if (err.message.includes("404")) {
        showError(`Edit functionality is not yet implemented on the server for ${editingUser.type.toLowerCase()}s. Please contact the developer.`, "Feature Not Available");
      } else if (err.message.includes("non-JSON response")) {
        showError(`Server error: ${err.message}`, "Server Error");
      } else {
        showError(`Failed to update ${editingUser.type.toLowerCase()}. ${err.message}`, "Error");
      }
    } finally {
      setEditUserFormLoading(false);
    }
  };

  const handleCloseEditUserModal = () => {
    setShowEditUserModal(false);
    setEditingUser(null);
    setEditUserFormData({
      username: '',
      firstname: '',
      lastname: '',
      email: '',
      businessName: '',
      category: '',
      address: '',
      contactNumber: '',
      clientProfilingNumber: ''
    });
  };

  const handleCloseAddMsmeModal = () => {
    setShowAddMsmeModal(false);
    setMsmeFormData({
      username: '',
      password: '',
      businessName: '',
      email: '',
      category: '',
      address: '',
      contactNumber: '',
      clientProfilingNumber: ''
    });
  };

  const toggleDropdown = (userId) => {
    setActiveDropdown(activeDropdown === userId ? null : userId);
    
    // Smart positioning to prevent dropdown from being cut off
    if (activeDropdown !== userId) {
      setTimeout(() => {
        const dropdownElement = document.querySelector(`[data-dropdown-id="${userId}"]`);
        if (dropdownElement) {
          const rect = dropdownElement.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const spaceBelow = windowHeight - rect.bottom;
          const spaceAbove = rect.top;
          
          if (spaceBelow < 120 && spaceAbove > spaceBelow) {
            dropdownElement.classList.add('user-management__dropdown--up');
          } else {
            dropdownElement.classList.remove('user-management__dropdown--up');
          }
        }
      }, 10);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
      setShowAddUserDropdown(false);
    };
    
    if (activeDropdown || showAddUserDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown, showAddUserDropdown]);

  const handleSidebarToggle = (state) => {
    setSidebarState(state);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setActiveTab('all');
    setActiveStatFilter(null);
  };

  const getContentClass = () => {
    if (sidebarState.isMobile) {
      return 'user-management__content user-management__content--mobile';
    }
    return sidebarState.isOpen 
      ? 'user-management__content user-management__content--sidebar-open' 
      : 'user-management__content user-management__content--sidebar-collapsed';
  };

  return (
    <div className="user-management">
      <AdminSidebar onSidebarToggle={handleSidebarToggle} />
      <div className={getContentClass()}>
        <div className="user-management__header">
          <div className="user-management__header-content">
            <div className="user-management__header-text">
              <h1>User Management</h1>
              <p>Manage customers and MSME businesses on the platform.</p>
            </div>
            <div className="user-management__add-user-dropdown">
              <button 
                className="user-management__add-user-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddUserDropdown(!showAddUserDropdown);
                }}
              >
                + Add New User
                <span className="user-management__dropdown-arrow">▼</span>
              </button>
              <div className={`user-management__add-user-menu ${showAddUserDropdown ? 'show' : ''}`}>
                <button 
                  className="user-management__add-user-option"
                  onClick={() => {
                    setShowAddAdminModal(true);
                    setShowAddUserDropdown(false);
                  }}
                >
                  Add Admin
                </button>
                <button 
                  className="user-management__add-user-option"
                  onClick={() => {
                    setShowAddMsmeModal(true);
                    setShowAddUserDropdown(false);
                  }}
                >
                  Add MSME
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="user-management__error">
            {error}
          </div>
        )}

        <div className="user-management__stats">
          <div 
            className={`user-management__stat-box ${activeStatFilter === 'total' ? 'user-management__stat-box--active' : ''}`}
            onClick={() => handleStatBoxClick('total')}
          >
            <span className="user-management__stat-value">{stats.total}</span>
            <span className="user-management__stat-label">Total Users</span>
          </div>
          <div 
            className={`user-management__stat-box ${activeStatFilter === 'customers' ? 'user-management__stat-box--active' : ''}`}
            onClick={() => handleStatBoxClick('customers')}
          >
            <span className="user-management__stat-value">{stats.customers}</span>
            <span className="user-management__stat-label">Customers</span>
          </div>
          <div 
            className={`user-management__stat-box ${activeStatFilter === 'msmes' ? 'user-management__stat-box--active' : ''}`}
            onClick={() => handleStatBoxClick('msmes')}
          >
            <span className="user-management__stat-value">{stats.msmes}</span>
            <span className="user-management__stat-label">MSMEs</span>
          </div>
          <div 
            className={`user-management__stat-box ${activeStatFilter === 'admins' ? 'user-management__stat-box--active' : ''}`}
            onClick={() => handleStatBoxClick('admins')}
          >
            <span className="user-management__stat-value">{stats.admins}</span>
            <span className="user-management__stat-label">Admins</span>
          </div>
          <div 
            className="user-management__stat-box"
            onClick={() => handleStatBoxClick('active')}
          >
            <span className="user-management__stat-value">{stats.active}</span>
            <span className="user-management__stat-label">Active</span>
          </div>
          <div 
            className={`user-management__stat-box ${activeStatFilter === 'pending' ? 'user-management__stat-box--active' : ''}`}
            onClick={() => handleStatBoxClick('pending')}
          >
            <span className="user-management__stat-value">{stats.pending}</span>
            <span className="user-management__stat-label">Pending</span>
          </div>
          <div 
            className={`user-management__stat-box ${activeStatFilter === 'suspended' ? 'user-management__stat-box--active' : ''}`}
            onClick={() => handleStatBoxClick('suspended')}
          >
            <span className="user-management__stat-value">{stats.suspended}</span>
            <span className="user-management__stat-label">Suspended</span>
          </div>
        </div>

        <div className="user-management__filters">
          <div className="user-management__filters-row">
            <input 
              type="text" 
              placeholder="Search users..." 
              className="user-management__search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="user-management__filter-dropdown"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
            <button 
              className="user-management__refresh-btn"
              onClick={fetchUsers}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
            <button 
              className="user-management__clear-filters-btn"
              onClick={clearFilters}
              disabled={loading}
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="user-management__tabs">
          <button 
            className={`user-management__tab-button ${activeTab === "all" ? "user-management__tab-button--active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Users ({stats.total - stats.admins})
          </button>
          <button 
            className={`user-management__tab-button ${activeTab === "customers" ? "user-management__tab-button--active" : ""}`}
            onClick={() => setActiveTab("customers")}
          >
            Customers ({stats.customers})
          </button>
          <button 
            className={`user-management__tab-button ${activeTab === "msmes" ? "user-management__tab-button--active" : ""}`}
            onClick={() => setActiveTab("msmes")}
          >
            MSMEs ({stats.msmes})
          </button>
          <button 
            className={`user-management__tab-button ${activeTab === "admins" ? "user-management__tab-button--active" : ""}`}
            onClick={() => setActiveTab("admins")}
          >
            Admins ({stats.admins})
          </button>
        </div>

        <div className="user-management__table-section">
          {loading ? (
            <div className="user-management__loading">Loading users...</div>
          ) : (
            <div className="user-management__table-wrapper">
              <table className="user-management__table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Join Date</th>
                  <th>Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentDisplayData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="user-management__no-data">
                      No {activeTab === "admins" ? "admins" : "users"} found
                    </td>
                  </tr>
                ) : (
                  currentDisplayData.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-management__user-cell">
                          <div className="user-management__avatar">
                            {user.name[0].toUpperCase()}
                          </div>
                          <div className="user-management__user-info">
                            <div className="user-management__user-name">{user.name}</div>
                            <div className="user-management__user-email">{user.email}</div>
                            <div className="user-management__user-username">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="user-management__type-badge">
                          {user.type}
                          {user.type === "MSME" && user.category && (
                            <small> ({user.category})</small>
                          )}
                          {user.type === "Admin" && user.role && (
                            <small> ({user.role})</small>
                          )}
                        </span>
                      </td>
                      <td>
                        <span className={`user-management__status-badge user-management__status-badge--${user.status}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>{user.joinDate}</td>
                      <td>{user.activity}</td>
                      <td>
                        <div className="user-management__actions">
                          <button 
                            className="user-management__more-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(user.id);
                            }}
                          >
                            ⋯
                          </button>
                          <div 
                            className={`user-management__dropdown ${activeDropdown === user.id ? 'show' : ''}`}
                            data-dropdown-id={user.id}
                          >
                            <button 
                              className="user-management__dropdown-item"
                              onClick={() => handleViewUser(user)}
                            >
                              View
                            </button>
                            <button 
                              className="user-management__dropdown-item"
                              onClick={() => handleEditUser(user)}
                            >
                              Edit
                            </button>
                            {user.type === "MSME" && user.status === "pending" && (
                              <>
                                <button 
                                  className="user-management__dropdown-item approve"
                                  onClick={() => handleStatusUpdate(user.id, "approved", "MSME")}
                                >
                                  Approve
                                </button>
                                <button 
                                  className="user-management__dropdown-item reject"
                                  onClick={() => handleStatusUpdate(user.id, "rejected", "MSME")}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {user.type === "Admin" && user.status === "active" && (
                              <button 
                                className="user-management__dropdown-item reject"
                                onClick={() => handleStatusUpdate(user.id, "suspended", "Admin")}
                              >
                                Suspend
                              </button>
                            )}
                            {user.type === "Admin" && user.status === "suspended" && (
                              <button 
                                className="user-management__dropdown-item approve"
                                onClick={() => handleStatusUpdate(user.id, "active", "Admin")}
                              >
                                Activate
                              </button>
                            )}
                            <button 
                              className="user-management__dropdown-item delete"
                              onClick={() => handleDeleteUser(user.id, user.type)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add MSME Modal */}
      <div className={`user-management__modal-overlay ${showAddMsmeModal ? 'show' : ''}`} onClick={handleCloseAddMsmeModal}>
        <div className="user-management__modal user-management__modal--add-msme" onClick={(e) => e.stopPropagation()}>
          <div className="user-management__modal-header">
            <h3 className="user-management__modal-title">Add New MSME</h3>
            <button className="user-management__modal-close" onClick={handleCloseAddMsmeModal}>
              ×
            </button>
          </div>
          
          <form onSubmit={handleAddMsme} className="user-management__msme-form">
            <div className="user-management__form-field">
              <label className="user-management__form-label">Business Name *</label>
              <input
                type="text"
                name="businessName"
                value={msmeFormData.businessName}
                onChange={handleMsmeFormChange}
                className="user-management__form-input"
                required
              />
            </div>

            <div className="user-management__form-field">
              <label className="user-management__form-label">Email *</label>
              <input
                type="email"
                name="email"
                value={msmeFormData.email}
                onChange={handleMsmeFormChange}
                className="user-management__form-input"
                required
              />
            </div>

            <div className="user-management__form-row">
              <div className="user-management__form-field">
                <label className="user-management__form-label">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={msmeFormData.username}
                  onChange={handleMsmeFormChange}
                  className="user-management__form-input"
                  required
                />
              </div>
              <div className="user-management__form-field">
                <label className="user-management__form-label">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={msmeFormData.password}
                  onChange={handleMsmeFormChange}
                  className="user-management__form-input"
                  required
                  minLength="6"
                />
              </div>
            </div>

            <div className="user-management__form-row">
              <div className="user-management__form-field">
                <label className="user-management__form-label">Category *</label>
                <select
                  name="category"
                  value={msmeFormData.category}
                  onChange={handleMsmeFormChange}
                  className="user-management__form-input"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="food">Food</option>
                  <option value="artisan">Artisan</option>
                </select>
              </div>
              <div className="user-management__form-field">
                <label className="user-management__form-label">Contact Number</label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={msmeFormData.contactNumber}
                  onChange={handleMsmeFormChange}
                  className="user-management__form-input"
                />
              </div>
            </div>

            <div className="user-management__form-field">
              <label className="user-management__form-label">Address</label>
              <textarea
                name="address"
                value={msmeFormData.address}
                onChange={handleMsmeFormChange}
                className="user-management__form-input"
                rows="3"
              />
            </div>

            <div className="user-management__form-field">
              <label className="user-management__form-label">Client Profiling Number</label>
              <input
                type="text"
                name="clientProfilingNumber"
                value={msmeFormData.clientProfilingNumber}
                onChange={handleMsmeFormChange}
                className="user-management__form-input"
              />
            </div>

            <div className="user-management__form-actions">
              <button
                type="button"
                className="user-management__form-btn user-management__form-btn--cancel"
                onClick={handleCloseAddMsmeModal}
                disabled={msmeFormLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="user-management__form-btn user-management__form-btn--submit"
                disabled={msmeFormLoading}
              >
                {msmeFormLoading ? "Creating..." : "Create MSME"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add Admin Modal */}
      <div className={`user-management__modal-overlay ${showAddAdminModal ? 'show' : ''}`} onClick={handleCloseAddAdminModal}>
        <div className="user-management__modal user-management__modal--add-admin" onClick={(e) => e.stopPropagation()}>
          <div className="user-management__modal-header">
            <h3 className="user-management__modal-title">Add New Admin</h3>
            <button className="user-management__modal-close" onClick={handleCloseAddAdminModal}>
              ×
            </button>
          </div>
          
          <form onSubmit={handleAddAdmin} className="user-management__admin-form">
            <div className="user-management__form-row">
              <div className="user-management__form-field">
                <label className="user-management__form-label">First Name *</label>
                <input
                  type="text"
                  name="firstname"
                  value={adminFormData.firstname}
                  onChange={handleAdminFormChange}
                  className="user-management__form-input"
                  required
                />
              </div>
              <div className="user-management__form-field">
                <label className="user-management__form-label">Last Name *</label>
                <input
                  type="text"
                  name="lastname"
                  value={adminFormData.lastname}
                  onChange={handleAdminFormChange}
                  className="user-management__form-input"
                  required
                />
              </div>
            </div>

            <div className="user-management__form-field">
              <label className="user-management__form-label">Username *</label>
              <input
                type="text"
                name="username"
                value={adminFormData.username}
                onChange={handleAdminFormChange}
                className="user-management__form-input"
                required
              />
            </div>

            <div className="user-management__form-field">
              <label className="user-management__form-label">Email *</label>
              <input
                type="email"
                name="email"
                value={adminFormData.email}
                onChange={handleAdminFormChange}
                className="user-management__form-input"
                required
              />
            </div>

            <div className="user-management__form-field">
              <label className="user-management__form-label">Password *</label>
              <input
                type="password"
                name="password"
                value={adminFormData.password}
                onChange={handleAdminFormChange}
                className="user-management__form-input"
                required
                minLength="6"
              />
            </div>

            <div className="user-management__form-actions">
              <button
                type="button"
                className="user-management__form-btn user-management__form-btn--cancel"
                onClick={handleCloseAddAdminModal}
                disabled={adminFormLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="user-management__form-btn user-management__form-btn--submit"
                disabled={adminFormLoading}
              >
                {adminFormLoading ? "Creating..." : "Create Admin"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Edit User Modal */}
      <div className={`user-management__modal-overlay ${showEditUserModal ? 'show' : ''}`} onClick={handleCloseEditUserModal}>
        <div className="user-management__modal user-management__modal--edit-user" onClick={(e) => e.stopPropagation()}>
          <div className="user-management__modal-header">
            <h3 className="user-management__modal-title">Edit {editingUser?.type}</h3>
            <button className="user-management__modal-close" onClick={handleCloseEditUserModal}>
              ×
            </button>
          </div>
          
          {editingUser && (
            <form onSubmit={handleEditUserSubmit} className="user-management__edit-form">
              {/* Common Fields */}
              <div className="user-management__form-field">
                <label className="user-management__form-label">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={editUserFormData.username}
                  onChange={handleEditUserFormChange}
                  className="user-management__form-input"
                  required
                />
              </div>

              {/* Admin and Customer Fields */}
              {(editingUser.type === 'Admin' || editingUser.type === 'Customer') && (
                <>
                  <div className="user-management__form-row">
                    <div className="user-management__form-field">
                      <label className="user-management__form-label">First Name *</label>
                      <input
                        type="text"
                        name="firstname"
                        value={editUserFormData.firstname}
                        onChange={handleEditUserFormChange}
                        className="user-management__form-input"
                        required
                      />
                    </div>
                    <div className="user-management__form-field">
                      <label className="user-management__form-label">Last Name *</label>
                      <input
                        type="text"
                        name="lastname"
                        value={editUserFormData.lastname}
                        onChange={handleEditUserFormChange}
                        className="user-management__form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="user-management__form-field">
                    <label className="user-management__form-label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={editUserFormData.email}
                      onChange={handleEditUserFormChange}
                      className="user-management__form-input"
                      required
                    />
                  </div>
                </>
              )}

              {/* MSME Fields */}
              {editingUser.type === 'MSME' && (
                <>
                  <div className="user-management__form-field">
                    <label className="user-management__form-label">Business Name *</label>
                    <input
                      type="text"
                      name="businessName"
                      value={editUserFormData.businessName}
                      onChange={handleEditUserFormChange}
                      className="user-management__form-input"
                      required
                    />
                  </div>

                  <div className="user-management__form-field">
                    <label className="user-management__form-label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={editUserFormData.email}
                      onChange={handleEditUserFormChange}
                      className="user-management__form-input"
                      required
                    />
                  </div>

                  <div className="user-management__form-field">
                    <label className="user-management__form-label">Category *</label>
                    <select
                      name="category"
                      value={editUserFormData.category}
                      onChange={handleEditUserFormChange}
                      className="user-management__form-input"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="food">Food</option>
                      <option value="artisan">Artisan</option>
                    </select>
                  </div>

                  <div className="user-management__form-field">
                    <label className="user-management__form-label">Client Profiling Number</label>
                    <input
                      type="text"
                      name="clientProfilingNumber"
                      value={editUserFormData.clientProfilingNumber}
                      onChange={handleEditUserFormChange}
                      className="user-management__form-input"
                    />
                  </div>
                </>
              )}

              {/* Common Fields for Customer and MSME */}
              {(editingUser.type === 'Customer' || editingUser.type === 'MSME') && (
                <>
                  <div className="user-management__form-field">
                    <label className="user-management__form-label">Contact Number</label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={editUserFormData.contactNumber}
                      onChange={handleEditUserFormChange}
                      className="user-management__form-input"
                    />
                  </div>

                  {/* Address field removed for MSME, kept only for Customer */}
                  {editingUser.type === 'Customer' && (
                    <div className="user-management__form-field">
                      <label className="user-management__form-label">Address</label>
                      <textarea
                        name="address"
                        value={editUserFormData.address}
                        onChange={handleEditUserFormChange}
                        className="user-management__form-input"
                        rows="3"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="user-management__form-actions">
                <button
                  type="button"
                  className="user-management__form-btn user-management__form-btn--cancel"
                  onClick={handleCloseEditUserModal}
                  disabled={editUserFormLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="user-management__form-btn user-management__form-btn--submit"
                  disabled={editUserFormLoading}
                >
                  {editUserFormLoading ? "Updating..." : "Update User"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      <div className={`user-management__modal-overlay ${showModal ? 'show' : ''}`} onClick={handleCloseModal}>
        <div className="user-management__modal" onClick={(e) => e.stopPropagation()}>
          <div className="user-management__modal-header">
            <h3 className="user-management__modal-title">User Details</h3>
            <button className="user-management__modal-close" onClick={handleCloseModal}>
              ×
            </button>
          </div>
          {selectedUser && (
            <div className="user-management__modal-content">
              <div className="user-management__modal-avatar">
                {selectedUser.name[0].toUpperCase()}
              </div>
              <div className="user-management__modal-field">
                <div className="user-management__modal-label">Last Activity</div>
                <div className="user-management__modal-value">{selectedUser.activity || 'Not provided'}</div>
              </div>

              <div className="user-management__modal-field">
                <div className="user-management__modal-label">User Type</div>
                <div className="user-management__modal-value">
                  {selectedUser.type}
                  {selectedUser.type === "MSME" && selectedUser.category && ` (${selectedUser.category})`}
                </div>
              </div>

              <div className="user-management__modal-field">
                <div className="user-management__modal-label">Status</div>
                <div className="user-management__modal-value">{selectedUser.status}</div>
              </div>

              <div className="user-management__modal-field">
                <div className="user-management__modal-label">Join Date</div>
                <div className="user-management__modal-value">{selectedUser.joinDate}</div>
              </div>

              {/* Customer-specific fields */}
              {selectedUser.type === "Customer" && (
                <>
                  <div className="user-management__modal-field">
                    <div className="user-management__modal-label">Username</div>
                    <div className="user-management__modal-value">{selectedUser.username || 'Not provided'}</div>
                  </div>

                  <div className="user-management__modal-field">
                    <div className="user-management__modal-label">Full Name</div>
                    <div className="user-management__modal-value">
                      {selectedUser.firstname && selectedUser.lastname 
                        ? `${selectedUser.firstname} ${selectedUser.lastname}` 
                        : selectedUser.name || 'Not provided'
                      }
                    </div>
                  </div>

                  <div className="user-management__modal-field">
                    <div className="user-management__modal-label">Email</div>
                    <div className="user-management__modal-value">{selectedUser.email || 'Not provided'}</div>
                  </div>
                </>
              )}

              {/* Admin-specific fields */}
              {selectedUser.type === "Admin" && (
                <>
                  <div className="user-management__modal-field">
                    <div className="user-management__modal-label">Username</div>
                    <div className="user-management__modal-value">{selectedUser.username || 'Not provided'}</div>
                  </div>

                  <div className="user-management__modal-field">
                    <div className="user-management__modal-label">Full Name</div>
                    <div className="user-management__modal-value">{selectedUser.name || 'Not provided'}</div>
                  </div>

                  <div className="user-management__modal-field">
                    <div className="user-management__modal-label">Email</div>
                    <div className="user-management__modal-value">{selectedUser.email || 'Not provided'}</div>
                  </div>

                  {selectedUser.role && (
                    <div className="user-management__modal-field">
                      <div className="user-management__modal-label">Role</div>
                      <div className="user-management__modal-value">{selectedUser.role}</div>
                    </div>
                  )}
                </>
              )}

              {selectedUser.contactNumber && (
                <div className="user-management__modal-field">
                  <div className="user-management__modal-label">Contact Number</div>
                  <div className="user-management__modal-value">{selectedUser.contactNumber}</div>
                </div>
              )}

              {selectedUser.address && (
                <div className="user-management__modal-field">
                  <div className="user-management__modal-label">Address</div>
                  <div className="user-management__modal-value">{selectedUser.address}</div>
                </div>
              )}

             

              {/* Business Certificates for MSME */}
              {selectedUser.type === 'MSME' && (
                <div className="user-management__certificates-section">
                  <div className="user-management__modal-label" style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                    Business Certificates
                  </div>
                  
                  {loadingCertificates ? (
                    <div className="user-management__loading">Loading certificates...</div>
                  ) : certificates ? (
                    <div className="user-management__certificates-grid">
                      <div className="user-management__certificate-item">
                        <h4>Mayor's Permit</h4>
                        {certificates.mayorsPermit ? (
                          <button 
                            className="user-management__view-certificate-btn"
                            onClick={() => handleViewCertificate('Mayor\'s Permit', getCertificateUrl(certificates.mayorsPermit))}
                          >
                            View Document
                          </button>
                        ) : (
                          <p className="user-management__no-document">Not uploaded</p>
                        )}
                      </div>
                      
                      <div className="user-management__certificate-item">
                        <h4>BIR Certificate</h4>
                        {certificates.bir ? (
                          <button 
                            className="user-management__view-certificate-btn"
                            onClick={() => handleViewCertificate('BIR Certificate', getCertificateUrl(certificates.bir))}
                          >
                            View Document
                          </button>
                        ) : (
                          <p className="user-management__no-document">Not uploaded</p>
                        )}
                      </div>
                      
                      <div className="user-management__certificate-item">
                        <h4>DTI Certificate</h4>
                        {certificates.dti ? (
                          <button 
                            className="user-management__view-certificate-btn"
                            onClick={() => handleViewCertificate('DTI Certificate', getCertificateUrl(certificates.dti))}
                          >
                            View Document
                          </button>
                        ) : (
                          <p className="user-management__no-document">Not uploaded</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="user-management__no-certificates">
                      No certificate information available
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="user-management__modal-actions">
                {selectedUser.type === "MSME" && selectedUser.status === "pending" && (
                  <>
                    <button 
                      className="user-management__modal-action-btn user-management__modal-action-btn--approve"
                      onClick={() => {
                        handleStatusUpdate(selectedUser.id, "approved", "MSME");
                        handleCloseModal();
                      }}
                    >
                      APPROVE
                    </button>
                    <button 
                      className="user-management__modal-action-btn user-management__modal-action-btn--reject"
                      onClick={() => {
                        handleStatusUpdate(selectedUser.id, "rejected", "MSME");
                        handleCloseModal();
                      }}
                    >
                      REJECT
                    </button>
                  </>
                )}
                
                {selectedUser.type === "Admin" && selectedUser.status === "active" && (
                  <button 
                    className="user-management__modal-action-btn user-management__modal-action-btn--reject"
                    onClick={() => {
                      handleStatusUpdate(selectedUser.id, "suspended", "Admin");
                      handleCloseModal();
                    }}
                  >
                    SUSPEND
                  </button>
                )}
                
                {selectedUser.type === "Admin" && selectedUser.status === "suspended" && (
                  <button 
                    className="user-management__modal-action-btn user-management__modal-action-btn--approve"
                    onClick={() => {
                      handleStatusUpdate(selectedUser.id, "active", "Admin");
                      handleCloseModal();
                    }}
                  >
                    ACTIVATE
                  </button>
                )}
                
                <button 
                  className="user-management__modal-action-btn user-management__modal-action-btn--delete"
                  onClick={() => {
                    handleDeleteUser(selectedUser.id, selectedUser.type);
                    handleCloseModal();
                  }}
                >
                  DELETE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Certificate Viewer Modal */}
      {showCertificateViewer && (
        <div className="user-management__certificate-viewer-overlay" onClick={handleCloseCertificateViewer}>
          <div className="user-management__certificate-viewer-content" onClick={(e) => e.stopPropagation()}>
            <div className="user-management__certificate-viewer-header">
              <h3>{currentCertificate.title}</h3>
              <button 
                className="user-management__certificate-viewer-close" 
                onClick={handleCloseCertificateViewer}
              >
                ×
              </button>
            </div>
            <div className="user-management__certificate-viewer-body">
              <img 
                src={currentCertificate.url} 
                alt={currentCertificate.title}
                className="user-management__certificate-viewer-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="user-management__certificate-viewer-fallback" style={{display: 'none'}}>
                <div className="user-management__document-icon-large">📄</div>
                <p>This document cannot be previewed as an image</p>
                <a 
                  href={currentCertificate.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="user-management__download-btn"
                >
                  Download Document
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default AdminUserManagement;
