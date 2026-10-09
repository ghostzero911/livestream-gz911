import React from 'react';
//import { CategoryContext } from '../../context/CategoryContext';
import './Layout.css';

function LeftColumnTabs({ tabList, tabChange, tabActive }) {
  //const { activeCategory, setActiveCategory } = use(CategoryContext);

  return (
    <div className="tab-navigation">
      {[...tabList].map(([id, name]) => (
        <button
          key={id}
          className={tabActive === id ? 'active' : ''}
          onClick={() => tabChange(id)}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

export default LeftColumnTabs;