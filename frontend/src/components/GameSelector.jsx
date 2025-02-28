import React from 'react';
import { useNavigate } from 'react-router-dom';

const GameSelector = ({ show, onClose }) => {
  const navigate = useNavigate();

  const handleGameSelect = (gamePath) => {
    navigate(gamePath);
  };

  return (
    <div className={`game-selector ${show ? 'show' : ''}`}>
      <h3>Mini Games</h3>
      <div className="games-wheel">
        <div 
          className="game-option"
          onClick={() => handleGameSelect('/match-pairs')}
        >
          <div className="game-preview memory-match-bg">
            <span>Memory Match</span>
          </div>
          <p className="game-description">Train your memory by matching pairs of cards</p>
        </div>
        
        {/* More games can be added here in the future */}
        
      </div>
    </div>
  );
};

export default GameSelector;