import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './styles/globals.css';
import './styles/admin.css';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import AdminHome from './pages/admin/AdminHome';
import { RoleGuard } from './components/RoleGuard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        {/* Legacy admin sign-in URL: stale bookmarks redirect to the unified /signin form. */}
        <Route path="/admin/login" element={<Navigate to="/signin" replace />} />
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
