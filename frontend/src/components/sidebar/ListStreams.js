import React, { use, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { fetchData } from '../../data';
//import { CategoryContext } from '../../context/CategoryContext';
import './Sidebar.css';

function ListStreams({ type }) {
  //const { activeCategory } = use(CategoryContext);
  //const paramsCategory = activeCategory ? `?category=${activeCategory}` : '';
  const listStreamPromise = fetchData(`/api/streams/live`);

  return (
    <div className="sidebar-widget">
      <h3>{type === 'stream' ? 'Siaran Langsung' : 'Live TV Channel'}</h3>
      <Suspense fallback={<div className="loading-info">Loading...</div>}>
        <StreamList promise={listStreamPromise} type={type} />
      </Suspense>
    </div>
  );
}

function StreamList({ promise, type }) {
  const streams = use(promise);

  // const onSchedule = (schedule) => {
  //   const now = new Date();
  //   const scheduledTime = schedule ? new Date(schedule) : null;
  //   return !!(now < scheduledTime);
  // }

  // const sortedStreams = type === 'scheduled'
  //   ? streams.filter(stream => onSchedule(stream.scheduled_start_time))
  //   : streams.filter(stream => !onSchedule(stream.scheduled_start_time));

  const sortedStreams = type === 'stream'
     ? streams.filter(stream => stream.category !== "others")
     : streams.filter(stream => stream.category === "others");

  if (sortedStreams.length === 0) {
    return <div className="sidebar-item-empty">Tidak ada video.</div>;
  }

  return (
    <ul className="sidebar-list">
      {sortedStreams.map(stream => (
        <li key={stream.id} className="sidebar-item">
          <Link to={`/stream/${stream.slug}`}>
            <img src={stream.thumbnail_url} alt="thumbnail" className="sidebar-item-thumbnail" />
            <div className="sidebar-item-info">
              {/* {type === 'scheduled' &&
                <span className="sidebar-item-title">
                  {new Date(stream.scheduled_start_time).toLocaleString('id-ID', { dateStyle: 'medium', hourCycle: 'h24', timeStyle: 'short' })} WIB
                </span>
              } */}
              <span className="sidebar-item-title">{stream.title}</span>
              <span className="sidebar-item-category">{stream.host}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default ListStreams;