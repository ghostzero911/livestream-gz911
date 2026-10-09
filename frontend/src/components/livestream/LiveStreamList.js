import React, { useState, use, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchData } from '../../data';
// import { CategoryContext } from '../../context/CategoryContext';
import LeftColumnTabs from '../layout/LeftColumnTabs';
import './LiveStream.css';

function LiveStreamList() {
  const [ activeCategory, setActiveCategory ] = useState('others');

  const tabCategory = new Map([
    ['others', 'Live TV'],
    ['soccer', 'Sepakbola'],
    ['basket', 'Basket'],
    ['sports', 'Lainnya']
  ]); 
  
  const paramsCategory = activeCategory ? `?category=${activeCategory}` : '';
  const listStreamPromise = fetchData(`/api/streams/live${paramsCategory}`);

  return (
    <>
      <Helmet>
        <title>Live Streaming dan TV Olahraga - TV Bolaku</title>
        <meta
          name="description"
          content="Nonton live streaming bola dan saluran TV olahraga gratis hanya di TV Bolaku online."
        />
      </Helmet>
      <LeftColumnTabs tabList={tabCategory} tabChange={setActiveCategory} tabActive={activeCategory}/>
      <div className="tab-content">
        <Suspense fallback={<div className="loading-info">Loading...</div>}>
          <StreamList promise={listStreamPromise} />
        </Suspense>
      </div>
    </>
  );
}

function StreamList({ promise }) {
  const streams = use(promise);

  const onSchedule = (schedule) => {
    const now = new Date();
    const scheduledTime = schedule ? new Date(schedule) : null;
    return !!(now < scheduledTime);
  }

  if (streams.length === 0) {
    return <em>Tidak ada video.</em>;
  }

  return (
    <div className="livestream-list-container">
      {streams.map(stream => (
        <Link to={`/stream/${stream.slug}`} key={stream.id} className="stream-card">
          <div className="stream-thumbnail-wrapper">
            <img src={stream.thumbnail_url} alt="Stream thumbnail" />
            <span className="live-badge">{onSchedule(stream.scheduled_start_time) ? 'SEGERA' : 'LIVE'}</span>
          </div>
          <div className="stream-info">
            <h4 className="stream-title">{stream.title}</h4>
            <span className="stream-category">{stream.host}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default LiveStreamList;