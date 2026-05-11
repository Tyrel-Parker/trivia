import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Nav from './components/Nav';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import FactDetail from './pages/FactDetail';
import Dismissed from './pages/Dismissed';
import FactList from './pages/FactList';
import FactForm from './pages/FactForm';
import ProfileList from './pages/ProfileList';
import ProfileDetail from './pages/ProfileDetail';

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export default function App() {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  function login(token, userData) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/facts/:id" element={<FactDetail />} />
          <Route path="/dismissed" element={<Dismissed />} />
          <Route path="/" element={<ProtectedRoute><Navigate to="/facts" replace /></ProtectedRoute>} />
          <Route path="/facts" element={<ProtectedRoute><FactList /></ProtectedRoute>} />
          <Route path="/facts/new" element={<ProtectedRoute><FactForm /></ProtectedRoute>} />
          <Route path="/facts/:id/edit" element={<ProtectedRoute><FactForm /></ProtectedRoute>} />
          <Route path="/profiles" element={<ProtectedRoute><ProfileList /></ProtectedRoute>} />
          <Route path="/profiles/:id" element={<ProtectedRoute><ProfileDetail /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
