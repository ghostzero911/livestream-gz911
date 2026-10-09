import React, { useState, useEffect, useCallback } from 'react';
import { fetchData } from '../../data';
import { useAuth } from '../../context/AuthContext';
import AdForm from '../../components/admin/AdForm';

function AdminAdsPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingAd, setEditingAd] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { token } = useAuth();

  const loadAds = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await fetchData('/api/admin/ads', token);
      setAds(data);
    } catch (err) {
      setError('Failed to load ads.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  const handleDelete = async (adId) => {
    if (!window.confirm('Yakin ingin menghapus ad?')) {
      return;
    }

    setError('');
    try {
      await fetchData(`/api/admin/ads/${adId}`, token, {
        method: 'DELETE',
      });
      loadAds();
    } catch (err) {
      setError(`Failed to delete ad: ${err.message}`);
      console.error(err);
    }
  };

  const handleSave = () => {
    setEditingAd(null);
    setShowCreateForm(false);
    loadAds();
  };

  const handleCancel = () => {
    setEditingAd(null);
    setShowCreateForm(false);
  };

  if (showCreateForm || editingAd) {
    return (
      <AdForm
        ad={editingAd}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  if (!token && !loading) return <div style={{ color: 'red' }}>Silahkan login.</div>;

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Iklan</h2>
        <button onClick={() => setShowCreateForm(true)} style={{ padding: '10px 15px' }}>+ Buat Iklan</button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? (
        <div>Loading ads...</div>
      ) : (
        <table className="admin-table">
          <thead><tr><th>ID</th><th>Posisi</th><th>Aktif</th><th>Actions</th></tr></thead>
          <tbody>
            {ads.map(ad => (
              <tr key={ad.id}>
                <td>{ad.id}</td>
                <td>{ad.name}</td>
                <td>{ad.is_active ? 'Yes' : 'No'}</td>
                <td>
                  <div className="actions-cell">
                    <button onClick={() => setEditingAd(ad)}>Edit</button>
                    <button className="btn-red" onClick={() => handleDelete(ad.id)}>Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminAdsPage;