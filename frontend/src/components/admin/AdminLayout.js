import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './AdminLayout.css';

function AdminLayout() {
  return (
    <>
      <Helmet>
        <title>Admin Dashboard - TV Bolaku</title>
        <meta
          name="description"
          content="Panel admin dan pengaturan situs"
        />
      </Helmet>
      <main className="main-content admin-layout">
        <nav className="admin-sidebar">
          <h3>Admin Menu</h3>
          <ul>
            <li><Link to="/xadmin/streams">Streams</Link></li>
            <li><Link to="/xadmin/users">Users</Link></li>
            <li><Link to="/xadmin/ads">Iklan</Link></li>
            <hr />
            <li><Link to="/xadmin/scraper">Scraper</Link></li>
            <li><a href={`${process.env.REACT_APP_GHOST_API_URL}/ghost` || '#'} target="_blank" rel="noopener noreferrer">Blog/Artikel</a></li>
            <li><a href={process.env.REACT_APP_API_SRS_URL || '#'} target="_blank" rel="noopener noreferrer">SRS Setting</a></li>
          </ul>
        </nav>
        <div className="admin-content">
          {/* Child routes will render here */}
          <Outlet />
        </div>
      </main>
    </>
  );
}

export default AdminLayout;