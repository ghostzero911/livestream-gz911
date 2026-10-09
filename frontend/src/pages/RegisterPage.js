import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    setLoading(true);

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_DATA_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422) {
          setValidationErrors(data.errors || {});
          setError('Please check the form for errors.');
        } else {
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
      } else {
        console.log("Registration successful:", data);
        if (data.token && data.user) {
          login(data.user, data.token);
        }
        navigate('/');
      }

    } catch (err) {
      setError(err.message || 'An error occurred during registration.');
      console.error("Registration failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Halaman Pendaftaran - TV Bolaku</title>
        <meta
          name="description"
          content="Buat dan daftar akun baru TV Bolaku - situs nonton bola dan saluran olahraga lengkap gratis Indonesia."
        />
      </Helmet>

      <main className="form-container">
        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Register</h2>
          {error && <p className="error-message">{error}</p>}

          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
            {validationErrors.name && <p className="validation-error">{validationErrors.name[0]}</p>}
          </div>

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
            {validationErrors.email && <p className="validation-error">{validationErrors.email[0]}</p>}
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
            {validationErrors.password && <p className="validation-error">{validationErrors.password[0]}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="passwordConfirmation">Confirm Password:</label>
            <input
              type="password"
              id="passwordConfirmation"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Mohon menunggu...' : 'Daftar'}
          </button>

          <p className="auth-switch">
            Punya akun? <Link to="/login">Masuk di sini</Link>
          </p>
        </form>
      </main>
    </>
  );
}

export default RegisterPage;