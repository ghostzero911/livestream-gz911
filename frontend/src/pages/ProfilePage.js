import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchData } from '../data';

function ProfilePage() {
  const { user, token, login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        password_confirmation: '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const dataToSend = { ...formData };
      
      if (!dataToSend.password || dataToSend.password === '') {
        delete dataToSend.password;
        delete dataToSend.password_confirmation;
      } else if (dataToSend.password !== dataToSend.password_confirmation) {
          throw new Error("Passwords do not match.");
      }

      const updatedUser = await fetchData('/api/user', token, {
        method: 'PUT',
        body: JSON.stringify(dataToSend),
      });

      // Update the global auth state with the new user info
      login(updatedUser, token); 
      setSuccess('Profile updated successfully!');
      setFormData(prev => ({ ...prev, password: '', password_confirmation: '' }));

    } catch (err) {
      setError(err.message || 'Failed to update profile.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading profile...</div>;
  }

  return (
    <main className="form-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Edit Profile</h2>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <div className="form-group">
          <label htmlFor="name">Nama:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required disabled={loading} />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled={loading} />
        </div>
        
<hr style={{ margin: '20px 0', border: '1px solid var(--border-color)' }} />

        <div className="form-group">
          <label htmlFor="password">Ganti Password (Kosongkan jika tidak ingin mengganti):</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} disabled={loading} />
        </div>
        <div className="form-group">
          <label htmlFor="password_confirmation">Ulangi Password Baru:</label>
          <input type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} disabled={loading} />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
      <style>{`.success-message { color: lightgreen; background-color: rgba(144, 238, 144, 0.1); border: 1px solid lightgreen; padding: 10px; border-radius: 4px; text-align: center; }`}</style>
    </main>
  );
}

export default ProfilePage;