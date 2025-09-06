import React, { useState } from "react";
import { TextField, Button, IconButton, InputAdornment, MenuItem } from "@mui/material";
import { Visibility, VisibilityOff, PersonOutline, Apartment } from "@mui/icons-material";
import "../css/Signup.css";
import logo from "../logos/Icon on dark with text.png";

function Signup() {
  const [activeTab, setActiveTab] = useState("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [category, setCategory] = useState("");

  return (
    <div className="signup-bg">
      <div className="signup-container">
        <div className="signup-form">
          <div className="signup-form-content">
            {/* Icon-only tab switcher with text below */}
            <div className="signup-tabs">
              <div className={`signup-tab-col ${activeTab === "customer" ? "active" : ""}`}>
                <IconButton
                  onClick={() => setActiveTab("customer")}
                  className={`signup-tab-btn ${activeTab === "customer" ? "active" : ""}`}
                >
                  <PersonOutline fontSize="large" />
                </IconButton>
                <span className="signup-tab-label">
                  Customer
                </span>
              </div>
              <div className={`signup-tab-col ${activeTab === "msme" ? "active" : ""}`}>
                <IconButton
                  onClick={() => setActiveTab("msme")}
                  className={`signup-tab-btn ${activeTab === "msme" ? "active" : ""}`}
                >
                  <Apartment fontSize="large" />
                </IconButton>
                <span className="signup-tab-label">
                  MSME
                </span>
              </div>
            </div>
            {/* Customer Signup - Flex Layout */}
            {activeTab === "customer" && (
              <form className="signup-fields">
                <TextField
                  variant="outlined"
                  placeholder="First Name"
                  fullWidth
                  className="signup-input"
                  InputProps={{ classes: { notchedOutline: "input-outline" } }}
                  inputProps={{ className: "signup-input-inner" }}
                />
                <TextField
                  variant="outlined"
                  placeholder="Middle Name (optional)"
                  fullWidth
                  className="signup-input"
                  InputProps={{ classes: { notchedOutline: "input-outline" } }}
                  inputProps={{ className: "signup-input-inner" }}
                />
                <TextField
                  variant="outlined"
                  placeholder="Last Name"
                  fullWidth
                  className="signup-input"
                  InputProps={{ classes: { notchedOutline: "input-outline" } }}
                  inputProps={{ className: "signup-input-inner" }}
                />
                <TextField
                  variant="outlined"
                  placeholder="Email"
                  type="email"
                  fullWidth
                  className="signup-input"
                  InputProps={{ classes: { notchedOutline: "input-outline" } }}
                  inputProps={{ className: "signup-input-inner" }}
                />
                <TextField
                  variant="outlined"
                  placeholder="Contact Number"
                  fullWidth
                  className="signup-input"
                  InputProps={{ classes: { notchedOutline: "input-outline" } }}
                  inputProps={{ className: "signup-input-inner" }}
                />
                <TextField
                  variant="outlined"
                  placeholder="Address"
                  fullWidth
                  className="signup-input"
                  InputProps={{ classes: { notchedOutline: "input-outline" } }}
                  inputProps={{ className: "signup-input-inner" }}
                />
                <TextField
                  variant="outlined"
                  placeholder="Username"
                  fullWidth
                  className="signup-input"
                  InputProps={{ classes: { notchedOutline: "input-outline" } }}
                  inputProps={{ className: "signup-input-inner" }}
                />
                <TextField
                  variant="outlined"
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  className="signup-input"
                  InputProps={{
                    classes: { notchedOutline: "input-outline" },
                   
                  }}
                  inputProps={{ className: "signup-input-inner" }}
                />
                <TextField
                  variant="outlined"
                  placeholder="Confirm Password"
                  type={showConfirm ? "text" : "password"}
                  fullWidth
                  className="signup-input"
                  InputProps={{
                    classes: { notchedOutline: "input-outline" },
                    
                  }}
                  inputProps={{ className: "signup-input-inner" }}
                />
                <hr className="signup-divider" />
                <Button variant="contained" className="signup-btn">
                  SIGN UP
                </Button>
                <p className="text" style={{ marginTop: "10px" }}>
                  Already have an account?{" "}
                  <a href="/login" className="link">
                    LOGIN
                  </a>
                </p>
              </form>
            )}
            {/* MSME Signup - Flex Layout */}
            {activeTab === "msme" && (
              <form className="signup-fields">
                <TextField
                  variant="outlined"
                  placeholder="Client Profiling Number"
                  fullWidth
                  className="signup-input"
                  InputProps={{ classes: { notchedOutline: "input-outline" } }}
                  inputProps={{ className: "signup-input-inner" }}
                />
                <TextField
                  select
                  variant="outlined"
                  label="Category"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  fullWidth
                  className="signup-input"
                  InputProps={{ classes: { notchedOutline: "input-outline" } }}
                  inputProps={{ className: "signup-input-inner" }}
                >
                  <MenuItem value="">Select Category</MenuItem>
                  <MenuItem value="food">Food</MenuItem>
                  <MenuItem value="artisan">Artisan</MenuItem>
                </TextField>
                <TextField
                  variant="outlined"
                  placeholder="Business Name"
                  fullWidth
                  className="signup-input"
                  InputProps={{ classes: { notchedOutline: "input-outline" } }}
                  inputProps={{ className: "signup-input-inner" }}
                />
                <TextField
                  variant="outlined"
                  placeholder="Username"
                  fullWidth
                  className="signup-input"
                  InputProps={{ classes: { notchedOutline: "input-outline" } }}
                  inputProps={{ className: "signup-input-inner" }}
                />
                <TextField
                  variant="outlined"
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  className="signup-input"
                  InputProps={{
                    classes: { notchedOutline: "input-outline" },
                      
                  }}
                  inputProps={{ className: "signup-input-inner" }}
                />
                <TextField
                  variant="outlined"
                  placeholder="Confirm Password"
                  type={showConfirm ? "text" : "password"}
                  fullWidth
                  className="signup-input"
                  InputProps={{
                    classes: { notchedOutline: "input-outline" },

                  }}
                  inputProps={{ className: "signup-input-inner" }}
                />
                <hr className="signup-divider" />
                <Button variant="contained" className="signup-btn">
                  SIGN UP
                </Button>
                <p className="text" style={{ marginTop: "10px" }}>
                  Already have an account?{" "}
                  <a href="/login" className="link">
                 LOGIN
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;