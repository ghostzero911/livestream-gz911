import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import '../components/layout/Layout.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_DATA_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors (422) or other errors (401 Unauthorized)
        if (response.status === 422 || response.status === 401) {
          // Use Laravel's validation error structure if available
          setError(data.message || 'Invalid credentials.');
        } else {
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
      } else {
        console.log("Login successful:", data);
        login(data.user, data.token);
        // localStorage.setItem('authToken', data.token);
        if (data.user && data.user.is_admin) {
          navigate('/xadmin');
        } else {
          navigate('/');
        }
      }

    } catch (err) {
      setError(err.message || 'An error occurred during login.');
      console.error("Login failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Halaman Login - TV Bolaku</title>
        <meta
          name="description"
          content="Login masuk dan nonton liga bola favoritmu di TV Bolaku online."
        />
      </Helmet>

      <main className="form-container">
        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Login</h2>
          {error && <p className="error-message">{error}</p>}

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Masuk'}
          </button>
          <p className="auth-switch">
            Belum ada akun? <Link to="/register">Daftar di sini</Link>
          </p>
        </form>
      </main>
    </>
  );
}

export default LoginPage;