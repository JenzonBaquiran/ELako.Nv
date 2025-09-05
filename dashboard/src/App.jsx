import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<Home />} />
        {/* Remove <Route path="/navbar" element={<Navbar />} /> */}
      
      </Routes>
    </BrowserRouter>
  );    
}
export default App;