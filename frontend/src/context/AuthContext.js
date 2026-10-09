import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchData } from '../data';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken')); // Load token from storage on initial load
  const [loading, setLoading] = useState(true); // To check initial auth status

  // Effect to fetch user data if a token exists
  useEffect(() => {
    const fetchUserData = async () => {
      if (token) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_DATA_URL}/api/user`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Token might be invalid/expired
            localStorage.removeItem('authToken');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error("Failed to fetch user:", error);
          localStorage.removeItem('authToken');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false); // Finished initial check
    };

    fetchUserData();
  }, [token]);

  // Login function
  const login = (userData, authToken) => {
    localStorage.setItem('authToken', authToken);
    setToken(authToken);
    setUser(userData);
  };

  // Logout function
  const logout = async () => {
    if (token) {
      try {
        // Call the API logout endpoint, passing the token
        await fetchData('/api/logout', token, { method: 'POST' });
        console.log("Token revoked on server.");
      } catch (error) {
        // Log the error, but proceed with client-side logout anyway
        console.error("Failed to revoke token on server:", error);
      }
    }
    // Clear local state and storage regardless of API call success
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isLoggedIn: !!user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};