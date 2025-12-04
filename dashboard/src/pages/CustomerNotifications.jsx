import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerSidebar from './CustomerSidebar';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../components/NotificationProvider';
import { formatDistanceToNow } from 'date-fns';
import '../css/CustomerNotifications.css';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import MarkAsReadIcon from '@mui/icons-material/DoneAll';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';

const CustomerNotifications = () => {
  const { user, userType, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  // Helper function to generate proper URLs for images
  const getImageUrl = (imageValue) => {
    if (!imageValue) return null;
    
    // If it's already a full URL (Cloudinary or other), use it directly
    if (imageValue.startsWith('http')) {
      return imageValue;
    }
    
    // If it contains folder structure like 'elako/products/...', it's a Cloudinary public ID
    if (imageValue.includes('/') && !imageValue.startsWith('uploads/')) {
      return `https://res.cloudinary.com/dk9umulxw/image/upload/${imageValue}`;
    }
    
    // Otherwise, it's a legacy local file
    return `http://localhost:1337/uploads/${imageValue}`;
  };
  
  const [sidebarState, setSidebarState] = useState({
    isOpen: true,
    isMobile: false,
    isCollapsed: false
  });
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [selectedType, setSelectedType] = useState('all'); // all, new_product, price_drop, etc.

  const handleSidebarToggle = (state) => {
    setSidebarState(state);
  };

  const getContentClass = () => {
    if (sidebarState.isMobile) {
      return 'customer-notifications__content customer-notifications__content--mobile';
    }
    if (sidebarState.isCollapsed) {
      return 'customer-notifications__content customer-notifications__content--collapsed';
    }
    return sidebarState.isOpen 
      ? 'customer-notifications__content customer-notifications__content--sidebar-open'
      : 'customer-notifications__content customer-notifications__content--sidebar-closed';
  };

  // Fetch all notifications
  const fetchNotifications = async () => {
    if (!user?._id) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:1337/api/customer-notifications/${user._id}?limit=50`);
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id && isAuthenticated && userType === 'customer') {
      fetchNotifications();
    }
  }, [user?._id, isAuthenticated, userType]);

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if not already read
      if (!notification.isRead) {
        await fetch(`http://localhost:1337/api/customer-notifications/${notification._id}/read`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ customerId: user._id }),
        });

        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
      }

      // Handle navigation based on notification type
      handleNotificationNavigation(notification);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleNotificationNavigation = (notification) => {
    const { type, actionType, actionUrl, productId, storeId } = notification;

    switch (actionType) {
      case 'product_detail':
        if (productId?._id) {
          navigate(`/product/${productId._id}`);
        }
        break;
      
      case 'store_detail':
        if (storeId?._id) {
          navigate(`/customer/store/${storeId._id}`);
        }
        break;
      
      case 'custom_url':
        if (actionUrl) {
          if (actionUrl.startsWith('http')) {
            window.open(actionUrl, '_blank');
          } else {
            navigate(actionUrl);
          }
        }
        break;
      
      case 'none':
      default:
        if (['new_product', 'price_drop', 'availability_alert'].includes(type) && productId?._id) {
          navigate(`/product/${productId._id}`);
        } else if (type === 'store_promotion' && storeId?._id) {
          navigate(`/customer/store/${storeId._id}`);
        }
        break;
    }
  };

  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    
    try {
      await fetch(`http://localhost:1337/api/customer-notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId: user._id }),
      });

      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      
      showSuccess('Notification marked as read');
    } catch (error) {
      console.error('Error marking as read:', error);
      showError('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`http://localhost:1337/api/customer-notifications/${user._id}/read-all`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      showSuccess('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      showError('Failed to mark all notifications as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_product':
        return <ShoppingBagIcon className="customer-notifications__type-icon" />;
      case 'price_drop':
        return <span className="customer-notifications__type-icon price-drop">💰</span>;
      case 'availability_alert':
        return <span className="customer-notifications__type-icon availability-alert">📦</span>;
      case 'store_promotion':
        return <span className="customer-notifications__type-icon promotion">🎉</span>;
      case 'order_status':
        return <span className="customer-notifications__type-icon order">📋</span>;
      default:
        return <ShoppingBagIcon className="customer-notifications__type-icon" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'new_product': return '#7ed957';
      case 'price_drop': return '#ff9800';
      case 'availability_alert': return '#2196f3';
      case 'store_promotion': return '#e91e63';
      case 'order_status': return '#9c27b0';
      default: return '#7ed957';
    }
  };

  const formatNotificationTime = (createdAt) => {
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesReadFilter = filter === 'all' || 
      (filter === 'unread' && !notification.isRead) ||
      (filter === 'read' && notification.isRead);
    
    const matchesTypeFilter = selectedType === 'all' || notification.type === selectedType;
    
    return matchesReadFilter && matchesTypeFilter;
  });

  const notificationTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'new_product', label: 'New Products' },
    { value: 'price_drop', label: 'Price Drops' },
    { value: 'availability_alert', label: 'Availability Alerts' },
    { value: 'store_promotion', label: 'Promotions' },
    { value: 'order_status', label: 'Order Updates' }
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!isAuthenticated || userType !== 'customer') {
    return (
      <div className="customer-notifications">
        <CustomerSidebar onSidebarToggle={handleSidebarToggle} />
        <div className={getContentClass()}>
          <div className="customer-notifications__container">
            <div className="customer-notifications__auth-message">
              <h2>Please log in as a customer to view your notifications</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-notifications">
      <CustomerSidebar onSidebarToggle={handleSidebarToggle} />
      <div className={getContentClass()}>
        <div className="customer-notifications__header">
          <div className="customer-notifications__header-content">
            <div className="customer-notifications__header-left">
              <IconButton 
                onClick={() => navigate(-1)}
                className="customer-notifications__back-btn"
              >
                <ArrowBackIcon />
              </IconButton>
              <div className="customer-notifications__header-text">
                <Typography variant="h4" className="customer-notifications__title">
                  Notifications
                </Typography>
                <Typography variant="body2" className="customer-notifications__subtitle">
                  {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                </Typography>
              </div>
            </div>
            <div className="customer-notifications__header-actions">
              {unreadCount > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<MarkAsReadIcon />}
                  onClick={handleMarkAllAsRead}
                  size="small"
                >
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="customer-notifications__filters">
          <div className="customer-notifications__filter-group">
            <FilterListIcon className="customer-notifications__filter-icon" />
            <div className="customer-notifications__filter-buttons">
              {['all', 'unread', 'read'].map((filterType) => (
                <Button
                  key={filterType}
                  variant={filter === filterType ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setFilter(filterType)}
                  className="customer-notifications__filter-btn"
                >
                  {filterType === 'all' ? 'All' : filterType === 'unread' ? 'Unread' : 'Read'}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="customer-notifications__type-filter">
            {notificationTypes.map((type) => (
              <Chip
                key={type.value}
                label={type.label}
                variant={selectedType === type.value ? 'filled' : 'outlined'}
                onClick={() => setSelectedType(type.value)}
                size="small"
                className="customer-notifications__type-chip"
              />
            ))}
          </div>
        </div>

        <div className="customer-notifications__content-area">
          {loading ? (
            <div className="customer-notifications__loading">
              <CircularProgress size={40} />
              <Typography variant="body1" style={{ marginTop: '16px' }}>
                Loading notifications...
              </Typography>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="customer-notifications__empty">
              <NotificationsNoneIcon className="customer-notifications__empty-icon" />
              <Typography variant="h6" color="textSecondary">
                {filter === 'unread' ? 'No unread notifications' : 
                 filter === 'read' ? 'No read notifications' : 'No notifications yet'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {filter === 'all' && "You'll be notified when stores you follow add new products or have promotions"}
              </Typography>
            </div>
          ) : (
            <div className="customer-notifications__list">
              {filteredNotifications.map((notification) => (
                <Card 
                  key={notification._id}
                  className={`customer-notifications__card ${
                    !notification.isRead ? 'customer-notifications__card--unread' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="customer-notifications__card-content">
                    <div className="customer-notifications__card-main">
                      <div className="customer-notifications__card-icon">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="customer-notifications__card-info">
                        <div className="customer-notifications__card-header">
                          <Typography variant="h6" className="customer-notifications__card-title">
                            {notification.title}
                          </Typography>
                          <Chip
                            label={notification.type?.replace('_', ' ').toUpperCase()}
                            size="small"
                            style={{ 
                              backgroundColor: getTypeColor(notification.type),
                              color: 'white',
                              fontSize: '10px'
                            }}
                          />
                        </div>
                        
                        <Typography variant="body1" className="customer-notifications__card-message">
                          {notification.message}
                          {notification.type === 'price_drop' && notification.metadata?.discountPercentage && (
                            <Chip
                              label={`${notification.metadata.discountPercentage}% OFF`}
                              size="small"
                              color="primary"
                              className="customer-notifications__discount-badge"
                            />
                          )}
                        </Typography>

                        {notification.productId && (
                          <div className="customer-notifications__product-info">
                            {notification.productId.picture && (
                              <Avatar
                                src={getImageUrl(notification.productId.picture)}
                                alt={notification.productId.productName}
                                className="customer-notifications__product-image"
                              />
                            )}
                            <div className="customer-notifications__product-details">
                              <Typography variant="body2" className="customer-notifications__product-name">
                                {notification.productId.productName}
                              </Typography>
                              {notification.productId.price && (
                                <Typography variant="body2" className="customer-notifications__product-price">
                                  ₱{notification.productId.price.toFixed(2)}
                                </Typography>
                              )}
                            </div>
                          </div>
                        )}

                        <Typography variant="caption" className="customer-notifications__card-time">
                          {formatNotificationTime(notification.createdAt)}
                        </Typography>
                      </div>
                    </div>

                    <div className="customer-notifications__card-actions">
                      {!notification.isRead && (
                        <Tooltip title="Mark as read">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMarkAsRead(notification._id, e)}
                            className="customer-notifications__action-btn"
                          >
                            <MarkAsReadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!notification.isRead && (
                        <div className="customer-notifications__unread-dot"></div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerNotifications;