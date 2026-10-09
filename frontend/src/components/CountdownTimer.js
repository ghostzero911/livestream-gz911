import React, { useState, useEffect } from 'react';

const timeLabels = {
  days: 'Hari',
  hours: 'Jam',
  minutes: 'Menit',
  seconds: 'Detik'
};

function CountdownTimer({ targetDate, onComplete }) {
  const getInitialTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};
    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(getInitialTimeLeft());

  useEffect(() => {
    function calculateTimeLeft() {
      const difference = +new Date(targetDate) - +new Date();
      let timeLeft = {};

      if (difference > 0) {
        timeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      return timeLeft;
    }

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (Object.keys(newTimeLeft).length === 0) {
        onComplete();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  const timerComponents = [];

  Object.keys(timeLeft).forEach((interval) => {
    if (!timeLeft[interval] && interval !== 'seconds') {
      return;
    }

    timerComponents.push(
      <span key={interval} className="countdown-segment">
        <span className="countdown-value">{timeLeft[interval]}</span>
        <span className="countdown-label">{timeLabels[interval]}</span>
      </span>
    );
  });

  if (timerComponents.length === 0) {
    return <span className="countdown-finished">Tayangan segera dimulai !!</span>;
  }

  return (
    <div className="player-overlay countdown-timer">
      <h3>Pertandingan akan dimulai dalam:</h3>
      <div className="countdown-display">
        {timerComponents}
      </div>
    </div>
  );
}

export default CountdownTimer;