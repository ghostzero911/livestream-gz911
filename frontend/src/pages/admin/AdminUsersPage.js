import React, { useState, useEffect, useCallback } from 'react';
import { fetchData } from '../../data';
import { useAuth } from '../../context/AuthContext';

function UserForm({ user, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: user ? user.name : '',
    email: user ? user.email : '',
    password: '',
    is_admin: user ? user.is_admin : false,
  });
  const [error, setError] = useState('');
  const { token } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const isUpdating = !!user;
    const url = isUpdating ? `/api/admin/users/${user.id}` : '/api/admin/users';
    const method = isUpdating ? 'PUT' : 'POST';

    let dataToSend = { ...formData };
    if (isUpdating && !dataToSend.password) {
      delete dataToSend.password;
    }

    try {
      await fetchData(url, token, {
        method: method,
        body: JSON.stringify(dataToSend),
      });
      onSave();
    } catch (err) {
      setError(err.message || 'Failed to save user.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <h4>{user ? 'Edit User' : 'Create New User'}</h4>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div className="form-group">
        <label>Name:</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div className="form-group"><label>Email:</label><input type="email" name="email" value={formData.email} onChange={handleChange} required /></div>
      <div className="form-group"><label>Password (leave blank to keep unchanged):</label><input type="password" name="password" value={formData.password} onChange={handleChange} /></div>
      <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}><input type="checkbox" name="is_admin" id="is_admin" checked={formData.is_admin} onChange={handleChange} style={{ width: 'auto', marginRight: '10px' }} /><label htmlFor="is_admin" style={{ marginBottom: 0 }}>Is Admin?</label></div>
      <button type="submit">Save User</button>
      <button type="button" onClick={onCancel} style={{ marginLeft: '10px', backgroundColor: '#555' }}>Cancel</button>
    </form>
  );
}


// --- Main Admin Users Page ---
function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const loadUsers = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await fetchData('/api/admin/users', token);
      setUsers(data);
    } catch (err) { setError('Failed to load users.'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetchData(`/api/admin/users/${userId}`, token, { method: 'DELETE' });
      loadUsers();
    } catch (err) {
      setError(`Failed to delete user: ${err.message}`);
    }
  };

  const handleSave = () => {
    setShowCreateForm(false);
    setEditingUser(null);
    loadUsers();
  };

  if (loading && !users.length) return <div>Loading users...</div>;

  if (showCreateForm || editingUser) {
    return (
      <UserForm
        user={editingUser}
        onSave={handleSave}
        onCancel={() => { setShowCreateForm(false); setEditingUser(null); }}
      />
    );
  }

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>User Management</h2>
        <button onClick={() => setShowCreateForm(true)} style={{ padding: '10px 15px' }}>+ Tambah User</button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Email</th><th>Admin</th><th>Joined</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.is_admin ? 'Yes' : 'No'}</td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
              <td>
                <div className="actions-cell">
                  <button className="btn-default" onClick={() => setEditingUser(user)}>Edit</button>
                  <button className="btn-red" onClick={() => handleDelete(user.id)}>Hapus</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminUsersPage;