import React, { useState, useEffect } from 'react';
import { fetchPosts } from '../../ghost';
import './Sidebar.css';

function LatestNews() {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // This is a placeholder - mapping fetch categories
  // const getCategoryId = (categoryName) => {
  //     const categories = { soccer: 1, basketball: 2, fighting: 3 };
  //     return categories[categoryName] || null;
  // }

  useEffect(() => {
    setLoading(true);
    setError(null);
    setNewsItems([]);

    const fetchNews = async () => {
      try {
        const data = await fetchPosts(5);
        setNewsItems(data);
      } catch (error) {
        console.error("Failed to fetch news:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="sidebar-widget">
      <h3>Info Terbaru</h3>
      {loading && <div className="loading-info">Loading...</div>}
      {!loading && <NewsList newsItems={newsItems} error={error} />}
    </div>
  );
}

function NewsList({ newsItems, error }) {
  if (error || newsItems.length === 0) {
    return <div className="sidebar-item-empty">Tidak ada artikel.</div>;
  }
  return (
    <ul className="sidebar-list">
      {newsItems.map(post => (
        <li key={post.id} className="sidebar-item">
          <a href={`/news/${post.slug}`}>
            <img 
                src={post.feature_image || 'https://via.placeholder.com/150'} 
                alt={post.title} 
                className="sidebar-item-thumbnail" 
              />
            <div className="sidebar-item-info">
              <span className="sidebar-item-title">{post.title}</span>
              <span className="sidebar-item-category">{post.tags[0]?.name || 'News'}</span>
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default LatestNews;