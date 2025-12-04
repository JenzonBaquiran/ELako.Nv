import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import '../css/AdminMsmeOversight.css';
import PeopleIcon from '@mui/icons-material/People';
import VerifiedIcon from '@mui/icons-material/Verified';
import InventoryIcon from '@mui/icons-material/Inventory';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const AdminMsmeOversight = () => {
  const [sidebarState, setSidebarState] = useState({
    isOpen: true,
    isMobile: false,
    isCollapsed: false
  });
  const [msmeData, setMsmeData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [selectedMsme, setSelectedMsme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [certificates, setCertificates] = useState(null);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [showCertificateViewer, setShowCertificateViewer] = useState(false);
  const [currentCertificate, setCurrentCertificate] = useState({ title: '', url: '' });
  const [badgeData, setBadgeData] = useState([]);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [visibilityReason, setVisibilityReason] = useState('');
  const [pendingToggleMsmeId, setPendingToggleMsmeId] = useState(null);


  // Fetch MSMEs from API
  const fetchMsmes = async () => {
    try {
      const response = await fetch('http://localhost:1337/api/admin/users');
      const data = await response.json();
      
      if (data.msmes) {
        // Transform MSME data to match component structure
        const transformedMsmes = data.msmes.map(msme => ({
          id: msme.id,
          _id: msme._id,
          businessName: msme.businessName,
          ownerName: msme.businessName, // Using businessName as owner name
          email: `${msme.username}@msme.com`, // Generate email from username
          phone: msme.contactNumber || 'N/A',
          address: msme.address || 'N/A',
          businessType: msme.category || 'N/A',
          registrationDate: new Date(msme.createdAt).toLocaleDateString(),
          status: msme.status || 'pending',
          username: msme.username,
          revenue: '₱0', // Default revenue
          employees: 0, // Default employees
          products: 0, // Will be updated with actual product count
          sales: '₱0', // Default sales
          rating: 4.0, // Default rating
          followers: 0, // Default followers
          businessPermit: msme.clientProfilingNumber || 'N/A',
          taxId: 'N/A',
          isVisible: msme.isVisible !== undefined ? msme.isVisible : true, // Use API value or default to true
          clientProfilingNumber: msme.clientProfilingNumber,
          visibilityReason: msme.visibilityReason || '',
          hiddenAt: msme.hiddenAt,
          hiddenBy: msme.hiddenBy || ''
        }));
        
        setMsmeData(transformedMsmes);
        return transformedMsmes;
      }
    } catch (error) {
      console.error('Error fetching MSMEs:', error);
      setMsmeData([]);
      return [];
    }
  };



  // Fetch MSME statistics (products, rating, followers)
  const fetchMsmeStatistics = async () => {
    try {
      const response = await fetch('http://localhost:1337/api/admin/msme-statistics');
      const data = await response.json();
      
      if (data.success && data.statistics) {
        return data.statistics;
      } else {
        console.error('Failed to fetch MSME statistics:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error fetching MSME statistics:', error);
      return [];
    }
  };

  // Fetch badge data for stores
  const fetchBadgeData = async () => {
    try {
      const response = await fetch('http://localhost:1337/api/badges/admin/stores?isActive=true');
      const data = await response.json();
      
      if (data.success && data.badges) {
        return data.badges;
      } else {
        console.error('Failed to fetch badge data:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error fetching badge data:', error);
      return [];
    }
  };

  // Check if a store has an active badge
  const hasActiveBadge = (msmeId) => {
    return badgeData.some(badge => badge.storeId && badge.storeId._id === msmeId);
  };

  // Update MSME data with real statistics
  const updateMsmeWithStatistics = (msmes, statistics) => {
    return msmes.map(msme => {
      const stats = statistics.find(stat => stat.msmeId === msme._id);
      return {
        ...msme,
        products: stats ? stats.products : 0,
        rating: stats ? stats.rating : 0,
        followers: stats ? stats.followers : 0
      };
    });
  };

  useEffect(() => {
    // Fetch data when component mounts
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [msmes, statistics, badges] = await Promise.all([
          fetchMsmes(),
          fetchMsmeStatistics(),
          fetchBadgeData()
        ]);
        
        // Update MSMEs with real statistics
        const updatedMsmes = updateMsmeWithStatistics(msmes, statistics);
        setMsmeData(updatedMsmes);
        setFilteredData(updatedMsmes);
        setBadgeData(badges);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  useEffect(() => {
    let filtered = msmeData;

    // Filter by active tab
    if (activeTab === 'pending') {
      filtered = filtered.filter(msme => msme.status === 'pending');
    } else if (activeTab === 'top') {
      // Show only stores that have active top badges
      const badgeStoreIds = badgeData.map(badge => badge.storeId._id);
      filtered = filtered.filter(msme => badgeStoreIds.includes(msme._id));
    } else if (activeTab === 'visibility') {
      // Show all for visibility controls tab
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(msme =>
        msme.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msme.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msme.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msme.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(msme => 
        msme.businessType && msme.businessType.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(msme => msme.status === statusFilter);
    }

    // Apply visibility filter
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(msme => 
        visibilityFilter === 'visible' ? msme.isVisible : !msme.isVisible
      );
    }

    setFilteredData(filtered);
  }, [searchTerm, categoryFilter, statusFilter, visibilityFilter, msmeData, activeTab]);

  const handleVisibilityToggle = async (msmeId) => {
    try {
      // Find the MSME to get current visibility status
      const msme = msmeData.find(m => m.id === msmeId);
      if (!msme) return;

      const newVisibility = !msme.isVisible;

      // If turning OFF visibility, show the reason modal
      if (!newVisibility) {
        setPendingToggleMsmeId(msmeId);
        setShowReasonModal(true);
        return;
      }

      // If turning ON visibility, proceed directly
      await performVisibilityToggle(msmeId, newVisibility, '');
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Error updating visibility. Please try again.');
    }
  };

  const performVisibilityToggle = async (msmeId, newVisibility, reason) => {
    try {
      const msme = msmeData.find(m => m.id === msmeId);
      if (!msme) return;

      console.log('Performing visibility toggle:', {
        msmeId,
        msme_id: msme._id,
        newVisibility,
        reason,
        businessName: msme.businessName
      });

      // Call API to update visibility
      const response = await fetch(`http://localhost:1337/api/admin/msme/${msme._id}/visibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          isVisible: newVisibility,
          reason: reason,
          adminName: 'Admin' // You can get this from logged-in admin context
        })
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (data.success) {
        console.log('Updating local state with:', {
          visibilityReason: data.msme.visibilityReason,
          hiddenAt: data.msme.hiddenAt,
          hiddenBy: data.msme.hiddenBy
        });
        
        // Update local state
        setMsmeData(prev => prev.map(m =>
          m.id === msmeId ? { 
            ...m, 
            isVisible: newVisibility,
            visibilityReason: data.msme.visibilityReason,
            hiddenAt: data.msme.hiddenAt,
            hiddenBy: data.msme.hiddenBy
          } : m
        ));

        // Log success
        console.log(`${msme.businessName} is now ${newVisibility ? 'visible' : 'hidden'} on the homepage and ${newVisibility ? 'can' : 'cannot'} log in.`);
      } else {
        console.error('Error toggling visibility:', data.error);
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const handleReasonSubmit = async () => {
    if (!visibilityReason.trim()) {
      return;
    }

    await performVisibilityToggle(pendingToggleMsmeId, false, visibilityReason);
    
    // Reset modal state
    setShowReasonModal(false);
    setVisibilityReason('');
    setPendingToggleMsmeId(null);
  };

  const handleReasonCancel = () => {
    setShowReasonModal(false);
    setVisibilityReason('');
    setPendingToggleMsmeId(null);
  };

  const handleViewDetails = async (msme) => {
    console.log('Selected MSME data:', msme);
    console.log('Visibility Reason:', msme.visibilityReason);
    console.log('Hidden At:', msme.hiddenAt);
    console.log('Hidden By:', msme.hiddenBy);
    
    setSelectedMsme(msme);
    setShowModal(true);
    setLoadingCertificates(true);
    
    try {
      const response = await fetch(`http://localhost:1337/api/msme/${msme.id}/certificates`);
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
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMsme(null);
    setCertificates(null);
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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return 'admin-msme-oversight__status-badge--verified';
      case 'pending':
        return 'admin-msme-oversight__status-badge--pending';
      case 'rejected':
        return 'admin-msme-oversight__status-badge--rejected';
      default:
        return 'admin-msme-oversight__status-badge--inactive';
    }
  };

  const handleSidebarToggle = (state) => {
    setSidebarState(state);
  };

  const getContentClass = () => {
    if (sidebarState.isMobile) {
      return 'admin-msme-oversight__content admin-msme-oversight__content--mobile';
    }
    return sidebarState.isOpen 
      ? 'admin-msme-oversight__content admin-msme-oversight__content--sidebar-open' 
      : 'admin-msme-oversight__content admin-msme-oversight__content--sidebar-collapsed';
  };

  const stats = {
    total: msmeData.length,
    verified: msmeData.filter(m => m.status === 'approved' || m.status === 'verified').length,
    totalProducts: msmeData.reduce((sum, msme) => sum + (msme.products || 0), 0), // Sum all products from all MSMEs
    pending: msmeData.filter(m => m.status === 'pending').length,
    topPerformers: badgeData.length // Count stores with active top badges
  };

  return (
    <div className="admin-msme-oversight">
      <AdminSidebar onSidebarToggle={handleSidebarToggle} />
      
      <div className={getContentClass()}>
        <div className="admin-msme-oversight__header">
          <h1>MSME Oversight</h1>
          <p>Monitor and manage MSME businesses, control visibility, and track performance.</p>
        </div>

        {/* Statistics Section */}
        <div className="admin-msme-oversight__stats">
          <div className="admin-msme-oversight__stat-box">
            <div className="admin-msme-oversight__stat-icon">
              <PeopleIcon />
            </div>
            <div className="admin-msme-oversight__stat-content">
              <div className="admin-msme-oversight__stat-value">{stats.total}</div>
              <div className="admin-msme-oversight__stat-label">Total MSMEs</div>
              <div className="admin-msme-oversight__stat-growth">+6% from last month</div>
            </div>
          </div>
          <div className="admin-msme-oversight__stat-box">
            <div className="admin-msme-oversight__stat-icon">
              <VerifiedIcon />
            </div>
            <div className="admin-msme-oversight__stat-content">
              <div className="admin-msme-oversight__stat-value">{stats.verified}</div>
              <div className="admin-msme-oversight__stat-label">Verified MSMEs</div>
              <div className="admin-msme-oversight__stat-growth">+12% from last month</div>
            </div>
          </div>
          <div className="admin-msme-oversight__stat-box">
            <div className="admin-msme-oversight__stat-icon">
              <InventoryIcon />
            </div>
            <div className="admin-msme-oversight__stat-content">
              <div className="admin-msme-oversight__stat-value">{stats.totalProducts.toLocaleString()}</div>
              <div className="admin-msme-oversight__stat-label">Total Products</div>
              <div className="admin-msme-oversight__stat-growth">+18% from last month</div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="admin-msme-oversight__filters">
          <div className="admin-msme-oversight__filters-row">
            <input
              type="text"
              placeholder="Search MSMEs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-msme-oversight__search-input"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="admin-msme-oversight__filter-dropdown"
            >
              <option value="all">All Categories</option>
              <option value="food">Food</option>
              <option value="artisan">Artisan</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-msme-oversight__filter-dropdown"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="admin-msme-oversight__filter-dropdown"
            >
              <option value="all">All Visibility</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="admin-msme-oversight__tabs">
          <button
            className={`admin-msme-oversight__tab-button ${activeTab === 'all' ? 'admin-msme-oversight__tab-button--active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All MSMEs ({stats.total})
          </button>
          <button
            className={`admin-msme-oversight__tab-button ${activeTab === 'pending' ? 'admin-msme-oversight__tab-button--active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Review ({stats.pending})
          </button>
          <button
            className={`admin-msme-oversight__tab-button ${activeTab === 'top' ? 'admin-msme-oversight__tab-button--active' : ''}`}
            onClick={() => setActiveTab('top')}
          >
            Top Performers ({stats.topPerformers}) 🏆
          </button>
          <button
            className={`admin-msme-oversight__tab-button ${activeTab === 'visibility' ? 'admin-msme-oversight__tab-button--active' : ''}`}
            onClick={() => setActiveTab('visibility')}
          >
            Visibility Controls
          </button>
        </div>

        {/* MSME Cards Section */}
        <div className="admin-msme-oversight__cards-section">
          {loading ? (
            <div className="admin-msme-oversight__loading">Loading MSME data...</div>
          ) : filteredData.length === 0 ? (
            <div className="admin-msme-oversight__no-data">No MSMEs found matching your criteria.</div>
          ) : (
            <div className="admin-msme-oversight__cards-grid">
              {filteredData.map((msme) => (
                <div 
                  key={msme.id} 
                  className="admin-msme-oversight__msme-card admin-msme-oversight__msme-card--clickable"
                  onClick={() => handleViewDetails(msme)}
                >
                  <div className="admin-msme-oversight__card-header">
                    <div className="admin-msme-oversight__card-avatar">
                      {msme.businessName.charAt(0)}
                    </div>
                    <div className="admin-msme-oversight__card-info">
                      <h3 className="admin-msme-oversight__card-title">{msme.businessName}</h3>
                      <p className="admin-msme-oversight__card-email">{msme.email}</p>
                    </div>
                    <div className="admin-msme-oversight__card-badges">
                      <span className="admin-msme-oversight__category-badge">{msme.businessType}</span>
                      <span className={`admin-msme-oversight__status-badge ${getStatusBadgeClass(msme.status)}`}>
                        {msme.status}
                      </span>
                      {hasActiveBadge(msme._id) && (
                        <span className="admin-msme-oversight__badge-indicator" title="Top Store Badge">
                          <EmojiEventsIcon style={{ fontSize: '16px', color: '#ffd700' }} />
                        </span>
                      )}
                    </div>
                    <div className="admin-msme-oversight__visibility-toggle" onClick={(e) => e.stopPropagation()}>
                      <label className="admin-msme-oversight__toggle-switch">
                        <input
                          type="checkbox"
                          checked={msme.isVisible}
                          onChange={() => handleVisibilityToggle(msme.id)}
                        />
                        <span className="admin-msme-oversight__toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="admin-msme-oversight__card-metrics">
                    <div className="admin-msme-oversight__metric">
                      <div className="admin-msme-oversight__metric-value">{msme.products}</div>
                      <div className="admin-msme-oversight__metric-label">Products</div>
                    </div>
                    <div className="admin-msme-oversight__metric">
                      <div className="admin-msme-oversight__metric-value">{msme.followers}</div>
                      <div className="admin-msme-oversight__metric-label">Followers</div>
                    </div>
                  </div>
                  

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Certificate Modal */}
      {showModal && selectedMsme && (
        <div className="admin-msme-oversight__modal-overlay" onClick={handleCloseModal}>
          <div className="admin-msme-oversight__modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-msme-oversight__modal-header">
              <h2>MSME Details - {selectedMsme.businessName}</h2>
              <button className="admin-msme-oversight__modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            
            <div className="admin-msme-oversight__modal-body">
              {/* MSME Basic Information */}
              <div className="admin-msme-oversight__msme-info">
                <div className="admin-msme-oversight__info-row">
                  <div className="admin-msme-oversight__info-label">Business Name:</div>
                  <div className="admin-msme-oversight__info-value">{selectedMsme.businessName}</div>
                </div>
                <div className="admin-msme-oversight__info-row">
                  <div className="admin-msme-oversight__info-label">Email:</div>
                  <div className="admin-msme-oversight__info-value">{selectedMsme.email}</div>
                </div>
                <div className="admin-msme-oversight__info-row">
                  <div className="admin-msme-oversight__info-label">Category:</div>
                  <div className="admin-msme-oversight__info-value">{selectedMsme.businessType}</div>
                </div>
                <div className="admin-msme-oversight__info-row">
                  <div className="admin-msme-oversight__info-label">Status:</div>
                  <div className="admin-msme-oversight__info-value">
                    <span className={`admin-msme-oversight__status-badge ${getStatusBadgeClass(selectedMsme.status)}`}>
                      {selectedMsme.status}
                    </span>
                  </div>
                </div>
                <div className="admin-msme-oversight__info-row">
                  <div className="admin-msme-oversight__info-label">Visibility:</div>
                  <div className="admin-msme-oversight__info-value">
                    <span className={`admin-msme-oversight__visibility-badge ${selectedMsme.isVisible ? 'visible' : 'hidden'}`}>
                      {selectedMsme.isVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </div>
                {!selectedMsme.isVisible && (
                  <>
                    <div className="admin-msme-oversight__info-row">
                      <div className="admin-msme-oversight__info-label">Reason:</div>
                      <div className="admin-msme-oversight__info-value admin-msme-oversight__reason-value">
                        {selectedMsme.visibilityReason || 'No reason provided'}
                      </div>
                    </div>
                    {(selectedMsme.hiddenBy || selectedMsme.hiddenAt) && (
                      <div className="admin-msme-oversight__info-row">
                        <div className="admin-msme-oversight__info-label">Hidden By:</div>
                        <div className="admin-msme-oversight__info-value">
                          {selectedMsme.hiddenBy || 'Admin'}
                          {selectedMsme.hiddenAt && ` on ${new Date(selectedMsme.hiddenAt).toLocaleDateString()} at ${new Date(selectedMsme.hiddenAt).toLocaleTimeString()}`}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Business Certificates */}
              <div className="admin-msme-oversight__certificates-section">
                <h3>Business Certificates</h3>
                {loadingCertificates ? (
                  <div className="admin-msme-oversight__loading">Loading certificates...</div>
                ) : certificates ? (
                <div className="admin-msme-oversight__certificates-grid">
                  <div className="admin-msme-oversight__certificate-item">
                    <h4>TIN Number</h4>
                    <p>{certificates.tinNumber || 'Not provided'}</p>
                  </div>
                  
                  <div className="admin-msme-oversight__certificate-item">
                    <h4>Mayor's Permit</h4>
                    {certificates.mayorsPermit ? (
                      <button 
                        className="admin-msme-oversight__view-certificate-btn"
                        onClick={() => handleViewCertificate('Mayor\'s Permit', getCertificateUrl(certificates.mayorsPermit))}
                      >
                        View Document
                      </button>
                    ) : (
                      <p className="admin-msme-oversight__no-document">Not uploaded</p>
                    )}
                  </div>
                  
                  <div className="admin-msme-oversight__certificate-item">
                    <h4>BIR Certificate</h4>
                    {certificates.bir ? (
                      <button 
                        className="admin-msme-oversight__view-certificate-btn"
                        onClick={() => handleViewCertificate('BIR Certificate', getCertificateUrl(certificates.bir))}
                      >
                        View Document
                      </button>
                    ) : (
                      <p className="admin-msme-oversight__no-document">Not uploaded</p>
                    )}
                  </div>
                  
                  <div className="admin-msme-oversight__certificate-item">
                    <h4>DTI Certificate</h4>
                    {certificates.dti ? (
                      <button 
                        className="admin-msme-oversight__view-certificate-btn"
                        onClick={() => handleViewCertificate('DTI Certificate', getCertificateUrl(certificates.dti))}
                      >
                        View Document
                      </button>
                    ) : (
                      <p className="admin-msme-oversight__no-document">Not uploaded</p>
                    )}
                  </div>
                </div>
                ) : (
                  <div className="admin-msme-oversight__no-certificates">
                    No certificate information available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Viewer Modal */}
      {showCertificateViewer && (
        <div className="admin-msme-oversight__certificate-viewer-overlay" onClick={handleCloseCertificateViewer}>
          <div className="admin-msme-oversight__certificate-viewer-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-msme-oversight__certificate-viewer-header">
              <h3>{currentCertificate.title}</h3>
              <button 
                className="admin-msme-oversight__certificate-viewer-close" 
                onClick={handleCloseCertificateViewer}
              >
                ×
              </button>
            </div>
            <div className="admin-msme-oversight__certificate-viewer-body">
              <img 
                src={currentCertificate.url} 
                alt={currentCertificate.title}
                className="admin-msme-oversight__certificate-viewer-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="admin-msme-oversight__certificate-viewer-fallback" style={{display: 'none'}}>
                <div className="admin-msme-oversight__document-icon-large">📄</div>
                <p>This document cannot be previewed as an image</p>
                <a 
                  href={currentCertificate.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="admin-msme-oversight__download-btn"
                >
                  Download Document
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visibility Reason Modal */}
      {showReasonModal && (
        <div className="admin-msme-oversight__reason-modal-overlay" onClick={handleReasonCancel}>
          <div className="admin-msme-oversight__reason-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-msme-oversight__reason-modal-header">
              <h3>Reason for Hiding MSME</h3>
              <button 
                className="admin-msme-oversight__reason-modal-close" 
                onClick={handleReasonCancel}
              >
                ×
              </button>
            </div>
            <div className="admin-msme-oversight__reason-modal-body">
              <p className="admin-msme-oversight__reason-modal-description">
                Please provide a reason for hiding this MSME from the platform. This will be recorded for administrative purposes.
              </p>
              <textarea
                className="admin-msme-oversight__reason-textarea"
                placeholder="Enter reason for hiding this MSME..."
                value={visibilityReason}
                onChange={(e) => setVisibilityReason(e.target.value)}
                rows={5}
                autoFocus
              />
            </div>
            <div className="admin-msme-oversight__reason-modal-footer">
              <button 
                className="admin-msme-oversight__reason-cancel-btn"
                onClick={handleReasonCancel}
              >
                Cancel
              </button>
              <button 
                className="admin-msme-oversight__reason-submit-btn"
                onClick={handleReasonSubmit}
                disabled={!visibilityReason.trim()}
              >
                Hide MSME
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMsmeOversight;
