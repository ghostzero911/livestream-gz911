import React, { useState, useEffect } from 'react';
import { fetchData } from '../../data';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function ScrapeListPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchData('/api/admin/scraper/list', token);
        setMatches(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token]);

  const handleCreateStream = (match) => {

    navigate('/xadmin/streams', { 
      state: { 
        prefill: {
          title: match.title,
          category: match.category === 'football' ? 'soccer' : (match.category === 'basketball' ? 'basket' : 'sports'),
          scheduled_start_time: match.match_time,
          source_data: match.source_info,
          scraped_id: match.id
        } 
      } 
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-section">
      <h2>Tayangan Tersedia (Scraped)</h2>
      <table className="admin-table">
        <thead>
            <tr>
                <th>Jadwal</th>
                <th>Kategori</th>
                <th>Nama Event</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
          {matches.map(match => (
            <tr key={match.id}>
              <td>{new Date(match.match_time).toLocaleString()}</td>
              <td>{match.category}</td>
              <td>{match.title}</td>
              <td>
                <button onClick={() => handleCreateStream(match)}>
                  Buat Stream
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ScrapeListPage;