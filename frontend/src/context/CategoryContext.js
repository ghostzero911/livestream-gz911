import React, { createContext, useState } from 'react';

export const CategoryContext = createContext(null);

export const CategoryProvider = ({ children }) => {
  const [activeCategory, setActiveCategory] = useState(''); // Default to soccer

  return (
    <CategoryContext.Provider value={{ activeCategory, setActiveCategory }}>
      {children}
    </CategoryContext.Provider>
  );
};