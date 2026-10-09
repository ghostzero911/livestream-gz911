const API_BASE_URL = process.env.REACT_APP_ENV === 'production' ? process.env.REACT_APP_API_DATA_URL : 'http://localhost:8000';

/**
 * Reusable function to fetch data. Includes Authorization header if token is provided.
 * @param {string} path - The API path (e.g., '/api/fixtures/scheduled').
 * @param {string} [token=null] - Optional JWT token for authenticated requests.
 * @param {object} [options={}] - Optional additional fetch options (method, body, etc.).
 */
export const fetchData = async (path, token = null, options = {}) => {
  // console.log(`Fetching data from: ${API_BASE_URL}${path}`);

  // Prepare headers
  const headers = {
    'Accept': 'application/json', // Expect JSON response
    ...options.headers, // Include any custom headers from options
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add Content-Type for POST/PATCH etc. if body exists
  if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options, // Include method, body, etc.
        headers: headers,
    });

    // Check for non-JSON response *before* trying to parse
    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            // Try to get more specific error from API response body
            const errorData = await response.json();
            errorMessage = errorData.message || JSON.stringify(errorData);
        } catch (e) {
            // If response is not JSON (like HTML), use the status text
            errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
    }

    // Handle potential empty responses (e.g., for logout, delete)
    if (response.status === 204 || response.headers.get("content-length") === "0") {
        return null; // Or return { success: true } or similar
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        // If we expect JSON but didn't get it (and it wasn't a 204)
        // console.warn("Received non-JSON response:", await response.text());
        throw new TypeError("Received non-JSON response from server");
    }

    return response.json();

  } catch (error) {
    // console.error(`Failed to fetch from ${path}:`, error);
    // Re-throw the error so calling components can handle it
    throw error;
  }
};

// Note: Using React.cache might be less suitable now that the function depends on the token.
// If you use this helper for both public GET and authenticated requests,
// you might need separate helper functions or handle caching differently.