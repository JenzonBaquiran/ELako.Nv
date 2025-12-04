import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

/**
 * Custom hook for handling automatic logout after user inactivity
 * @param {number} timeout - Inactivity timeout in milliseconds (default: 60000ms = 1 minute)
 */
const useInactivityTimeout = (timeout = 60000) => {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);

  // Reset the inactivity timer
  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Only set timer if user is authenticated
    if (isAuthenticated) {
      // Set the logout timer
      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, timeout);
    }
  }, [isAuthenticated, timeout]);

  // Handle automatic logout
  const handleLogout = useCallback(async () => {
    console.log("Auto-logout due to inactivity");

    // Clear timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Perform logout
    await logout();

    // Navigate to login page with message
    navigate("/login", {
      state: {
        message: "You have been logged out due to inactivity.",
        type: "info",
      },
    });
  }, [logout, navigate]);

  // Activity event handler
  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    // Only activate if user is authenticated
    if (!isAuthenticated) {
      // Clear timers when user logs out
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      return;
    }

    // List of events that indicate user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "wheel",
    ];

    // Add event listeners for all activity events
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Set initial timer
    resetTimer();

    // Cleanup function
    return () => {
      // Remove all event listeners
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });

      // Clear timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [isAuthenticated, handleActivity, resetTimer]);

  return {
    resetTimer,
  };
};

export default useInactivityTimeout;
