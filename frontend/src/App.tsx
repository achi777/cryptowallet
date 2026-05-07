import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import './styles/globals.css';
import './styles/admin.css';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import AdminHome from './pages/admin/AdminHome';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import { RoleGuard } from './components/RoleGuard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/*"
          element={
            <RoleGuard role="ADMIN">
              <AdminHome />
            </RoleGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
