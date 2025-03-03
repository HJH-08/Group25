import React from 'react';

const BackgroundSwitcher = ({ currentBackground, onSelectBackground, show }) => {
  return (
    <div className={`background-selector ${show ? 'show' : ''}`}>
      <div className="background-options">
        <div 
          className={`background-option ${currentBackground === 'default' ? 'selected' : ''}`}
          onClick={() => onSelectBackground('default')}
        >
          <div className="background-preview default-bg">
            <span>Daylight</span>
          </div>
        </div>
        <div 
          className={`background-option ${currentBackground === 'sunset' ? 'selected' : ''}`}
          onClick={() => onSelectBackground('sunset')}
        >
          <div className="background-preview sunset-bg">
            <span>Sunset</span>
          </div>
        </div>
        <div 
          className={`background-option ${currentBackground === 'night' ? 'selected' : ''}`}
          onClick={() => onSelectBackground('night')}
        >
          <div className="background-preview night-bg">
            <span>Night</span>
          </div>
        </div>
        <div 
          className={`background-option ${currentBackground === 'dream' ? 'selected' : ''}`}
          onClick={() => onSelectBackground('dream')}
        >
          <div className="background-preview dream-bg">
            <span>Dream</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundSwitcher;