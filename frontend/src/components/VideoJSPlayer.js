import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

function VideoJsPlayer({ options, onReady, onEnded, onMediaNotFound }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  // Initialize the Player
  useEffect(() => {
    // Only run if the player hasn't been created
    if (videoRef.current && !playerRef.current) {
      const player = playerRef.current = videojs(videoRef.current, options, () => { });
      player.on('playing', () => {
        onReady && onReady();
      });
      player.on('ended', () => onEnded && onEnded());
      player.on('error', () => {
        const error = player.error();
        if (error && error.code === 2) {
          onMediaNotFound && onMediaNotFound();
        } else {
          onEnded && onEnded();
        }
      });
    }
  }, [options, onReady, onEnded, onMediaNotFound]); // Run once on init

  // Update the source when options change
  useEffect(() => {
    const player = playerRef.current;
    
    // If the player exists and has new sources, update it
    if (player && options && options.sources) {
      player.src(options.sources);
    }
    
    // This depends on the sources array (or its `src` property)
  }, [options?.sources?.[0]?.src]); 

  // Cleanup
  useEffect(() => {
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player>
      <video ref={videoRef} className="video-js vjs-big-play-centered" />
    </div>
  );
}

export default VideoJsPlayer;