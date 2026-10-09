import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchData } from '../../data';
import StreamForm from '../../components/admin/StreamForm';
import { useAuth } from '../../context/AuthContext';

function AdminStreamsPage() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStream, setEditingStream] = useState(null);

  const location = useLocation();
  const [prefillData, setPrefillData] = useState(null);

  useEffect(() => {
    if (location.state && location.state.prefill) {
      setPrefillData(location.state.prefill);
      setShowCreateForm(true);
      
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const loadStreams = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await fetchData('/api/admin/streams', token);
      setStreams(data);
    } catch (err) {
      setError('Failed to load streams.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  const handleSave = () => {
    setEditingStream(null);
    setShowCreateForm(false);
    setPrefillData(null);
    loadStreams();
  };

  const handleCancel = () => {
    setEditingStream(null);
    setShowCreateForm(false);
    setPrefillData(null);
  };

  const handleDelete = async (streamId) => {
    if (!window.confirm('Are you sure you want to permanently delete this stream?')) {
      return;
    }

    setError('');
    try {
      await fetchData(`/api/admin/streams/${streamId}`, token, {
        method: 'DELETE',
      });
      loadStreams();
    } catch (err) {
      setError(`Failed to delete stream: ${err.message}`);
      console.error(err);
    }
  };

  const handleSetLive = async (streamId) => {
    try {
      await fetchData(`/api/admin/streams/${streamId}/live`, token, { method: 'PATCH' });
      loadStreams();
    } catch (error) {
      console.error("Error setting stream live:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleSetOffline = async (streamId) => {
    try {
      await fetchData(`/api/admin/streams/${streamId}/offline`, token, { method: 'PATCH' });
      loadStreams();
    } catch (error) {
      console.error("Error setting stream offline:", error);
      alert(`Error: ${error.message}`);
    }
  };

  if (showCreateForm || editingStream) {
    return (
      <StreamForm
        onSave={handleSave}
        onCancel={handleCancel}
        token={token}
        streamToEdit={editingStream}
        prefillData={prefillData}
      />
    );
  }

  if (!token && !loading) return <div style={{ color: 'red' }}>Silahkan login.</div>;

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Streams</h2>
        <button onClick={() => setShowCreateForm(true)} style={{ padding: '10px 15px' }}>+ Buat Streams</button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? (
        <div>Loading Streams...</div>
      ) : (
        <table className="admin-table">
          <thead style={{ textAlign: "center" }}>
            <tr>
              <th>Judul Stream</th>
              <th>Sumber Stream</th>
              <th colSpan="2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {streams.map(stream => (
              <tr key={stream.id} >
                <td>{stream.title}</td>
                <td>{stream.video_url ? stream.video_url : (stream.stream_url ? stream.stream_url : `${stream.stream_key}?secret=${stream.secret_token}`)}</td>
                <td>
                  <div className="actions-cell">
                    {stream.status === 'offline' && <button onClick={() => handleSetLive(stream.id)}>Go Live</button>}
                    {stream.status === 'live' && <button className="btn-red" onClick={() => handleSetOffline(stream.id)}>Set Offline</button>}
                    <button onClick={() => setEditingStream(stream)}>Edit</button>
                    <button className="btn-red" onClick={() => handleDelete(stream.id)}>Delete</button>
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

export default AdminStreamsPage;