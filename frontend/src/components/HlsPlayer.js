import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

function HlsPlayer({ src, poster }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const retryTimerRef = useRef(null);
  const streamConnectedOnce = useRef(false); // This will track if the stream connected.
  const [playerStatus, setPlayerStatus] = useState('idle'); // 'idle', 'waiting', 'playing', 'ended'

  const hlsConfig = {
    debug: false,
    enableWorker: true,      // Improves performance and helps avoid lag
    lowLatencyMode: true,      // Enables Low-Latency HLS features
    liveSyncDurationCount: 3,      // Start playback from the last segment (index 2)
    liveMaxLatencyDurationCount: 10,    // speed up playback to catch up to the live edge.
    maxBufferLength: 30,      // Set max buffer time to 8 seconds
    //maxLiveSyncPlaybackRate: 1.2,      // Set max playback rate to 1.2x to catch up
    maxMaxBufferLength: 60,      // We can also set maxMaxBufferLength to be just above maxBufferLength
  };

  const startLoading = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
    }

    const hls = new Hls(hlsConfig);
    hlsRef.current = hls;

    hls.loadSource(src);
    hls.attachMedia(videoRef.current);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setPlayerStatus('playing');
      streamConnectedOnce.current = true;
      videoRef.current.play().catch(() => { });
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        if (streamConnectedOnce.current) {
          setPlayerStatus('ended');
          hls.destroy();
        } else {
          setPlayerStatus('waiting');
          retryTimerRef.current = setTimeout(startLoading, 5000);
        }
      }
    });
  };

  const handlePlayClick = () => {
    setPlayerStatus('waiting');
    startLoading(); // Start checking for the stream
  };

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  const renderOverlay = () => {
    if (playerStatus === 'playing') return null;
    if (playerStatus === 'idle') {
      return (
        <div className="player-overlay" onClick={handlePlayClick}>
          <div className="big-play-button"></div>
          MULAI VIDEO
        </div>
      );
    }
    if (playerStatus === 'ended') return (
      <div className="player-overlay">
        <h2>Tayangan telah berakhir</h2>
      </div>
    );
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

export default HlsPlayer;