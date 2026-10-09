import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const formatTime = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hourCycle: 'h24' });
}

function MatchList({ leagues, status, activeCategory }) {
  if (!leagues || leagues.length === 0) {
    return <div className="match-item-empty">Tidak ada jadwal.</div>;
  }

  return (
    <div className="league-list">
      {leagues.map(league => (
        <div key={league.league_name} className="league-container">
          <h4>
            <img src={league.competition_logo} alt="" className="league-logo" />
            {league.league_name}
          </h4>

          <div className="match-list">
            {league.matches.map(match => (
              <div key={match.id} className="match-item-new">
                <div className="match-time-col">
                  {match.status_id === 1 && <span className="match-status">{formatTime(match.match_time)}</span>}
                  {match.status_id > 1 && (
                    <span className={`match-status ${match.status_id < 10 ? 'live' : '' }`}>
                      <MatchTimeDisplay elapsed={match.elapsed} status={match.status_id} category={activeCategory}></MatchTimeDisplay>
                    </span>
                  )}
                  {/* {status === 'live' ? (
                    <span className="match-elapsed">{match.elapsed}'</span>
                  ) : (
                    <span className="match-time">{formatTime(match.match_time)}</span>
                  )} */}
                </div>

                <div className="match-teams-col">
                  <div className="team-row">
                    <img src={match.home_team_logo} alt="" />
                    <span>{match.home_team_name}</span>
                  </div>
                  <div className="team-row">
                    <img src={match.away_team_logo} alt="" />
                    <span>{match.away_team_name}</span>
                  </div>
                </div>

                <div className="match-button-col">
                  {status === 'live' && match.stream_link && (
                    <Link to={`/stream/${match.stream_link}`} className="watch-now-btn internal">
                      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAACQ0lEQVR4nO2Yu2sUURjFTyImwSKSCGJja6GoRUDU+b4kapMiYiFpLCyiEV9gaSdCRA2xyT+QIo9GsVGiATHgu1C08IGPShK08RVxCUbYI3fcWXRJnJnM3Z0ZvT84sAyz3z2HOzP33g9wOBwOh+N/gLuwih4208NuKo5TMUDBGAUTFNyn4AUF76j45EswRwV9/fodXDf3PKfgnv9fxSgF56g45tc2Y2xFa3LDQD0FfRRMUVEom6mdCqWxDxKoi2d+PRoomEzBNBfRNbZhefQAggsZMM0KDUQz34EmCr5kwDArNMs2rAgP4KEzA2a5oNqxI0qA3tSN6iIS9EV5/vtTN6oJ3gMKxhMN8vAGuX9DtWbgcpQAtxINYvgxT14aIrtW2g7xJEqAx4kDBMx+IIdOkB31tgLMhAdQvLIWIODlI/LIdhsBvoeuyial9QCGYpGcukjuXZssRBcawx6hz1UJEDD3jRw+Te5sXFr9LWgOm4H5qgYImHlDnuqJX38bVmcjwPRr8mR3/PqCljw/QkX2YFl6L/HkCLlnzdJrK77+1XzmP6OC6douZB/fk4OH7C1kgqc13ko02zGuZd2t/mbuwQS5b51t4yzNwHi+t9OC/nwfaDz05vtI6aHz3z/UGygYzIBhVug8YjW2FNczYJq+TAsyTmPLDwHUUXEg5dbiTf+jEre1uGAgQQvbsZGCbioOU3GGihEqrlBw26ySVLwtN3H/DF347bq55xkVd6i4WmrunqXgqF9bsMlKc9fhcDgcDuSAn9VThUlTulWSAAAAAElFTkSuQmCC" alt="youtube-play"></img>
                      NONTON
                    </Link>
                  )}
                </div>

                <div className="match-score-col">
                  <span>{match.home_score}</span>
                  <span>{match.away_score}</span>
                </div>

              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchTimeDisplay({ elapsed, status, category }) {
  const [timerDisplay, setTimerDisplay] = useState(elapsed);

  useEffect(() => {
    setTimerDisplay(elapsed);
  }, [elapsed]);

  const getStatusDisplay = (status, timerDisplay, category) => {
    if (status === 10) return 'FIN'; // Full Time
    if (status === 13) return 'Postp.'; // Postponed

    // Soccer
    if (category === 'soccer' || category === 'football') {
      switch (status) {
        case 2: return `1H ${timerDisplay}'`; // 1st Half
        case 3: return 'HT';             // Half Time
        case 4: return `2H ${timerDisplay}'`; // 2nd Half
        case 5: return 'ET';             // Extra Time
        case 6: return 'PEN';            // Penalties
        case 7: return 'Break';          // Break time (rare)
        default: return `${timerDisplay}'`;
      }
    }

    // Basketball
    if (category === 'basket' || category === 'basketball') {
      switch (status) {
        case 2: return `Q1 ${timerDisplay}'`;
        case 3: return `Q2 ${timerDisplay}'`;
        case 4: return 'HT';              // Half Time (End of Q2)
        case 5: return `Q3 ${timerDisplay}'`;
        case 6: return `Q4 ${timerDisplay}'`;
        case 7: return 'OT';              // Overtime
        default: return `Q${status - 1}`; // Fallback
      }
    }

    // Fallback for other sports
    return status > 1 && status < 10 ? 'Live' : '';
  };

  return (
    <span>{getStatusDisplay(status, timerDisplay, category)}</span>
  );
}

export default MatchList;