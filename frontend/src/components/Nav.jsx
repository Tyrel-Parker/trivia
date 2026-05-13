import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1rem', borderBottom: '1px solid #ddd', alignItems: 'center' }}>
      <Link to="/facts" style={{ fontWeight: 'bold' }}>Trivia</Link>
      {user && (
        <>
          <Link to="/facts">Facts</Link>
          <Link to="/facts/new">Add Fact</Link>
          <Link to="/profiles">Profiles</Link>
          {user.role === 'admin' && <Link to="/categories">Categories</Link>}
          <span style={{ marginLeft: 'auto' }}>{user.username}</span>
          <button onClick={handleLogout}>Logout</button>
        </>
      )}
    </nav>
  );
}
