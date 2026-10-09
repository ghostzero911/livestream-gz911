import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

function TopBar() {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      console.log("Logging out...");
      await logout(); // Await the async logout from context
      navigate('/'); // Redirect after logout completes
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
    <header className="top-bar">
      <div className="logo">
        <Link to="/">
          <img alt="logo" src="https://res.cloudinary.com/dsyueu1s0/image/upload/v1762690507/tvbolaku_logo_th1pde.png"></img>
        </Link>
      </div>
      <nav className="main-nav">
        {/* <Link to="/stream">Streaming</Link>
        <Link to="/schedule">Jadwal & Skor</Link> */}
        <a href="/stream">Streaming</a>
        <a href="/schedule">Jadwal & Skor</a>
        <a href="/news">Berita</a>
        {user && user.is_admin === 1 && <Link to="/xadmin">Admin Panel</Link>}
        {/* <Link to="/app">Aplikasi</Link> */}
      </nav>
      <div className="login-nav">
        {isLoggedIn ? (
          <>
            <span style={{ marginRight: '15px', color: 'var(--text-secondary)' }}>
              Halo, <Link to="/profile" style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{user?.name || 'User'}</Link>!
            </span>
            <button onClick={handleLogout} className="logout-button">KELUAR</button>
          </>
        ) : (
          // Show Login if not logged in
          <Link className="login-btn" to="/login">MASUK</Link>
        )}
      </div>
    </header>
    <div className="top-bar mobile-wrapper">
      <div className="logo">
        <Link to="/">
          <img alt="logo" src="https://res.cloudinary.com/dsyueu1s0/image/upload/v1762690507/tvbolaku_logo_th1pde.png"></img>
        </Link>
      </div>
      <nav className="main-nav">
        {/* <Link to="/stream">Streaming</Link>
        <Link to="/schedule">Jadwal & Skor</Link> */}
        <a href="/stream">Streaming</a>
        <a href="/schedule">Jadwal & Skor</a>
        <a href="/news">Berita</a>
        {user && user.is_admin === 1 && <Link to="/xadmin">Admin Panel</Link>}
        {/* <Link to="/app">Aplikasi</Link> */}
      </nav>
      <div className="login-nav">
        {isLoggedIn ? (
          <>
            <span style={{ marginRight: '15px', color: 'var(--text-secondary)' }}>
              Halo, <Link to="/profile" style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{user?.name || 'User'}</Link>!
            </span>
            <button onClick={handleLogout} className="logout-button">KELUAR</button>
          </>
        ) : (
          // Show Login if not logged in
          <Link className="login-btn" to="/login">MASUK</Link>
        )}
      </div>
    </div>
    </>
    
  );
}

export default TopBar;