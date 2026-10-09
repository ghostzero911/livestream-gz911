import React, { useState, useEffect } from 'react';
import { fetchData } from '../../data';
import { useAuth } from '../../context/AuthContext';

function AdForm({ ad, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        name: 'sidebar 1',
        ad_code: '',
        is_active: true,
    });
    const [error, setError] = useState('');
    const { token } = useAuth();

    // When the 'ad' prop changes, pre-fill the form
    useEffect(() => {
        if (ad) {
            setFormData({
                name: ad.name || '',
                ad_code: ad.ad_code || '',
                is_active: ad.is_active || false,
            });
        } else {
            setFormData({ name: '', ad_code: '', is_active: true });
        }
    }, [ad]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const isUpdating = !!ad;
        const url = isUpdating ? `/api/admin/ads/${ad.id}` : '/api/admin/ads';
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            await fetchData(url, token, {
                method: method,
                body: JSON.stringify(formData)
            });
            onSave(); // Call parent to refresh list and close form
        } catch (err) {
            setError(`Failed to save ad: ${err.message}`);
            console.error(err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="admin-form">
            <h4>{ad ? 'Edit Iklan' : 'Buat Iklan'}</h4>
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

            <div className="form-group">
                <label>Posisi Iklan:</label>
                <select name="name" value={formData.name} onChange={handleChange} required>
                    <option value="sidebar 1" selected>Sidebar 1 (400x80)</option>
                    <option value="sidebar 2">Sidebar 2 (400x80)</option>
                    <option value="sidebar 3">Sidebar 3 (400x80)</option>
                    <option value="main top">Page Top (800x80)</option>
                    <option value="video top">Video Top (800x80)</option>
                    <option value="video bottom">Video Bottom (800x80)</option>
                </select>
            </div>
            <div className="form-group">
                <label>Kode Iklan (HTML/JS):</label>
                <textarea name="ad_code" value={formData.ad_code} onChange={handleChange} required rows="5"></textarea>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange} style={{ width: 'auto', marginRight: '10px' }} />
                <label htmlFor="is_active" style={{ marginBottom: 0 }}>Aktif?</label>
            </div>

            <button type="submit">Simpan</button>
            <button type="button" onClick={onCancel} style={{ marginLeft: '10px', backgroundColor: '#555' }}>Cancel</button>
        </form>
    );
}

export default AdForm;