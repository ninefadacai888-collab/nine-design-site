import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit'>('enter');
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      // Route changed — fade out, then swap content and fade in
      setTransitionStage('exit');
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  const handleAnimationEnd = () => {
    if (transitionStage === 'exit') {
      setDisplayChildren(children);
      setTransitionStage('enter');
    }
  };

  // Keep children in sync when no transition is happening (e.g., same-page state updates)
  useEffect(() => {
    if (transitionStage === 'enter') {
      setDisplayChildren(children);
    }
  }, [children, transitionStage]);

  return (
    <div
      className={transitionStage === 'enter' ? 'page-transition-enter' : 'page-transition-exit'}
      onAnimationEnd={handleAnimationEnd}
    >
      {displayChildren}
    </div>
  );
};

export default PageTransition;