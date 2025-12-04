import React, { useState } from "react";
import { TextField, Button, IconButton, InputAdornment, MenuItem, Alert, CircularProgress } from "@mui/material";
import { Visibility, VisibilityOff, PersonOutline, Apartment } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import TermsAgreementModal from "../components/TermsAgreementModal";
import PasswordStrengthIndicator from "../components/PasswordStrengthIndicator";
import "../css/Signup.css";
import logo from "../logos/Icon on dark with text.png";

function Signup() {
  const [activeTab, setActiveTab] = useState("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);
  const navigate = useNavigate();

  // Validation states
  const [customerValidation, setCustomerValidation] = useState({});
  const [msmeValidation, setMsmeValidation] = useState({});
  const [touched, setTouched] = useState({});

  // Customer form state
  const [customerData, setCustomerData] = useState({
    firstname: "",
    middlename: "",
    lastname: "",
    email: "",
    contactNumber: "",
    address: "",
    username: "",
    password: "",
    confirmPassword: ""
  });

  // MSME form state
  const [msmeData, setMsmeData] = useState({
    clientProfilingNumber: "",
    category: "",
    businessName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    tinNumber: ""
  });

  // Certificate files state
  const [certificateFiles, setCertificateFiles] = useState({
    mayorsPermit: null,
    bir: null,
    dti: null
  });

  const handleCustomerChange = (field, value) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (customerValidation[field]) {
      setCustomerValidation(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleMsmeChange = (field, value) => {
    setMsmeData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (msmeValidation[field]) {
      setMsmeValidation(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleFileChange = (certificateType, file) => {
    setCertificateFiles(prev => ({ ...prev, [certificateType]: file }));
  };

  // Password strength validation function
  const isPasswordStrong = (password) => {
    if (!password || password.length < 8) return false;
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    // Require at least 3 out of 4 criteria for strong password
    const criteriaCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    return criteriaCount >= 3;
  };

  // Enhanced validation functions with detailed messaging
  const validateCustomerForm = () => {
    const errors = {};
    
    // Check all required fields with detailed messages
    if (!customerData.firstname?.trim()) 
      errors.firstname = "First name is required. Please enter your first name to proceed with registration.";
    if (!customerData.lastname?.trim()) 
      errors.lastname = "Last name is required. Please enter your last name to complete your profile.";
    if (!customerData.email?.trim()) {
      errors.email = "Email address is required for account verification and communication.";
    } else if (!/\S+@\S+\.\S+/.test(customerData.email)) {
      errors.email = "Please enter a valid email address format (e.g., user@example.com).";
    }
    if (!customerData.contactNumber?.trim()) 
      errors.contactNumber = "Contact number is required for order updates and customer service communication.";
    if (!customerData.address?.trim()) 
      errors.address = "Address is required for delivery and verification purposes.";
    if (!customerData.username?.trim()) 
      errors.username = "Username is required. Please create a unique username for your account.";
    if (!customerData.password?.trim()) {
      errors.password = "Password is required for account security. Please create a strong password.";
    } else if (!isPasswordStrong(customerData.password)) {
      errors.password = "Password is too weak. Please create a stronger password with at least 8 characters including uppercase, lowercase, numbers, and special characters.";
    }
    if (!customerData.confirmPassword?.trim()) {
      errors.confirmPassword = "Please confirm your password by typing it again.";
    } else if (customerData.password !== customerData.confirmPassword) {
      errors.confirmPassword = "Password confirmation does not match. Please ensure both passwords are identical.";
    }
    
    return errors;
  };

  const validateMsmeForm = () => {
    const errors = {};
    
    // Business information validation
    if (!msmeData.clientProfilingNumber?.trim()) 
      errors.clientProfilingNumber = "Client profiling number is required for business verification. Please enter your DTI/SEC registration number.";
    if (!msmeData.category) 
      errors.category = "Business category must be selected. Please choose whether you're in Food or Artisan category.";
    if (!msmeData.businessName?.trim()) 
      errors.businessName = "Business name is required. Please enter your official registered business name.";
    if (!msmeData.email?.trim()) {
      errors.email = "Business email address is required for official communication and order notifications.";
    } else if (!/\S+@\S+\.\S+/.test(msmeData.email)) {
      errors.email = "Please enter a valid business email address format (e.g., business@company.com).";
    }
    if (!msmeData.username?.trim()) 
      errors.username = "Username is required. Please create a unique username for your business account.";
    if (!msmeData.tinNumber?.trim()) 
      errors.tinNumber = "TIN number is required for tax compliance and business verification.";
    if (!msmeData.password?.trim()) {
      errors.password = "Password is required for account security. Please create a strong password.";
    } else if (!isPasswordStrong(msmeData.password)) {
      errors.password = "Password is too weak. Please create a stronger password with at least 8 characters including uppercase, lowercase, numbers, and special characters.";
    }
    if (!msmeData.confirmPassword?.trim()) {
      errors.confirmPassword = "Please confirm your password by typing it again.";
    } else if (msmeData.password !== msmeData.confirmPassword) {
      errors.confirmPassword = "Password confirmation does not match. Please ensure both passwords are identical.";
    }
    
    // Certificate validation with detailed messages
    if (!certificateFiles.mayorsPermit) 
      errors.mayorsPermit = "Mayor's Permit is required for business operation. Please upload your valid Mayor's Permit certificate.";
    if (!certificateFiles.bir) 
      errors.bir = "BIR Certificate is required for tax compliance. Please upload your Bureau of Internal Revenue certificate.";
    if (!certificateFiles.dti) 
      errors.dti = "DTI Certificate is required for food/health products. Please upload your Department of Trade and Industry certificate.";
    
    return errors;
  };

  const clearCustomerForm = () => {
    setCustomerData({
      firstname: "",
      middlename: "",
      lastname: "",
      email: "",
      contactNumber: "",
      address: "",
      username: "",
      password: "",
      confirmPassword: ""
    });
  };

  const clearMsmeForm = () => {
    setMsmeData({
      clientProfilingNumber: "",
      category: "",
      businessName: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      tinNumber: ""
    });
    setCertificateFiles({
      mayorsPermit: null,
      bir: null,
      dti: null
    });
  };

  const handleTermsAgreed = () => {
    if (pendingSubmit === 'customer') {
      processCustomerSubmit();
    } else if (pendingSubmit === 'msme') {
      processMsmeSubmit();
    }
    setPendingSubmit(null);
  };

  const handleTermsClosed = () => {
    setShowTermsModal(false);
    setPendingSubmit(null);
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate form with enhanced messaging
    const validationErrors = validateCustomerForm();
    setCustomerValidation(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const missingFields = Object.keys(validationErrors).length;
      setError(
        `Please complete all required fields to proceed with registration. ` +
        `You have ${missingFields} field${missingFields > 1 ? 's' : ''} that need${missingFields > 1 ? '' : 's'} attention. ` +
        `All information is required to create your account and ensure proper service delivery.`
      );
      return;
    }

    // Show terms modal before proceeding
    setPendingSubmit('customer');
    setShowTermsModal(true);
  };

  const processCustomerSubmit = async () => {
    setLoading(true);

    try {
      const { confirmPassword, ...submitData } = customerData;
      const response = await fetch("http://localhost:1337/api/customers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Customer registration successful! You can now login.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(data.error || data.errors?.join(", ") || "Registration failed");
        clearCustomerForm();
        setShowTermsModal(false);
      }
    } catch (error) {
      setError("Network error. Please try again.");
      clearCustomerForm();
      setShowTermsModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleMsmeSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate form with enhanced messaging
    const validationErrors = validateMsmeForm();
    setMsmeValidation(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const fieldErrors = Object.keys(validationErrors).filter(key => !['mayorsPermit', 'bir', 'dti'].includes(key));
      const certErrors = Object.keys(validationErrors).filter(key => ['mayorsPermit', 'bir', 'dti'].includes(key));
      
      let errorMessage = "Please complete all required information to proceed with business registration. ";
      
      if (fieldErrors.length > 0) {
        errorMessage += `You have ${fieldErrors.length} business information field${fieldErrors.length > 1 ? 's' : ''} that need${fieldErrors.length > 1 ? '' : 's'} attention. `;
      }
      
      if (certErrors.length > 0) {
        errorMessage += `Additionally, ${certErrors.length} required certificate${certErrors.length > 1 ? 's are' : ' is'} missing. `;
        errorMessage += "All business certificates are mandatory for verification and compliance with local regulations. ";
      }
      
      errorMessage += "Please complete all fields and upload all required certificates to enable your business registration.";
      
      setError(errorMessage);
      return;
    }

    // Show terms modal before proceeding
    setPendingSubmit('msme');
    setShowTermsModal(true);
  };

  const processMsmeSubmit = async () => {
    setLoading(true);

    try {
      const formData = new FormData();
      
      // Add all MSME data except confirmPassword
      const { confirmPassword, ...submitData } = msmeData;
      Object.keys(submitData).forEach(key => {
        formData.append(key, submitData[key]);
      });

      // Add certificate files
      Object.keys(certificateFiles).forEach(key => {
        if (certificateFiles[key]) {
          formData.append(key, certificateFiles[key]);
        }
      });

      const response = await fetch("http://localhost:1337/api/msme/register", {
        method: "POST",
        body: formData, // Send as FormData instead of JSON
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("MSME registration successful! Please wait for admin approval.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(data.error || data.errors?.join(", ") || "Registration failed");
        clearMsmeForm();
        setShowTermsModal(false);
      }
    } catch (error) {
      setError("Network error. Please try again.");
      clearMsmeForm();
      setShowTermsModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-bg">
      <div className="signup-container">
        <div className="signup-form">
          <div className="signup-form-content">
            {/* Tab switcher */}
            <div className="signup-tabs">
              <div className={`signup-tab-col ${activeTab === "customer" ? "active" : ""}`}>
                <IconButton
                  onClick={() => setActiveTab("customer")}
                  className={`signup-tab-btn ${activeTab === "customer" ? "active" : ""}`}
                  disabled={loading}
                >
                  <PersonOutline fontSize="large" />
                </IconButton>
                <span className="signup-tab-label">CUSTOMER</span>
              </div>
              <div className={`signup-tab-col ${activeTab === "msme" ? "active" : ""}`}>
                <IconButton
                  onClick={() => setActiveTab("msme")}
                  className={`signup-tab-btn ${activeTab === "msme" ? "active" : ""}`}
                  disabled={loading}
                >
                  <Apartment fontSize="large" />
                </IconButton>
                <span className="signup-tab-label">MSME</span>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <Alert severity="error" style={{ marginBottom: "16px" }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" style={{ marginBottom: "16px" }}>
                {success}
              </Alert>
            )}

            {/* Customer Signup */}
            {activeTab === "customer" && (
              <form className="signup-fields" onSubmit={handleCustomerSubmit}>
                <TextField
                  name="firstname"
                  variant="outlined"
                  placeholder="First Name"
                  value={customerData.firstname}
                  onChange={(e) => handleCustomerChange("firstname", e.target.value)}
                  fullWidth
                  className="signup-input"
                  required
                  disabled={loading}
                  error={!!customerValidation.firstname}
                  helperText={customerValidation.firstname}
                />
                <TextField
                  name="middlename"
                  variant="outlined"
                  placeholder="Middle Name (optional)"
                  value={customerData.middlename}
                  onChange={(e) => handleCustomerChange("middlename", e.target.value)}
                  fullWidth
                  className="signup-input"
                  disabled={loading}
                />
                <TextField
                  name="lastname"
                  variant="outlined"
                  placeholder="Last Name"
                  value={customerData.lastname}
                  onChange={(e) => handleCustomerChange("lastname", e.target.value)}
                  fullWidth
                  className="signup-input"
                  required
                  disabled={loading}
                  error={!!customerValidation.lastname}
                  helperText={customerValidation.lastname}
                />
                <TextField
                  name="email"
                  variant="outlined"
                  placeholder="Email"
                  type="email"
                  value={customerData.email}
                  onChange={(e) => handleCustomerChange("email", e.target.value)}
                  fullWidth
                  className="signup-input"
                  required
                  disabled={loading}
                  error={!!customerValidation.email}
                  helperText={customerValidation.email}
                />
                <TextField
                  name="contactNumber"
                  variant="outlined"
                  placeholder="Contact Number"
                  value={customerData.contactNumber}
                  onChange={(e) => handleCustomerChange("contactNumber", e.target.value)}
                  fullWidth
                  className="signup-input"
                  required
                  disabled={loading}
                  error={!!customerValidation.contactNumber}
                  helperText={customerValidation.contactNumber}
                />
                <TextField
                  name="address"
                  variant="outlined"
                  placeholder="Address"
                  value={customerData.address}
                  onChange={(e) => handleCustomerChange("address", e.target.value)}
                  fullWidth
                  className="signup-input"
                  required
                  disabled={loading}
                  error={!!customerValidation.address}
                  helperText={customerValidation.address}
                />
                <TextField
                  name="username"
                  variant="outlined"
                  placeholder="Username"
                  value={customerData.username}
                  onChange={(e) => handleCustomerChange("username", e.target.value)}
                  fullWidth
                  className="signup-input"
                  required
                  disabled={loading}
                  error={!!customerValidation.username}
                  helperText={customerValidation.username}
                />
                <TextField
                  name="password"
                  variant="outlined"
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={customerData.password}
                  onChange={(e) => handleCustomerChange("password", e.target.value)}
                  fullWidth
                  className="signup-input"
                  required
                  disabled={loading}
                  error={!!customerValidation.password}
                  helperText={customerValidation.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          disabled={loading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <PasswordStrengthIndicator password={customerData.password} />
                <TextField
                  name="confirmPassword"
                  variant="outlined"
                  placeholder="Confirm Password"
                  type={showConfirm ? "text" : "password"}
                  value={customerData.confirmPassword}
                  onChange={(e) => handleCustomerChange("confirmPassword", e.target.value)}
                  fullWidth
                  className="signup-input"
                  required
                  disabled={loading}
                  error={!!customerValidation.confirmPassword}
                  helperText={customerValidation.confirmPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirm(!showConfirm)}
                          edge="end"
                          disabled={loading}
                        >
                          {showConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <hr className="signup-divider" />
                <Button 
                  type="submit"
                  variant="contained" 
                  className="signup-btn"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {loading ? "SIGNING UP..." : "SIGN UP"}
                </Button>
                <p className="text" style={{ marginTop: "10px" }}>
                  Already have an account?{" "}
                  <a href="/login" className="link">
                    LOGIN
                  </a>
                </p>
                <p className="text" style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
                  By signing up, you agree to our{" "}
                  <span 
                    className="link" 
                    onClick={() => setShowTermsModal(true)}
                    style={{ cursor: "pointer", textDecoration: "underline", color: "#4CAF50" }}
                  >
                    Terms and Agreement
                  </span>
                </p>
              </form>
            )}

            {/* MSME Signup */}
            {activeTab === "msme" && (
              <form className="signup-fields" onSubmit={handleMsmeSubmit}>
                <TextField
                  name="clientProfilingNumber"
                  variant="outlined"
                  placeholder="Client Profiling Number"
                  value={msmeData.clientProfilingNumber}
                  onChange={(e) => handleMsmeChange("clientProfilingNumber", e.target.value)}
                  fullWidth
                  className="signup-input"
                  required
                  disabled={loading}
                  error={!!msmeValidation.clientProfilingNumber}
                  helperText={msmeValidation.clientProfilingNumber}
                />
                <TextField
                  name="category"
                  select
                  variant="outlined"
                  label="Category"
                  value={msmeData.category}
                  onChange={(e) => handleMsmeChange("category", e.target.value)}
                  fullWidth
                  className="signup-input"
                  required
                  disabled={loading}
                  error={!!msmeValidation.category}
                  helperText={msmeValidation.category}
                >
                  <MenuItem value="">Select Category</MenuItem>
                  <MenuItem value="food">Food</MenuItem>
                  <MenuItem value="artisan">Artisan</MenuItem>
                </TextField>
                <TextField
                  name="businessName"
                  variant="outlined"
                  placeholder="Business Name"
                  value={msmeData.businessName}
                  onChange={(e) => handleMsmeChange("businessName", e.target.value)}
                  fullWidth
                  className="signup-input"
                  required
                  disabled={loading}
                  error={!!msmeValidation.businessName}
                  helperText={msmeValidation.businessName}
                />
                <TextField
                  name="email"
                  variant="outlined"
                  placeholder="Email"
                  type="email"
                  value={msmeData.email}
                  onChange={(e) => handleMsmeChange("email", e.target.value)}
                  fullWidth
                  className="signup-input"
                  required
                  disabled={loading}
                  error={!!msmeValidation.email}
                  helperText={msmeValidation.email}
                />
                <TextField
                  name="username"
                  variant="outlined"
                  placeholder="Username"
                  value={msmeData.username}
                  onChange={(e) => handleMsmeChange("username", e.target.value)}
                  fullWidth
                  className="signup-input"
                  required
                  disabled={loading}
                  error={!!msmeValidation.username}
                  helperText={msmeValidation.username}
                />
                <TextField
                  name="tinNumber"
                  variant="outlined"
                  placeholder="TIN Number"
                  value={msmeData.tinNumber}
                  onChange={(e) => handleMsmeChange("tinNumber", e.target.value)}
                  fullWidth
                  className="signup-input"
                  required
                  disabled={loading}
                  error={!!msmeValidation.tinNumber}
                  helperText={msmeValidation.tinNumber}
                />
                
                {/* Certificate Upload Section */}
                <div className="certificate-upload-section">
                  <h4 className="certificate-section-title">Business Certificates</h4>
                  
                  <div className="file-upload-group">
                    <label className="file-upload-label">
                      Mayor's Permit *
                      <input
                        type="file"
                        name="mayorsPermit"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange("mayorsPermit", e.target.files[0])}
                        className="file-upload-input"
                        disabled={loading}
                        required
                      />
                      <span className={`file-upload-custom ${msmeValidation.mayorsPermit ? 'error' : ''}`}>
                        {certificateFiles.mayorsPermit ? certificateFiles.mayorsPermit.name : "Choose file"}
                      </span>
                      {msmeValidation.mayorsPermit && (
                        <div className="field-error">{msmeValidation.mayorsPermit}</div>
                      )}
                    </label>
                  </div>

                  <div className="file-upload-group">
                    <label className="file-upload-label">
                      BIR Certificate *
                      <input
                        type="file"
                        name="bir"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange("bir", e.target.files[0])}
                        className="file-upload-input"
                        disabled={loading}
                        required
                      />
                      <span className={`file-upload-custom ${msmeValidation.bir ? 'error' : ''}`}>
                        {certificateFiles.bir ? certificateFiles.bir.name : "Choose file"}
                      </span>
                      {msmeValidation.bir && (
                        <div className="field-error">{msmeValidation.bir}</div>
                      )}
                    </label>
                  </div>

                  <div className="file-upload-group">
                    <label className="file-upload-label">
                      DTI Certificate *
                      <input
                        type="file"
                        name="dti"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange("dti", e.target.files[0])}
                        className="file-upload-input"
                        disabled={loading}
                        required
                      />
                      <span className={`file-upload-custom ${msmeValidation.dti ? 'error' : ''}`}>
                        {certificateFiles.dti ? certificateFiles.dti.name : "Choose file"}
                      </span>
                      {msmeValidation.dti && (
                        <div className="field-error">{msmeValidation.dti}</div>
                      )}
                    </label>
                  </div>
                </div>
                <TextField
                  name="password"
                  variant="outlined"
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={msmeData.password}
                  onChange={(e) => handleMsmeChange("password", e.target.value)}
                  fullWidth
                  className="signup-input"
                  required
                  disabled={loading}
                  error={!!msmeValidation.password}
                  helperText={msmeValidation.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          disabled={loading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <PasswordStrengthIndicator password={msmeData.password} />
                <TextField
                  name="confirmPassword"
                  variant="outlined"
                  placeholder="Confirm Password"
                  type={showConfirm ? "text" : "password"}
                  value={msmeData.confirmPassword}
                  onChange={(e) => handleMsmeChange("confirmPassword", e.target.value)}
                  fullWidth
                  className="signup-input"
                  required
                  disabled={loading}
                  error={!!msmeValidation.confirmPassword}
                  helperText={msmeValidation.confirmPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirm(!showConfirm)}
                          edge="end"
                          disabled={loading}
                        >
                          {showConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <hr className="signup-divider" />
                <Button 
                  type="submit"
                  variant="contained" 
                  className="signup-btn"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {loading ? "SIGNING UP..." : "SIGN UP"}
                </Button>
                <p className="text" style={{ marginTop: "10px" }}>
                  Already have an account?{" "}
                  <a href="/login" className="link">
                    LOGIN
                  </a>
                </p>
                <p className="text" style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
                  By signing up, you agree to our{" "}
                  <span 
                    className="link" 
                    onClick={() => setShowTermsModal(true)}
                    style={{ cursor: "pointer", textDecoration: "underline", color: "#4CAF50" }}
                  >
                    Terms and Agreement
                  </span>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Terms and Agreement Modal */}
      <TermsAgreementModal
        open={showTermsModal}
        onClose={handleTermsClosed}
        onAgree={handleTermsAgreed}
        userType={activeTab}
      />
    </div>
  );
}

export default Signup;