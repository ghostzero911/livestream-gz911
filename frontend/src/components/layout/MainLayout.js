import React from 'react';
import { Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CategoryProvider } from '../../context/CategoryContext';
import RightColumn from './RightColumn';
import AdDisplay from '../sidebar/AdDisplay';
import './Layout.css';

function MainLayout() {
  return (
    <>
      <Helmet>
        <title>404 Halaman Tidak Ditemukan - TV Bolaku</title>
        <meta
          name="description"
          content="Halaman yang anda cari tidak ditemukan."
        />
      </Helmet>
      <CategoryProvider>
        <main className="main-content">
          <div className="left-column">
            <AdDisplay placementName="Main Top" adsWidth="600" adsHeight="80"/>
            <Outlet />
          </div>
          <RightColumn />
        </main>
      </CategoryProvider>
    </>
  );
}

export default MainLayout;