import React, { useState, useEffect } from 'react';
import { fetchData } from '../../data';

const initialState = {
  title: '',
  category: 'soccer',
  thumbnail_url: '',
  host: '',
  fixture_id: '',
  scheduled_start_time: '',
  video_url: '',
  stream_url: '',
  details: null, // store the source_id here
  is_restreaming: false,
};

function StreamForm({ onSave, onCancel, token, streamToEdit, prefillData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [streamType, setStreamType] = useState('live');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [externalMatches, setExternalMatches] = useState([]);

  useEffect(() => {
    if (streamToEdit) {
      setIsEditing(true);
      setFormData({
        title: streamToEdit.title || '',
        category: streamToEdit.category || 'soccer',
        thumbnail_url: streamToEdit.thumbnail_url || '',
        host: streamToEdit.host || '',
        fixture_id: streamToEdit.fixture_id || '',
        scheduled_start_time: streamToEdit.scheduled_start_time || '',
        video_url: streamToEdit.video_url || '',
        stream_url: streamToEdit.stream_url || '',
        details: streamToEdit.details || null,
        is_restreaming: false,
      });
      setStreamType(streamToEdit.video_url || streamToEdit.stream_url ? 'vod' : 'live');
      setExternalMatches([]);

    } else if (prefillData) {
      setIsEditing(false);
      const sourceInfo = prefillData.source_data && prefillData.source_data[0]
        ? prefillData.source_data[0]
        : null;

      setFormData({
        title: prefillData.title,
        category: prefillData.category,
        thumbnail_url: '',
        host: '',
        fixture_id: '',
        scheduled_start_time: prefillData.scheduled_start_time
          ? new Date(prefillData.scheduled_start_time).toISOString().slice(0, 16)
          : '',
        video_url: '',
        stream_url: '',
        details: sourceInfo ? {
          scraper_source: sourceInfo.source,
          scraper_id: sourceInfo.id
        } : null,
        is_restreaming: true,
      });

      // Set type to 'live' because re-streaming
      setStreamType('live');

    } else {
      setIsEditing(false);
      setFormData(initialState);
      setStreamType('live');

    }
  }, [streamToEdit, prefillData]);

  useEffect(() => {
    if (!token || formData.category === "others" || formData.category === "sports") {
      setExternalMatches([]);
      return;
    }

    setLoading(true);

    const fetchMatches = async () => {
      try {
        const data = await fetchData(`/api/available-matches/${formData.category}`, token);
        setExternalMatches(data);
      } catch (err) {
        // console.error("Failed to load external matches:", err);
        setExternalMatches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();

  }, [token, formData.category, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setStreamType(newType);

    // Clear the other field's data to avoid confusion
    if (newType === 'live') {
      setFormData(prev => ({ ...prev, video_url: '', stream_url: '' }));
    } else {
      setFormData(prev => ({ ...prev, scheduled_start_time: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Prepare data, removing empty optional fields if necessary
    let dataToSend = { ...formData };

    // if (streamType === 'live' && dataToSend.fixture_id) {
    //   dataToSend.details = { source_id: dataToSend.fixture_id };
    // }

    if (streamType === 'live') {
      delete dataToSend.video_url; // Don't send an empty video_url
      delete dataToSend.stream_url;
    } else {
      delete dataToSend.scheduled_start_time; // Don't send an empty start time
      // delete dataToSend.fixture_id;
      delete dataToSend.details;
    }

    const url = isEditing ? `/api/admin/streams/${streamToEdit.id}` : `/api/admin/streams`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const result = await fetchData(url, token, {
        method: method,
        body: JSON.stringify(dataToSend)
      });
      setSuccess(`Stream created! ${result.stream_key ? 'Key: ' + result.stream_key : ''}`);
      onSave();
    } catch (err) {
      setError(err.message || 'Failed to save stream.');
    }
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <h4>{isEditing ? 'Edit Stream' : 'Tambah Stream'}</h4>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {success && <p style={{ color: 'lightgreen' }}>{success}</p>}

      <div className="form-group">
        <label>Jenis Stream:</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="live"
              checked={streamType === 'live'}
              onChange={handleTypeChange}
            />
            Live Stream (OBS RTMP)
          </label>
          <label>
            <input
              type="radio"
              value="vod"
              checked={streamType === 'vod'}
              onChange={handleTypeChange}
            />
            VOD / Video Link
          </label>
        </div>
      </div>

      <div className="form-group">
        <label>Judul Stream:</label>
        <input type="text" name="title" placeholder="Masukkan judul" value={formData.title} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label>Kategori Video:</label>
        <select name="category" value={formData.category} onChange={handleChange} required>
          <option value="soccer">Sepak Bola</option>
          <option value="basket">Basket</option>
          <option value="sports">Olahraga Lain</option>
          <option value="others">Live TV Channel</option>
        </select>
      </div>

      <div className="form-group">
        <label>Pilih pertandingan (Optional):</label>
        <select
          name="fixture_id"
          value={formData.fixture_id}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="">-- Pertandingan hari ini --</option>
          {externalMatches?.map(match => (
            <option key={match.id} value={match.id}>
              {match.home_team_name} VS {match.away_team_name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Cover Video URL (Optional):</label>
        <input type="url" name="thumbnail_url" placeholder="URL cover" value={formData.thumbnail_url} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Host:</label>
        <input type="text" name="host" placeholder="Nama Host" value={formData.host} onChange={handleChange} required />
      </div>

      {streamType === 'live' ? (
        <div className="form-group">
          <label>Jam Tayang (Optional):</label>
          <input type="datetime-local" name="scheduled_start_time" value={formData.scheduled_start_time || ''} onChange={handleChange} />
        </div>
      ) : (
        <>
          <div className="form-group">
            <label>URL Link Video (YouTube, Vimeo, VOD):</label>
            <input
              type="url" name="video_url" value={formData.video_url || ''} onChange={handleChange} placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div className="form-group">
            <label>Stream URL:</label>
            <input
              type="url" name="stream_url" value={formData.stream_url || ''} onChange={handleChange} placeholder="https://youtube.com/watch?v=..."
            />
          </div>
        </>
      )}

      {streamType === 'live' && (
        <div className="form-group" style={{ background: '#444', padding: '10px', borderRadius: '5px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="is_restreaming"
              checked={formData.is_restreaming}
              onChange={(e) => setFormData({ ...formData, is_restreaming: e.target.checked })}
              style={{width: 'auto'}}
            />
            Aktifkan Auto-Restream
          </label>
          <small style={{ color: '#aaa' }}>Conteng untuk otomatis stream dari sumber tersedia.</small>
        </div>
      )}

      <button type="submit">{isEditing ? 'Simpan' : 'Tambah Baru'}</button>
      <button type="button" onClick={onCancel} style={{ marginLeft: '10px', backgroundColor: '#555' }}>Cancel</button>
    </form>
  );
}

export default StreamForm;