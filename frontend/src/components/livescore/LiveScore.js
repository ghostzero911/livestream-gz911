import React, { useState, useEffect, use } from 'react';
import { Helmet } from 'react-helmet-async';
import io from 'socket.io-client';
import LeftColumnTabs from '../layout/LeftColumnTabs';
import ErrorBoundary from '../ErrorBoundary';
import MatchList from './MatchList';
import { CategoryContext } from '../../context/CategoryContext';
import './LiveScore.css';

function LiveScore() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState('live');
  const { activeCategory, setActiveCategory } = use(CategoryContext);

  const tabCategory = new Map([
    ['soccer', 'Sepakbola'],
    ['basket', 'Basket']
  ]);

  useEffect(() => {
    if (!activeCategory) {
      setActiveCategory('soccer');
    }

    setLoading(true);
    const socket = io(process.env.REACT_APP_API_SOCKET);
    const roomName = `livescore_${activeCategory}`;

    socket.emit('join_livescore_room', roomName);
    socket.on('livescore_update', (liveData) => {
      const transformed = transformData(liveData);
      setData(transformed);
      setLoading(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [activeCategory, setActiveCategory]);

  const transformData = (list) => {
    const results = { live: [], upcoming: [], finished: [] };
    const leagueMap = { live: [], upcoming: [], finished: [] };
    const STATUS_UPCOMING = 1;
    const STATUS_LIVE = [2, 3, 4, 5, 6, 7, 8];
    const STATUS_FINISHED = 10;

    if (!list || Object.keys(list).length === 0) return results;

    for (const [leagueName, leagueData] of Object.entries(list)) {
      const matches = leagueData.matches || [];
      if (!Array.isArray(matches)) continue;

      for (const match of matches) {
        let statusKey = null;
        if (match.status_id === STATUS_UPCOMING) statusKey = 'upcoming';
        else if (STATUS_LIVE.includes(match.status_id)) statusKey = 'live';
        else if (match.status_id === STATUS_FINISHED) statusKey = 'finished';

        if (statusKey) {
          if (!leagueMap[statusKey][leagueName]) {
            leagueMap[statusKey][leagueName] = {
              league_name: leagueName,
              competition_logo: leagueData.competition_logo || match.competition_logo,
              matches: [],
            };
          }
          leagueMap[statusKey][leagueName].matches.push(match);
        }
      }
    }
    results.live = Object.values(leagueMap.live);
    results.upcoming = Object.values(leagueMap.upcoming);
    results.finished = Object.values(leagueMap.finished);

    return results;
  };

  const getMatchesForTab = () => {
    if (!data) return [];
    if (schedule === 'live') return data.live;
    if (schedule === 'upcoming') return data.upcoming;
    if (schedule === 'finished') return data.finished;
    return [];
  };

  return (
    <>
      <Helmet>
        <title>Jadwal dan Skor Bola Hari Ini - TV Bolaku</title>
        <meta
          name="description"
          content="Jadwal bola dan live skor pertandingan bola hari ini update setiap hari hanya di TV Bolaku online."
        />
      </Helmet>
      <LeftColumnTabs tabList={tabCategory} tabChange={setActiveCategory} tabActive={activeCategory} />
      
      <div className="tab-content">
        <div className="livescore-container">
          <div className="sub-tab-navigation">
            <button
              className={schedule === 'live' ? 'active' : ''}
              onClick={() => setSchedule('live')}
            >
              LIVE
            </button>
            <button
              className={schedule === 'upcoming' ? 'active' : ''}
              onClick={() => setSchedule('upcoming')}
            >
              AKAN TANDING
            </button>
            <button
              className={schedule === 'finished' ? 'active' : ''}
              onClick={() => setSchedule('finished')}
            >
              SELESAI
            </button>
          </div>
          <ErrorBoundary>
            {loading ? (
              <div>Sedang mengambil data...</div>
            ) : (
              <MatchList leagues={getMatchesForTab()} status={schedule} activeCategory={activeCategory} />
            )}
          </ErrorBoundary>
        </div>
      </div>
    </>
  );
}

export default LiveScore;