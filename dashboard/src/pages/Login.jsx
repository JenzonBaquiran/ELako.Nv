import React, { useState, useEffect } from "react";
import { TextField, Button, Alert, CircularProgress, InputAdornment, IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useNotification } from "../components/NotificationProvider";
import { useAuth } from "../contexts/AuthContext";
import "../css/Login.css";
import logo from "../logos/Icon on bright with text.png";

function Login() {
  const { showError, showSuccess } = useNotification();
  const { login, isAuthenticated, userType } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Define restricted usernames that should have login restrictions
  const restrictedUsernames = ['admin', 'superuser', 'administrator'];

  // Check if current username is restricted
  const isRestrictedUser = (username) => {
    return restrictedUsernames.includes(username.toLowerCase());
  };

  // Load login attempts from localStorage on component mount
  useEffect(() => {
    if (!username || !isRestrictedUser(username)) {
      // Clear any existing blocks if user is not restricted
      setIsBlocked(false);
      setCooldownTime(0);
      setAttempts(0);
      return;
    }

    const storageKey = `loginAttempts_${username}`;
    const blockTimeKey = `loginBlockTime_${username}`;
    const storedAttempts = localStorage.getItem(storageKey);
    const storedBlockTime = localStorage.getItem(blockTimeKey);
    
    if (storedAttempts) {
      setAttempts(parseInt(storedAttempts));
    }
    
    if (storedBlockTime) {
      const blockTime = parseInt(storedBlockTime);
      const now = Date.now();
      
      if (now < blockTime) {
        setIsBlocked(true);
        setCooldownTime(Math.ceil((blockTime - now) / 1000));
        
        // Start countdown
        const interval = setInterval(() => {
          setCooldownTime(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setIsBlocked(false);
              setAttempts(0);
              localStorage.removeItem(storageKey);
              localStorage.removeItem(blockTimeKey);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => clearInterval(interval);
      } else {
        // Block time has expired, reset
        setAttempts(0);
        localStorage.removeItem(storageKey);
        localStorage.removeItem(blockTimeKey);
      }
    }
  }, [username]);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || getDefaultRoute(userType);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, userType, navigate, location]);

  // Display inactivity message if present
  useEffect(() => {
    if (location.state?.message) {
      const messageType = location.state?.type || 'info';
      if (messageType === 'info') {
        showError(location.state.message, "Session Expired");
      }
      // Clear the message from location state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname, showError]);

  const getDefaultRoute = (type) => {
    switch (type) {
      case 'admin':
        return '/admin-overview';
      case 'msme':
        return '/msme-dashboard';
      case 'customer':
        return '/';
      default:
        return '/';
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Check if user is blocked (only for restricted usernames)
    if (isBlocked && isRestrictedUser(username)) {
      showError(`Too many failed attempts. Please wait ${cooldownTime} seconds before trying again.`, "Login Blocked");
      return;
    }
    
    setLoading(true);
    setError("");

    // First show validating data message
    setValidating(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay for validation
    setValidating(false);

    try {
      // Try admin login first
      let response = await fetch("http://localhost:1337/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      let data = await response.json();

      if (data.success) {
        const loginSuccess = login(data.user, 'admin');
        if (loginSuccess) {
          // Reset login attempts on successful login
          setAttempts(0);
          const storageKey = `loginAttempts_${username}`;
          const blockTimeKey = `loginBlockTime_${username}`;
          localStorage.removeItem(storageKey);
          localStorage.removeItem(blockTimeKey);
          
          // Track admin login time for audit logging
          sessionStorage.setItem('adminLoginTime', Date.now().toString());
          
          showSuccess("Welcome back, Admin!", "Login Successful");
          const from = location.state?.from?.pathname || '/admin-user-management';
          navigate(from, { replace: true });
          return;
        }
      }

      // Try customer login
      response = await fetch("http://localhost:1337/api/customers/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      data = await response.json();

          if (data.success) {
            const loginSuccess = login(data.user, 'customer');
            if (loginSuccess) {
              // Reset login attempts on successful login
              setAttempts(0);
              const storageKey = `loginAttempts_${username}`;
              const blockTimeKey = `loginBlockTime_${username}`;
              localStorage.removeItem(storageKey);
              localStorage.removeItem(blockTimeKey);          showSuccess("Welcome back! Let's get started.", "Login Successful");
          const from = location.state?.from?.pathname || '/customer-sidebar';
          navigate(from, { replace: true });
          return;
        }
      }

      // Try MSME login
      response = await fetch("http://localhost:1337/api/msme/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      data = await response.json();

      if (data.success) {
        // Check if MSME is approved
        if (data.user.status === "approved") {
          const loginSuccess = login(data.user, 'msme');
          if (loginSuccess) {
            // Reset login attempts on successful login
            setAttempts(0);
            const storageKey = `loginAttempts_${username}`;
            const blockTimeKey = `loginBlockTime_${username}`;
            localStorage.removeItem(storageKey);
            localStorage.removeItem(blockTimeKey);
            
            // Clear congratulation status for today so it can show after login
            localStorage.removeItem(`topStoreCongratulation_${data.user._id}`);
            
            showSuccess("Login successful! Welcome back.", "Welcome");
            const from = location.state?.from?.pathname || '/msme-dashboard';
            navigate(from, { replace: true });
            return;
          }
        } else if (data.user.status === "pending") {
          showError("Your account is pending approval. Please wait for admin approval.", "Account Pending");
        } else if (data.user.status === "rejected") {
          showError("Your account has been rejected. Please contact support.", "Account Rejected");
        }
        return;
      }

      // If all login attempts fail
      // Only apply restrictions to specific usernames
      if (isRestrictedUser(username)) {
        const storageKey = `loginAttempts_${username}`;
        const blockTimeKey = `loginBlockTime_${username}`;
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem(storageKey, newAttempts.toString());
        
        if (newAttempts >= 3) {
          // Block for 1 minute (60 seconds)
          const blockTime = Date.now() + 60000;
          localStorage.setItem(blockTimeKey, blockTime.toString());
          setIsBlocked(true);
          setCooldownTime(60);
          
          // Start countdown
          const interval = setInterval(() => {
            setCooldownTime(prev => {
              if (prev <= 1) {
                clearInterval(interval);
                setIsBlocked(false);
                setAttempts(0);
                localStorage.removeItem(storageKey);
                localStorage.removeItem(blockTimeKey);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          showError(`Too many failed attempts for ${username}. You are blocked for 1 minute.`, "Login Blocked");
        } else {
          const remainingAttempts = 3 - newAttempts;
          showError(`Invalid username or password. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`, "Login Failed");
        }
      } else {
        // For non-restricted usernames, just show error without blocking
        showError("Invalid username or password. Please try again.", "Login Failed");
      }

    } catch (error) {
      console.error("Login error:", error);
      showError("Network error. Please try again.", "Connection Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-container">
        <div className="login-form">
          <div className="login-form-content">
            <div className="logo-container">
              <img 
                src={logo} 
                alt="Logo" 
                className="brand-logo" 
                onClick={() => navigate('/')}
                style={{ cursor: 'pointer' }}
              />
            </div>
            <p className="text">Digital Marketing Solution For The Micro, Small, and Medium Enterprises MSME's in Nueva Vizcaya</p>
            
            {error && (
              <Alert severity="error" style={{ marginBottom: "16px" }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleLogin}>
              <TextField
                variant="outlined"
                placeholder={(isBlocked && isRestrictedUser(username)) ? `Login blocked - ${cooldownTime}s remaining` : "Username"}
                value={(isBlocked && isRestrictedUser(username)) ? `Blocked for ${cooldownTime} seconds` : username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
                className="login-input"
                InputProps={{
                  classes: { notchedOutline: "input-outline" },
                  readOnly: isBlocked && isRestrictedUser(username),
                }}
                inputProps={{
                  className: "login-input-inner",
                  style: { textAlign: (isBlocked && isRestrictedUser(username)) ? 'center' : 'left', color: (isBlocked && isRestrictedUser(username)) ? '#ff6b6b' : 'inherit' }
                }}
                required
                disabled={loading || (isBlocked && isRestrictedUser(username))}
              />
              <TextField
                variant="outlined"
                placeholder={(isBlocked && isRestrictedUser(username)) ? "Password field disabled" : "Password"}
                type={showPassword ? "text" : "password"}
                value={(isBlocked && isRestrictedUser(username)) ? "" : password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                className="login-input"
                InputProps={{
                  classes: { notchedOutline: "input-outline" },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={loading || (isBlocked && isRestrictedUser(username))}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  readOnly: isBlocked && isRestrictedUser(username),
                }}
                inputProps={{
                  className: "login-input-inner",
                  style: { color: (isBlocked && isRestrictedUser(username)) ? '#ccc' : 'inherit' }
                }}
                required
                disabled={loading || (isBlocked && isRestrictedUser(username))}
              />
              <div className="login-links">
                <span
                  className="login-link"
                  style={{ 
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.5 : 1 
                  }}
                  onClick={() => !loading && navigate("/signup")}
                >
                 New here ? Sign Up
                </span>
                <span 
                  className="login-link"
                  style={{ 
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.5 : 1 
                  }}
                  onClick={() => !loading && navigate("/forgot-password")}
                >
                  Forgot Password?
                </span>
              </div>
              <hr style={{ margin: "10px 0" }} />
              
              {/* Loading circle above button */}
              {loading && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  marginBottom: '10px'
                }}>
                  <CircularProgress size={30} style={{ color: '#313131' }} />
                </div>
              )}
              
              <Button 
                type="submit"
                variant="contained" 
                className="login-btn"
                disabled={loading}
              >
                LOGIN
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;