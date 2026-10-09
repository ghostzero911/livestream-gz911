import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

function Error404Page() {
  return (
    <>
      <Helmet>
        <title>404 Halaman Tidak Ditemukan - TV Bolaku</title>
        <meta
          name="description"
          content="Halaman yang anda cari tidak ditemukan."
        />
      </Helmet>
      <main className="form-container">
        <h1>404 - Not Found</h1>
        <p>Halaman yang anda cari tidak ditemukan.</p>
        <Link to="/">Kembali</Link>
      </main>
    </>

  );
}

export default Error404Page;