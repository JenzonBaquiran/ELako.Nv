import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminUserManagement from "./pages/AdminUserManagement";
import MsmeSidebar from "./pages/MsmeSidebar";
import CustomerSidebar from "./pages/CustomerSidebar";
import NotificationProvider from "./components/NotificationProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import InactivityWrapper from "./components/InactivityWrapper";
import MsmeManageProduct from "./pages/MsmeManageProduct";
import MsmeDashboard from "./pages/MsmeDashboard";
import MsmeMessage from "./pages/MsmeMessage";
import MsmeAnalytics from "./pages/MsmeAnalytics";
import MsmeProfile from "./pages/MsmeProfile";
import MsmeReviews from "./pages/MsmeReviews";
import AdminOverview from "./pages/AdminOverview";
import AdminMsmeOversight from "./pages/AdminMsmeOversight";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminSettings from "./pages/AdminSettings";
import BlogManagement from "./pages/admin/BlogManagement";
import MsmeCustomizeDashboard from "./pages/MsmeCustomizeDashboard";
import CustomerViewStore from "./pages/CustomerViewStore";
import CustomerStoreView from "./pages/CustomerStoreView";
import CustomerFavorites from "./pages/CustomerFavorites";
import CustomerReviews from "./pages/CustomerReviews";
import CustomerMessage from "./pages/CustomerMessage";
import CustomerProfile from "./pages/CustomerProfile";
import CustomerNotifications from "./pages/CustomerNotifications";
import CustomerHotPicks from "./pages/CustomerHotPicks";
import CustomerTopStores from "./pages/CustomerTopStores";
import ProductDetails from "./pages/ProductDetails";
import ForgotPassword from "./pages/ForgotPassword";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import AdminMsmeReport from "./pages/AdminMsmeReport";
import TermsPage from "./pages/TermsPage";



function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <InactivityWrapper>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/terms" element={<TermsPage />} />
            
            {/* Admin Protected Routes */}
            <Route 
              path="/admin-user-management" 
              element={
                <ProtectedRoute allowedUserTypes={['admin']}>
                  <AdminUserManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-overview" 
              element={
                <ProtectedRoute allowedUserTypes={['admin']}>
                  <AdminOverview />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-msme-oversight" 
              element={
                <ProtectedRoute allowedUserTypes={['admin']}>
                  <AdminMsmeOversight />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-analytics" 
              element={
                <ProtectedRoute allowedUserTypes={['admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-settings" 
              element={
                <ProtectedRoute allowedUserTypes={['admin']}>
                  <AdminSettings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-blog-management" 
              element={
                <ProtectedRoute allowedUserTypes={['admin']}>
                  <BlogManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-audit-logs" 
              element={
                <ProtectedRoute allowedUserTypes={['admin']}>
                  <AdminAuditLogs />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-msme-reports" 
              element={
                <ProtectedRoute allowedUserTypes={['admin']}>
                  <AdminMsmeReport />
                </ProtectedRoute>
              } 
            />

            {/* MSME Protected Routes */}
            <Route 
              path="/msme-sidebar" 
              element={
                <ProtectedRoute allowedUserTypes={['msme']}>
                  <MsmeSidebar />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/msme-dashboard" 
              element={
                <ProtectedRoute allowedUserTypes={['msme']}>
                  <MsmeDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/msme-manage-product" 
              element={
                <ProtectedRoute allowedUserTypes={['msme']}>
                  <MsmeManageProduct />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/msme-messages" 
              element={
                <ProtectedRoute allowedUserTypes={['msme']}>
                  <MsmeMessage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/msme-analytics" 
              element={
                <ProtectedRoute allowedUserTypes={['msme']}>
                  <MsmeAnalytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/msme-profile" 
              element={
                <ProtectedRoute allowedUserTypes={['msme']}>
                  <MsmeProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/msme-customize-dashboard" 
              element={
                <ProtectedRoute allowedUserTypes={['msme']}>
                  <MsmeCustomizeDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/msme-reviews" 
              element={
                <ProtectedRoute allowedUserTypes={['msme']}>
                  <MsmeReviews />
                </ProtectedRoute>
              } 
            />

            {/* Customer Protected Routes */}
            <Route 
              path="/customer-sidebar" 
              element={
                <ProtectedRoute allowedUserTypes={['customer']}>
                  <CustomerSidebar />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer-view-store" 
              element={
                <ProtectedRoute allowedUserTypes={['customer']}>
                  <CustomerViewStore />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer/stores" 
              element={
                <ProtectedRoute allowedUserTypes={['customer']}>
                  <CustomerViewStore />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer/store/:storeId" 
              element={
                <ProtectedRoute allowedUserTypes={['customer', 'msme', 'admin']}>
                  <CustomerStoreView />
                </ProtectedRoute>
              } 
            />
            {/* Public store viewing route */}
            <Route path="/store/:storeId" element={<CustomerStoreView />} />
            <Route 
              path="/customer-favorites" 
              element={
                <ProtectedRoute allowedUserTypes={['customer']}>
                  <CustomerFavorites />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer-reviews" 
              element={
                <ProtectedRoute allowedUserTypes={['customer']}>
                  <CustomerReviews />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer-message" 
              element={
                <ProtectedRoute allowedUserTypes={['customer']}>
                  <CustomerMessage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer-message/:storeId" 
              element={
                <ProtectedRoute allowedUserTypes={['customer']}>
                  <CustomerMessage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer-profile" 
              element={
                <ProtectedRoute allowedUserTypes={['customer']}>
                  <CustomerProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer-notifications" 
              element={
                <ProtectedRoute allowedUserTypes={['customer']}>
                  <CustomerNotifications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer/hot-picks" 
              element={
                <ProtectedRoute allowedUserTypes={['customer', 'msme', 'admin']}>
                  <CustomerHotPicks />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer/top-stores" 
              element={
                <ProtectedRoute allowedUserTypes={['customer', 'msme', 'admin']}>
                  <CustomerTopStores />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/product/:productId" 
              element={
                <ProtectedRoute allowedUserTypes={['customer', 'msme', 'admin']}>
                  <ProductDetails />
                </ProtectedRoute>
              } 
            />
            {/* Public product viewing route */}
            <Route path="/products/:productId" element={<ProductDetails />} />
          </Routes>
          </InactivityWrapper>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );    
}
export default App;