import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  IconButton, 
  Badge,
  Menu, 
  MenuItem, 
  Typography, 
  Divider, 
  Box,
  Button,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Checkbox,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ViewListIcon from '@mui/icons-material/ViewList';
import CloseIcon from '@mui/icons-material/Close';
import MarkAsUnreadIcon from '@mui/icons-material/MarkAsUnread';
import DeleteIcon from '@mui/icons-material/Delete';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import Notification from './Notification';
import './CustomerNotificationIcon.css';

const CustomerNotificationIcon = () => {
  const { user } = useAuth();
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
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swipeDistance, setSwipeDistance] = useState({});
  const [isActiveSwipe, setIsActiveSwipe] = useState({});
  const [showDeleteAllNotification, setShowDeleteAllNotification] = useState(false);

  const open = Boolean(anchorEl);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?._id) return;

    try {
      setLoading(true);
      console.log('🔍 Fetching notifications for user ID:', user._id);
      console.log('📝 Full user object:', user);
      const response = await fetch(`http://localhost:1337/api/customer-notifications/${user._id}?limit=10`);
      const data = await response.json();
      
      console.log('📨 Notification API response:', data);

      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        console.log('✅ Notifications set:', data.notifications.length, 'unread:', data.unreadCount);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and periodic updates
  useEffect(() => {
    if (user?._id) {
      fetchNotifications();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?._id]);

  const handleClick = (event) => {
    // Open the All Notifications drawer directly
    setIsDrawerOpen(true);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleViewAllNotifications = () => {
    handleClose();
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedNotifications([]);
    setIsSelectionMode(false);
  };

  const getDrawerNotificationTitle = (notification) => {
    switch (notification.type) {
      case 'price_drop':
        return 'Price Drop Alert!';
      case 'availability_alert':
        return 'Back Available!';
      case 'promotion':
        return 'Special Promotion!';
      case 'order':
        return 'Order Update';
      case 'top_fan_badge':
        return 'Badge Earned! 🎉';
      default:
        return 'Notification';
    }
  };

  const handleDrawerNotificationClick = async (notification) => {
    // In selection mode, clicking should select/deselect
    if (isSelectionMode) {
      handleSelectNotification(notification._id);
      return;
    }

    try {
      // Mark as read
      if (!notification.isRead) {
        await fetch(`http://localhost:1337/api/customer-notifications/${notification._id}/read`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        // Refresh notifications to get updated counts
        fetchNotifications();
      }

      // Handle navigation based on notification type
      handleNotificationNavigation(notification);
      handleCloseDrawer();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Swipe handling functions
  const handleTouchStart = (e, notificationId) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsActiveSwipe(prev => ({ ...prev, [notificationId]: true }));
  };

  const handleTouchMove = (e, notificationId) => {
    const currentX = e.targetTouches[0].clientX;
    setTouchEnd(currentX);
    
    if (touchStart && isActiveSwipe[notificationId]) {
      const distance = touchStart - currentX;
      const clampedDistance = Math.max(0, Math.min(distance, 100)); // Clamp between 0 and 100px
      setSwipeDistance(prev => ({ ...prev, [notificationId]: clampedDistance }));
    }
  };

  const handleTouchEnd = (e, notificationId) => {
    if (!touchStart || !touchEnd) {
      // Reset states even if we don't have proper touch data
      setIsActiveSwipe(prev => ({ ...prev, [notificationId]: false }));
      setSwipeDistance(prev => ({ ...prev, [notificationId]: 0 }));
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    // Reset states
    setIsActiveSwipe(prev => ({ ...prev, [notificationId]: false }));
    setSwipeDistance(prev => ({ ...prev, [notificationId]: 0 }));

    if (isLeftSwipe) {
      // Swipe left - automatically delete notification
      handleDeleteSingleNotification(notificationId);
    }
  };

  // Mouse drag support for desktop
  const handleMouseDown = (e, notificationId) => {
    setTouchEnd(null);
    setTouchStart(e.clientX);
  };

  const handleMouseMove = (e, notificationId) => {
    if (touchStart) {
      setTouchEnd(e.clientX);
    }
  };

  const handleMouseUp = (e, notificationId) => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // Mouse drag left - automatically delete notification
      handleDeleteSingleNotification(notificationId);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleDeleteSingleNotification = async (notificationId) => {
    try {
      // Add a brief slide-out animation before removing
      const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
      if (notificationElement) {
        notificationElement.style.transform = 'translateX(-100%)';
        notificationElement.style.opacity = '0';
        
        // Wait for animation to complete before removing from state
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n._id !== notificationId));
        }, 300);
      } else {
        // Fallback if element not found
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
      }
      
      const response = await fetch(`http://localhost:1337/api/customer-notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: user._id
        })
      });

      if (response.ok) {
        // Refresh to get updated counts
        fetchNotifications();
      } else {
        // If API call failed, revert the optimistic update
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Revert optimistic update on error
      fetchNotifications();
    }
  };

  // Selection and deletion functions
  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedNotifications([]);
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => {
      if (prev.includes(notificationId)) {
        return prev.filter(id => id !== notificationId);
      } else {
        return [...prev, notificationId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n._id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedNotifications.length === 0) return;

    // Use the same customer ID format as fetchNotifications
    const customerId = user._id || user.id;
    
    console.log('Deleting selected notifications:', {
      selectedNotifications,
      customerId,
      userObject: user
    });

    try {
      const response = await fetch(`http://localhost:1337/api/customer-notifications/delete-multiple`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: selectedNotifications,
          customerId
        })
      });

      const result = await response.json();
      console.log('Delete response:', result);

      if (response.ok && result.success) {
        // Remove deleted notifications from local state
        setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n._id)));
        setUnreadCount(prev => {
          const deletedUnreadCount = notifications.filter(n => 
            selectedNotifications.includes(n._id) && !n.isRead
          ).length;
          return Math.max(0, prev - deletedUnreadCount);
        });
        setSelectedNotifications([]);
        setIsSelectionMode(false);
        console.log(`Successfully deleted ${result.deletedCount} notifications`);
      } else {
        console.error('Delete failed:', result);
        alert('Failed to delete notifications. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting selected notifications:', error);
      alert('An error occurred while deleting notifications.');
    }
  };

  const handleDeleteAll = () => {
    if (notifications.length === 0) return;
    setShowDeleteAllNotification(true);
  };

  const handleConfirmDeleteAll = async () => {
    const customerId = user._id || user.id;
    console.log('Confirm Delete All clicked, customerId:', customerId, 'notifications.length:', notifications.length);

    try {
      const response = await fetch(`http://localhost:1337/api/customer-notifications/${customerId}/delete-all`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Delete All response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Delete All response data:', data);
        
        setNotifications([]);
        setUnreadCount(0);
        setSelectedNotifications([]);
        setIsSelectionMode(false);
        fetchNotifications();
      } else {
        const errorData = await response.json();
        console.error('Delete All failed:', errorData);
        alert('Failed to delete all notifications. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      alert('An error occurred while deleting all notifications.');
    }
  };



  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
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
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Handle navigation based on notification type and action
      handleNotificationNavigation(notification);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }

    handleClose();
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
          // Handle both internal and external URLs
          if (actionUrl.startsWith('http')) {
            window.open(actionUrl, '_blank');
          } else {
            navigate(actionUrl);
          }
        }
        break;
      
      case 'none':
      default:
        // For 'new_product', 'price_drop', 'availability_alert' - navigate to product
        if (['new_product', 'price_drop', 'availability_alert'].includes(type) && productId?._id) {
          navigate(`/product/${productId._id}`);
        }
        // For 'store_promotion' - navigate to store
        else if (type === 'store_promotion' && storeId?._id) {
          navigate(`/customer/store/${storeId._id}`);
        }
        break;
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

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_product':
        return <ShoppingBagIcon className="customer-notification-icon__type-icon" />;
      case 'price_drop':
        return (
          <span className="customer-notification-icon__type-icon price-drop">
            💰
          </span>
        );
      case 'availability_alert':
        return (
          <span className="customer-notification-icon__type-icon availability-alert">
            📦
          </span>
        );
      case 'store_promotion':
        return (
          <span className="customer-notification-icon__type-icon promotion">
            🎉
          </span>
        );
      case 'order_status':
        return (
          <span className="customer-notification-icon__type-icon order">
            📋
          </span>
        );
      case 'top_fan_badge':
        return (
          <span className="customer-notification-icon__type-icon top-fan-badge">
            👑
          </span>
        );
      default:
        return <ShoppingBagIcon className="customer-notification-icon__type-icon" />;
    }
  };

  const formatNotificationTime = (createdAt) => {
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  console.log('CustomerNotificationIcon - unreadCount:', unreadCount);

  if (!user) return null;

  return (
    <div className="customer-notification-icon">
      <IconButton
        className="customer-notification-icon__button"
        onClick={handleClick}
        size="medium"
        aria-label={`${unreadCount} unread notifications`}
      >
        <Badge 
          badgeContent={unreadCount > 0 ? unreadCount : null}
          color="error" 
          max={99}
          invisible={unreadCount === 0}
        >
          <NotificationsNoneIcon className="customer-notification-icon__bell" />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        className="customer-notification-icon__menu"
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          className: 'customer-notification-icon__menu-paper'
        }}
      >
        <div className="customer-notification-icon__header">
          <Typography variant="h6" className="customer-notification-icon__title">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAllAsRead}
              className="customer-notification-icon__mark-all-btn"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <Divider />

        {loading ? (
          <MenuItem disabled>
            <Typography variant="body2">Loading...</Typography>
          </MenuItem>
        ) : notifications.length === 0 ? (
          <MenuItem disabled className="customer-notification-icon__empty">
            <Box textAlign="center" py={2}>
              <NotificationsNoneIcon className="customer-notification-icon__empty-icon" />
              <Typography variant="body2" color="textSecondary">
                No notifications yet
              </Typography>
              <Typography variant="caption" color="textSecondary">
                You'll be notified when stores you follow add new products
              </Typography>
            </Box>
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`customer-notification-icon__item ${
                !notification.isRead ? 'customer-notification-icon__item--unread' : ''
              } ${notification.type ? `customer-notification-icon__item--${notification.type.replace('_', '-')}` : ''}`}
            >
              <div className="customer-notification-icon__item-content">
                <div className="customer-notification-icon__item-header">
                  <div className="customer-notification-icon__item-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="customer-notification-icon__item-info">
                    <Typography variant="subtitle2" className="customer-notification-icon__item-title">
                      {notification.title}
                    </Typography>
                    <Typography variant="body2" className="customer-notification-icon__item-message">
                      {notification.message}
                      {notification.type === 'price_drop' && notification.metadata?.discountPercentage && (
                        <span className="customer-notification-icon__discount-badge">
                          {notification.metadata.discountPercentage}% OFF
                        </span>
                      )}
                    </Typography>
                    {notification.productId && (
                      <div className="customer-notification-icon__product-info">
                        {notification.productId.picture && (
                          <Avatar
                            src={getImageUrl(notification.productId.picture)}
                            alt={notification.productId.productName}
                            className="customer-notification-icon__product-image"
                          />
                        )}
                        <div>
                          <Typography variant="caption" className="customer-notification-icon__product-name">
                            {notification.productId.productName}
                          </Typography>
                          {notification.productId.price && (
                            <Typography variant="caption" className="customer-notification-icon__product-price">
                              ₱{notification.productId.price.toFixed(2)}
                            </Typography>
                          )}
                        </div>
                      </div>
                    )}
                    <Typography variant="caption" className="customer-notification-icon__item-time">
                      {formatNotificationTime(notification.createdAt)}
                    </Typography>
                  </div>
                </div>
                {!notification.isRead && (
                  <div className="customer-notification-icon__unread-dot"></div>
                )}
              </div>
            </MenuItem>
          ))
        )}

        {notifications.length > 0 && [
          <Divider key="divider" />,
          <MenuItem key="view-all" className="customer-notification-icon__view-all" onClick={handleViewAllNotifications}>
            <Typography variant="body2" color="primary" align="center" width="100%">
              View All Notifications
            </Typography>
          </MenuItem>
        ]}
      </Menu>

      {/* Navbar Drawer for All Notifications */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        className="customer-notification-icon__drawer"
        PaperProps={{
          className: 'customer-notification-icon__drawer-paper'
        }}
      >
        <div className="customer-notification-icon__drawer-container">
          {/* Header */}
          <div className="customer-notification-icon__drawer-header">
            <Typography variant="h6" className="customer-notification-icon__drawer-title">
              All Notifications
            </Typography>
            <div>
              <IconButton onClick={handleCloseDrawer} size="small">
                <CloseIcon />
              </IconButton>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="customer-notification-icon__drawer-actions">
            {isSelectionMode ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleSelectAll}
                  className="customer-notification-icon__drawer-action-btn"
                  startIcon={<CheckBoxIcon />}
                >
                  {selectedNotifications.length === notifications.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={handleDeleteSelected}
                  className="customer-notification-icon__drawer-delete-btn"
                  startIcon={<DeleteIcon />}
                  disabled={selectedNotifications.length === 0}
                >
                  Delete Selected ({selectedNotifications.length})
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleToggleSelectionMode}
                  className="customer-notification-icon__drawer-cancel-btn"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {unreadCount > 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleMarkAllAsRead}
                    className="customer-notification-icon__drawer-mark-all-btn"
                  >
                    Mark All Read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={handleDeleteAll}
                    className="customer-notification-icon__drawer-delete-all-btn"
                    startIcon={<DeleteIcon />}
                  >
                    Delete All
                  </Button>
                )}
              </div>
            )}
            {!isSelectionMode && notifications.length > 0 && (
              <Typography variant="caption" color="textSecondary" style={{ marginTop: '8px', display: 'block' }}>
                Swipe left to delete instantly
              </Typography>
            )}
          </div>

          <Divider />

          {/* Notifications List */}
          <div className="customer-notification-icon__drawer-content">
            {loading ? (
              <div className="customer-notification-icon__drawer-loading">
                <Typography>Loading notifications...</Typography>
              </div>
            ) : notifications.length === 0 ? (
              <div className="customer-notification-icon__drawer-empty">
                <NotificationsNoneIcon className="customer-notification-icon__drawer-empty-icon" />
                <Typography variant="body2" color="textSecondary">
                  No notifications yet
                </Typography>
              </div>
            ) : (
              <List className="customer-notification-icon__drawer-list">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    data-notification-id={notification._id}
                    className="customer-notification-icon__drawer-item-wrapper"
                    style={{
                      transform: `translateX(-${swipeDistance[notification._id] || 0}px)`,
                      transition: isActiveSwipe[notification._id] ? 'none' : 'transform 0.3s ease'
                    }}
                  >
                    <ListItem
                      className={`customer-notification-icon__drawer-item ${
                        !notification.isRead ? 'customer-notification-icon__drawer-item--unread' : ''
                      } ${isSelectionMode ? 'customer-notification-icon__drawer-item--selection-mode' : ''}`}
                      onClick={() => handleDrawerNotificationClick(notification)}
                      onTouchStart={(e) => handleTouchStart(e, notification._id)}
                      onTouchMove={(e) => handleTouchMove(e, notification._id)}
                      onTouchEnd={(e) => handleTouchEnd(e, notification._id)}
                      onMouseDown={(e) => handleMouseDown(e, notification._id)}
                      onMouseMove={(e) => handleMouseMove(e, notification._id)}
                      onMouseUp={(e) => handleMouseUp(e, notification._id)}
                      onMouseLeave={(e) => handleMouseUp(e, notification._id)}
                    >
                    {isSelectionMode && (
                      <ListItemAvatar>
                        <Checkbox
                          checked={selectedNotifications.includes(notification._id)}
                          onChange={() => handleSelectNotification(notification._id)}
                          className="customer-notification-icon__drawer-checkbox"
                        />
                      </ListItemAvatar>
                    )}
                    {!isSelectionMode && (
                      <ListItemAvatar>
                        <Avatar className="customer-notification-icon__drawer-avatar">
                          {notification.type === 'price_drop' ? '💰' : 
                           notification.type === 'availability_alert' ? '📦' : 
                           notification.type === 'promotion' ? '🎉' : 
                           notification.type === 'order' ? '🛍️' : 
                           notification.type === 'top_fan_badge' ? '👑' : '🔔'}
                        </Avatar>
                      </ListItemAvatar>
                    )}
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" component="span" className="customer-notification-icon__drawer-item-title">
                            {getDrawerNotificationTitle(notification)}
                            {!notification.isRead && !isSelectionMode && (
                              <div className="customer-notification-icon__drawer-unread-dot"></div>
                            )}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span" className="customer-notification-icon__drawer-item-message">
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" component="span" className="customer-notification-icon__drawer-item-time">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </Typography>
                          </>
                        }
                      />
                  </ListItem>
                </div>
                ))}
              </List>
            )}
          </div>
        </div>
      </Drawer>

      {showDeleteAllNotification && createPortal(
        <div className="notification-container">
          <div className="notification-wrapper">
            <Notification
              type="confirm"
              title="Delete All Notifications?"
              message={`Are you sure you want to delete all ${notifications.length} notifications? This action cannot be undone.`}
              isVisible={showDeleteAllNotification}
              showConfirmButtons={true}
              onConfirm={handleConfirmDeleteAll}
              onCancel={() => setShowDeleteAllNotification(false)}
              onClose={() => setShowDeleteAllNotification(false)}
            />
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default CustomerNotificationIcon;