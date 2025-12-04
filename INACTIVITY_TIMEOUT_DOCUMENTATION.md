# Automatic Logout on Inactivity Feature

## Overview

The system now automatically logs out users after **1 minute (60 seconds)** of inactivity. This security feature helps protect user accounts when they step away from their computer without logging out.

## Implementation Date

December 5, 2025

## How It Works

### 1. Activity Detection

The system monitors user activity through the following events:

- Mouse movements (`mousemove`)
- Mouse clicks (`mousedown`, `click`)
- Keyboard input (`keypress`, `keydown`)
- Scrolling (`scroll`, `wheel`)
- Touch events (`touchstart`)

### 2. Inactivity Timer

- When a user logs in, a 1-minute countdown timer starts
- Every time the user performs any of the monitored activities, the timer resets to 1 minute
- If no activity is detected for the full 60 seconds, the user is automatically logged out

### 3. Automatic Logout Process

When the timeout occurs:

1. The user is automatically logged out
2. All session data is cleared (localStorage, sessionStorage)
3. For admin users, a logout audit log is created with session duration
4. The user is redirected to the login page
5. A notification message appears: "You have been logged out due to inactivity."

## Technical Implementation

### Files Created/Modified

#### 1. **New Hook: `useInactivityTimeout.js`**

Location: `dashboard/src/hooks/useInactivityTimeout.js`

This custom React hook manages the inactivity timeout logic:

- Sets up event listeners for user activity
- Manages the timeout timer
- Triggers automatic logout when timeout expires
- Only activates when user is authenticated

```javascript
// Usage
const { resetTimer } = useInactivityTimeout(60000); // 60 seconds
```

#### 2. **New Component: `InactivityWrapper.jsx`**

Location: `dashboard/src/components/InactivityWrapper.jsx`

A wrapper component that:

- Uses the `useInactivityTimeout` hook
- Wraps the entire application to monitor activity globally
- Set to 60000ms (1 minute) timeout

#### 3. **Modified: `App.jsx`**

Location: `dashboard/src/App.jsx`

Changes:

- Imported `InactivityWrapper` component
- Wrapped the `<BrowserRouter>` with `<InactivityWrapper>`
- This ensures all routes are monitored for user activity

```jsx
<AuthProvider>
  <NotificationProvider>
    <InactivityWrapper>
      <BrowserRouter>{/* All routes */}</BrowserRouter>
    </InactivityWrapper>
  </NotificationProvider>
</AuthProvider>
```

#### 4. **Modified: `Login.jsx`**

Location: `dashboard/src/pages/Login.jsx`

Changes:

- Added useEffect to display inactivity logout message
- Shows "Session Expired" notification when user is redirected after timeout

### Activity Events Monitored

| Event Type   | Description                  |
| ------------ | ---------------------------- |
| `mousedown`  | User clicks mouse button     |
| `mousemove`  | User moves mouse cursor      |
| `keypress`   | User presses a key           |
| `keydown`    | User presses any key down    |
| `scroll`     | User scrolls the page        |
| `touchstart` | User touches screen (mobile) |
| `click`      | User clicks an element       |
| `wheel`      | User uses mouse wheel        |

## User Experience

### For All User Types (Admin, MSME, Customer)

1. **Active Session**: As long as the user is actively using the system, they stay logged in
2. **Inactive Session**: If the user stops interacting for 1 minute:
   - Automatic logout occurs
   - Redirected to login page
   - Notification: "You have been logged out due to inactivity."
3. **Re-login**: User can immediately log back in

### For Admin Users

- Logout is recorded in the audit logs with session duration
- Same audit logging as manual logout

## Security Benefits

1. **Prevents Unauthorized Access**: If a user forgets to log out, the session expires automatically
2. **Protects Sensitive Data**: Especially important for admin and MSME accounts
3. **Compliance**: Helps meet security best practices for timeout policies
4. **Multi-tab Support**: Works across browser tabs

## Configuration

The timeout duration is set in `InactivityWrapper.jsx`:

```javascript
// Current setting: 1 minute (60000 milliseconds)
useInactivityTimeout(60000);

// To change timeout duration, modify this value:
// 2 minutes: 120000
// 5 minutes: 300000
// 10 minutes: 600000
```

## Testing the Feature

### Manual Test Steps

1. Log in as any user type (admin, MSME, or customer)
2. Navigate to any page in the application
3. Stop all mouse, keyboard, and touch interaction
4. Wait for 60 seconds
5. Verify automatic logout occurs
6. Verify redirection to login page with message
7. Verify message: "You have been logged out due to inactivity."

### Activity Test

1. Log in to the application
2. Every 30-45 seconds, perform an action (move mouse, click, type, scroll)
3. Verify you remain logged in beyond the 1-minute threshold
4. This confirms the timer resets with activity

## Known Behaviors

### What Resets the Timer

- Any mouse movement or click
- Any keyboard input
- Scrolling the page
- Touch interactions (mobile)

### What Does NOT Reset the Timer

- Network requests in the background
- Timer/interval functions running
- Video/audio playback
- Automated processes

## Troubleshooting

### User Logs Out Too Quickly

- Check if timeout value is set correctly (should be 60000ms)
- Verify event listeners are attached properly
- Check browser console for errors

### User Does NOT Log Out

- Verify `InactivityWrapper` is wrapping the routes
- Check if user is authenticated
- Verify hook is running (check console logs if added)

### Message Not Displaying

- Check Login.jsx useEffect for message handling
- Verify navigate state includes message object
- Check NotificationProvider is working

## Future Enhancements

Potential improvements:

1. **Warning Before Logout**: Show a countdown warning 10-15 seconds before logout
2. **Configurable Timeout**: Allow different timeout values per user type
3. **Remember Activity**: Store last activity timestamp in case of page refresh
4. **Activity Dashboard**: Show admins when users were auto-logged out
5. **Extend Session Dialog**: Allow users to extend their session before timeout

## API Integration

The inactivity logout uses the existing logout API:

- **Admin**: `POST /api/admin/logout`
- Logs session duration in audit logs
- Clears all session data

## Code Quality

### Best Practices Followed

- ✅ Custom hook for reusability
- ✅ Proper cleanup of event listeners
- ✅ Passive event listeners for performance
- ✅ Only monitors when authenticated
- ✅ Clears timers on unmount
- ✅ Uses useCallback for stable references
- ✅ Handles all user types uniformly

## Maintenance Notes

### When Adding New Routes

No additional configuration needed - all routes are automatically monitored through the wrapper.

### When Modifying Authentication

Ensure the `isAuthenticated` state in AuthContext properly reflects login status.

### Performance Considerations

- Event listeners use `{ passive: true }` for better performance
- Timers are cleared when user logs out
- No unnecessary re-renders

## Support

For issues or questions about the inactivity timeout feature, check:

1. Browser console for errors
2. AuthContext state in React DevTools
3. Event listener attachment in Elements panel
4. Network tab for logout API calls
