import React, { useState, useEffect } from 'react';
import { fetchData } from '../../data';

function AdDisplay({ placementName, adsWidth, adsHeight }) {
  const [adData, setAdData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAd = async () => {
      setLoading(true);
      try {
        // Fetch ad using endpoint and provided name
        const data = await fetchData(`/api/ads/${encodeURIComponent(placementName)}`);
        setAdData(data);
      } catch (error) {
        console.error(`Failed to load ad for placement "${placementName}":`, error);
        setAdData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [placementName]);

  // Don't render anything while loading or if no ad data is found
  if (loading || !adData || !adData.ad_code) {
    return <div className="ad-container">
      <span className="ad-badge">Ads</span>
      <img alt={`ads ${placementName}`} src={`https://placehold.co/${adsWidth}x${adsHeight}?text=Pasang+iklan+di+sini+${adsWidth}x${adsHeight}`}></img>
    </div>;
  }

  // Use dangerouslySetInnerHTML to render the ad code
  return (
    <div className="ad-container">
      <span className="ad-badge">Ads</span>
      <div dangerouslySetInnerHTML={{ __html: adData.ad_code }} />
    </div>
  );
}

export default AdDisplay;