import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import io from 'socket.io-client';
import HlsPlayer from '../components/HlsPlayer';
import ChatBox from '../components/chat/ChatBox';
import AdDisplay from '../components/sidebar/AdDisplay';
import CountdownTimer from '../components/CountdownTimer';
import FlvPlayer from '../components/FlvPlayer';
import { useAuth } from '../context/AuthContext';
import { fetchData } from '../data';

function StreamPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const [viewCount, setViewCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const { token, loading: authLoading } = useAuth();

  const [isFullScreen, setIsFullScreen] = useState(false);

  const fetchStreamData = useCallback(async () => {
    try {
      const data = await fetchData(`/api/stream/${id}`);
      setStream(data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStreamData();
  }, [fetchStreamData]);

  const handleCountdownComplete = () => {
    fetchStreamData();
  };

  useEffect(() => {
    if (!stream || stream.status !== 'live') return;

    const roomName = `chatroom_${stream.id}`;
    const newSocket = io(process.env.REACT_APP_API_SOCKET || 'http://localhost:4000', {
      auth: { token }
    });
    setSocket(newSocket);

    newSocket.emit('join_room', roomName);
    newSocket.on('viewer_count_update', (count) => {
      setViewCount(count);
    });

    return () => {
      newSocket.off('viewer_count_update');
      newSocket.disconnect();
    };
  }, [token, authLoading, stream]);

  const renderMainContent = () => {
    if (!stream) return null;

    const now = new Date();
    const scheduledTime = stream.scheduled_start_time ? new Date(stream.scheduled_start_time) : null;
    const isLive = stream.status === 'live';

    if (!isLive) {
      return (
        <div className="stream-placeholder offline">
          <h2>Offline</h2>
          {scheduledTime && <p>Terakhir tayang: {scheduledTime.toLocaleString()}</p>}
        </div>
      )
    }

    if (isLive && stream.video_url) {
      return (
        <div className="player-container">
          <iframe
            src={stream.video_url}
            className="player-video" 
            title={stream.title || 'Embedded Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="no-referrer"
            frameBorder="0"
          ></iframe>
        </div>
      );
    }

    // Scraped video
    if (isLive && stream.stream_url) {
      let hlsSrc = null;
      let flvSrc = null;

      if (stream.stream_url.includes('.m3u8')) {
        hlsSrc = stream.stream_url; // It's an external HLS link
      } else {
        flvSrc = stream.stream_url; // It's a VOD/Embed link (YouTube, etc.)
      }

      // Before the scheduled time (Pre-Show Countdown)
      if (scheduledTime && now < scheduledTime) {
        return (
          <div className="player-container">
            <video
              muted={true}
              poster={stream.thumbnail_url}
              className="player-video"
            />
            <CountdownTimer targetDate={scheduledTime} onComplete={handleCountdownComplete} />;
          </div>
        )
      }

      if (flvSrc) {
        return (
          <FlvPlayer
            src={flvSrc}
            poster={stream.thumbnail_url}
          />
        );
      }

      if (hlsSrc) {
        // No schedule or pass scheduled time
        return (
          <HlsPlayer
            src={hlsSrc}
            poster={stream.thumbnail_url}
            streamId={stream.id}
          />
        );
      }
    }

    // Live with host
    if (isLive && stream.stream_key) {
      // Before the scheduled time (Pre-Show Countdown)
      if (scheduledTime && now < scheduledTime) {
        return (
          <div className="player-container">
            <video
              muted={true}
              poster={stream.thumbnail_url}
              className="player-video"
            />
            <CountdownTimer targetDate={scheduledTime} onComplete={handleCountdownComplete} />;
          </div>
        )
      }

      // No schedule or pass scheduled time
      return (
        <HlsPlayer
          src={`${process.env.REACT_APP_SRS_BASE_URL}/live/${stream.stream_key}.m3u8`}
          poster={stream.thumbnail_url}
          streamId={stream.id}
        />
      );
    }
  };

  if (error || !stream) {
    return <main><div className="loading-info" style={{ height: '80vh' }}><h2>Video tidak ditemukan</h2></div></main>;
  }

  if (loading) {
    return <main><div className="loading-info" style={{ height: '80vh' }}><h2>Loading video...</h2></div></main>;
  }

  return (
    <>
      <Helmet>
        <title>{`Live Bola Hari Ini ${stream.title} - TV Bolaku`}</title>
        <meta
          name="description"
          content={`Nonton siaran langsung pertandingan ${stream.host} antara ${stream.title} di TV Bolaku online.`}
        />
      </Helmet>
      <main className="main-content">
        <div className="column-left">
          <AdDisplay placementName="Video Top" adsWidth="800" adsHeight="80" />
          <div className={`video-player-wrapper ${isFullScreen ? 'fullscreen-mode' : ''}`}>
            <div className="video-area">
              {renderMainContent()}
              {stream.video_url && (
                <button className="fullscreen-toggle-btn" onClick={() => setIsFullScreen(!isFullScreen)}>
                  {isFullScreen ? 'Perkecil' : 'Perbesar'}
                </button>
              )}
            </div>
            {stream && (stream.video_url || stream.stream_url) && (
              <>
                <div className="iframe-overlay top"></div>
                <div className='brand-overlay'>
                  <a href='https://jdi.onl/rayapjepe' style={{ width: '100%', height: '100%', display: 'inline-flex', justifyContent: 'center' }}>
                    <img alt="logo" src="https://res.cloudinary.com/dpriac1wv/image/upload/v1755061643/20240918184109000000864ccd303fGGGADAD__708x389_undbdo.png"></img>
                  </a>
                </div>
                <div className="iframe-overlay bottom"></div>
              </>
            )}
          </div>
          <AdDisplay placementName="Video Bottom" adsWidth="800" adsHeight="80" />
          <h1>{stream.title}</h1>
          <div className="stream-details">
            <p>{stream.host}</p>
            <div className="view-count">
              {viewCount} penonton
            </div>
          </div>
        </div>
        {stream &&
          <div className="column-right">
            <ChatBox room={`chatroom_${stream.id}`} socket={socket} viewCount={viewCount} />
          </div>
        }
      </main>
    </>
  );
}
export default StreamPage;