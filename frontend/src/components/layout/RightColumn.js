import React from 'react';
import ListStreams from '../sidebar/ListStreams';
import LatestNews from '../sidebar/LatestNews';
import AdDisplay from '../sidebar/AdDisplay';
import '../sidebar/Sidebar.css';

function RightColumn({ activeCategory }) {
  return (
    <aside className="right-column">
      <AdDisplay placementName="Sidebar 1" adsWidth="400" adsHeight="80"/>
      <ListStreams type="stream"/>
      <AdDisplay placementName="Sidebar 2" adsWidth="400" adsHeight="80"/>
      <ListStreams type="livetv"/> 
      <AdDisplay placementName="Sidebar 3" adsWidth="400" adsHeight="80"/>
      <LatestNews category={activeCategory} />
    </aside>
  );
}

export default RightColumn;