import React, { useEffect, useState, useRef } from 'react';
import flvjs from 'flv.js';

function FlvPlayer({ src, poster }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [playerStatus, setPlayerStatus] = useState('idle');

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  const handlePlayClick = () => {
    // Prevent multiple clicks
    if (playerStatus !== 'idle' || !flvjs.isSupported()) {
      return;
    }

    setPlayerStatus('waiting');

    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Destroy any old player instance just in case
    if (playerRef.current) {
      playerRef.current.destroy();
    }
    const flvPlayer = flvjs.createPlayer({
      type: 'flv',
      url: src,
      isLive: true,
    });

    playerRef.current = flvPlayer;

    flvPlayer.attachMediaElement(videoElement);

    flvPlayer.on(flvjs.Events.MEDIA_INFO, () => {
      setPlayerStatus('playing');
    });

    flvPlayer.on(flvjs.Events.ERROR, () => {
      setPlayerStatus('ended');
    });
    
    try {
      flvPlayer.load();
      flvPlayer.play();
    } catch (error) {
      console.error("FLV Player Error:", error);
      setPlayerStatus('ended');
    }
  };

  const renderOverlay = () => {
    if (playerStatus === 'playing') {
      return null;
    }
    
    if (playerStatus === 'idle') {
      return (
        <div className="player-overlay" onClick={handlePlayClick}>
          <div className="big-play-button"></div>
        </div>
      );
    }

    if (playerStatus === 'ended') {
      return (
        <div className="player-overlay">
          <h2>Tayangan Offline</h2>
        </div>
      );
    }

    return (
       <div className="player-overlay">
         <h2>Menunggu koneksi...</h2>
       </div>
    );
  };

  return (
    <div className="player-container">
      <video
        ref={videoRef}
        controls={playerStatus === 'playing'}
        muted={false}
        poster={poster}
        className="player-video"
      />
      {renderOverlay()}
    </div>
  );
}

export default FlvPlayer;