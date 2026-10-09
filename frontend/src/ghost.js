import GhostContentAPI from '@tryghost/content-api';

// Initialize the API Client
const api = new GhostContentAPI({
  url: process.env.REACT_APP_GHOST_API_URL,
  key: process.env.REACT_APP_GHOST_CONTENT_API_KEY,
  version: "v5.0"
});

// Fetch a list of posts (for News Page or Sidebar)
export const fetchPosts = async (limit = 10) => {
  try {
    return await api.posts.browse({
      limit: limit,
      include: 'tags,authors'
    });
  } catch (err) {
    console.error("Ghost Fetch Error:", err);
    return [];
  }
};

// Fetch a single post by Slug (for Article Page)
export const fetchSinglePost = async (slug) => {
  try {
    return await api.posts.read({
      slug: slug
    }, {
        include: 'tags,authors'
    });
  } catch (err) {
    console.error("Ghost Read Error:", err);
    return null;
  }
};