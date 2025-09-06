import React, { useState } from "react";
import { TextField, Button, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom"; // Add this import
import "../css/Login.css";
import logo from "../logos/Icon on dark with text.png";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate(); // Add this line

  return (
    <div className="login-bg">
      <div className="login-container">
        <div className="login-form">
          <div className="login-form-content">
            <div className="logo-container">
              <img src={logo} alt="Logo" className="brand-logo" />
            </div>
            <p className="text">Digital Marketing Solution For The Micro, Small, and Medium Enterprises MSME’s in Nueva Vizcaya</p>
            <TextField
              variant="outlined"
              placeholder="Username"
              fullWidth
              className="login-input"
              InputProps={{
                classes: { notchedOutline: "input-outline" },
              }}
              inputProps={{
                className: "login-input-inner",
              }}
            />
            <TextField
              variant="outlined"
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              className="login-input"
              InputProps={{
                classes: { notchedOutline: "input-outline" }, 
              }}
              inputProps={{
                className: "login-input-inner",
              }}
            />
            <div className="login-links">
              <span
                className="login-link"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/signup")}
              >
                NEW HERE ? SIGN UP
              </span>
              <span className="login-link">FORGOT YOUR PASSWORD?</span>
            </div>
            <hr style={{ margin: "10px 0" }} />
            <Button variant="contained" className="login-btn">
              LOGIN
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;