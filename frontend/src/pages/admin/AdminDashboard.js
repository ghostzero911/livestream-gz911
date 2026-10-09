import React, { useState, useEffect } from 'react';
import { fetchData } from '../../data';
import { useAuth } from '../../context/AuthContext';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchData('/api/admin/dashboard-stats', token);
        setStats(data);
      } catch (err) {
        setError('Failed to load dashboard stats.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (loading) return <div>Loading Dashboard Stats...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <p>Overview of the platform activity.</p>

      {stats ? (
        <div className="stats-grid">
          <div className="stat-card">
            <h2>{stats.liveStreams}</h2>
            <p>Live Streams</p>
          </div>
          <div className="stat-card">
            <h2>{stats.totalStreams}</h2>
            <p>Total Streams Created</p>
          </div>
          <div className="stat-card">
            <h2>{stats.totalUsers}</h2>
            <p>Registered Users</p>
          </div>
        </div>
      ) : (
        <p>Could not load statistics.</p>
      )}

    </div>
  );
}

export default AdminDashboard;