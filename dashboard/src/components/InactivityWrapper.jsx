import React from 'react';
import useInactivityTimeout from '../hooks/useInactivityTimeout';

/**
 * Wrapper component that handles automatic logout on user inactivity
 * This component should wrap the main app content to monitor user activity
 */
const InactivityWrapper = ({ children }) => {
  // Initialize inactivity timeout (60000ms = 1 minute)
  useInactivityTimeout(60000);

  return <>{children}</>;
};

export default InactivityWrapper;
