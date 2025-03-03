import React, { useState, useEffect, useRef, useMemo } from "react";
import "../styles/MatchPairs.css";
import { useNavigate } from "react-router-dom";

const MatchPairs = () => {
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const timerRef = useRef(null);
  const confettiTimerRef = useRef(null);
  const [timer, setTimer] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [difficulty, setDifficulty] = useState('medium'); // easy, medium, hard
  const [lastMatchedPair, setLastMatchedPair] = useState(null);
  const navigate = useNavigate();

  const navigateToHome = () => {
    navigate("/3DUI");
  };

  // Card designs - modern abstract patterns with improved visuals
  const cardDesigns = useMemo(() => [
    { pattern: "geometric", color: "#4A90E2", id: 1 },
    { pattern: "waves", color: "#50E3C2", id: 2 },
    { pattern: "circles", color: "#F5A623", id: 3 },
    { pattern: "triangles", color: "#D0021B", id: 4 },
    { pattern: "zigzag", color: "#9013FE", id: 5 },
    { pattern: "dots", color: "#7ED321", id: 6 },
    { pattern: "lines", color: "#BD10E0", id: 7 },
    { pattern: "crosses", color: "#4A4A4A", id: 8 },
    { pattern: "stars", color: "#FF5733", id: 9 },
    { pattern: "hexagons", color: "#33A1FD", id: 10 },
    { pattern: "diamonds", color: "#FFC300", id: 11 },
    { pattern: "curves", color: "#C70039", id: 12 },
  ], []);
  
  // Define initializeGame with useCallback
  const initializeGame = React.useCallback(() => {
    // Clear any existing confetti timer
    if (confettiTimerRef.current) {
      clearTimeout(confettiTimerRef.current);
    }
    setShowConfetti(false);
    
    let cardsToUse = [...cardDesigns];
    
    // Adjust number of cards based on difficulty
    if (difficulty === 'easy') {
      cardsToUse = cardsToUse.slice(0, 3); // 3 pairs (3x2 grid)
    } else if (difficulty === 'medium') {
      cardsToUse = cardsToUse.slice(0, 6); // 6 pairs (4x3 grid)
    } else if (difficulty === 'hard') {
      cardsToUse = cardsToUse.slice(0, 8); // 8 pairs (4x4 grid)
    }
    
    // Create pairs of cards
    const cardPairs = [...cardsToUse, ...cardsToUse].map((card, index) => ({
      ...card,
      uniqueId: index,
      isFlipped: false,
      isMatched: false
    }));
    
    // Shuffle cards
    const shuffledCards = shuffleArray([...cardPairs]);
    
    // Set cards state
    setCards(shuffledCards);
    setFlippedCards([]);
    setMatchedPairs([]);
    setLastMatchedPair(null);
    setMoves(0);
    setTimer(0);
    setGameCompleted(false);
    setShowStartScreen(false);
    
    // Console log for debugging
    console.log("Game initialized with", shuffledCards.length, "cards");
    
    // Small delay before setting game started to allow animations
    setTimeout(() => {
      setGameStarted(true);
    }, 500);
  }, [cardDesigns, difficulty]);

  // Timer functionality
  useEffect(() => {
    if (gameStarted && !gameCompleted) {
      timerRef.current = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
      
      // Cleanup function
      return () => {
        clearInterval(timerRef.current);
      };
    }
  }, [gameStarted, gameCompleted]);

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const handleCardClick = (cardIndex) => {
    // Cannot flip more than 2 cards at once or already matched cards
    if (flippedCards.length >= 2 || cards[cardIndex].isMatched || cards[cardIndex].isFlipped) {
      return;
    }

    // Flip the card
    const updatedCards = [...cards];
    updatedCards[cardIndex].isFlipped = true;
    setCards(updatedCards);

    // Add to flipped cards
    const updatedFlippedCards = [...flippedCards, cardIndex];
    setFlippedCards(updatedFlippedCards);

    // Check for match if we have 2 flipped cards
    if (updatedFlippedCards.length === 2) {
      setMoves(prevMoves => prevMoves + 1);
      
      const [firstCardIndex, secondCardIndex] = updatedFlippedCards;
      const firstCard = updatedCards[firstCardIndex];
      const secondCard = updatedCards[secondCardIndex];

      if (firstCard.id === secondCard.id) {
        // Match found
        updatedCards[firstCardIndex].isMatched = true;
        updatedCards[secondCardIndex].isMatched = true;
        
        // Set the last matched pair for animations
        setLastMatchedPair(firstCard.id);
        setTimeout(() => setLastMatchedPair(null), 1500);
        
        const newMatchedPairs = [...matchedPairs, firstCard.id];
        setMatchedPairs(newMatchedPairs);
        setFlippedCards([]);
        
        // Check if game is completed
        if (newMatchedPairs.length === (
          difficulty === 'easy' ? 3 : 
          difficulty === 'medium' ? 6 : 8
        )) {
          setGameCompleted(true);
          setShowConfetti(true);
          clearInterval(timerRef.current);
          
          // Set timeout to hide confetti after 3 seconds
          confettiTimerRef.current = setTimeout(() => {
            setShowConfetti(false);
          }, 3000);
        }
      } else {
        // No match, flip back after delay
        setTimeout(() => {
          updatedCards[firstCardIndex].isFlipped = false;
          updatedCards[secondCardIndex].isFlipped = false;
          setCards([...updatedCards]);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const resetGame = () => {
    // Clear game state and show start screen
    setShowStartScreen(true);
    setGameStarted(false);
    setGameCompleted(false);
    setShowConfetti(false);
    clearInterval(timerRef.current);
    if (confettiTimerRef.current) {
      clearTimeout(confettiTimerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
    };
  }, []);

  return (
    <div className="match-pairs-container">
      {/* Add back button at the top */}
      <div className="back-button-container">
        <button 
          className="back-button"
          onClick={navigateToHome}
          aria-label="Back to 3D UI"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Back to Companio</span>
        </button>
      </div>
      {showHowToPlay && (
            <div className="match-how-to-play-modal"
            onClick={(e) => {
                // Close modal when clicking outside the content area
                if (e.target.className === "match-how-to-play-modal") {
                  setShowHowToPlay(false);
                }
              }}
            >
              <div className="match-how-to-play-content">
                <button 
                  className="match-close-how-to" 
                  onClick={() => setShowHowToPlay(false)}
                  aria-label="Close instructions"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h2>How to Play Memory Match</h2>
                <div className="match-instructions">
                  <h3>Game Objective</h3>
                  <p>Find all matching pairs of cards in the shortest time using the fewest moves.</p>
                  
                  <h3>How to Play</h3>
                  <ol>
                    <li>Click on any card to flip it and reveal its pattern.</li>
                    <li>Click on a second card to try to find its match.</li>
                    <li>If the two cards match, they stay face up.</li>
                    <li>If they don't match, they flip back over.</li>
                    <li>Remember card locations to make fewer moves!</li>
                    <li>The game ends when all pairs have been matched.</li>
                  </ol>
                  
                  <h3>Controls</h3>
                  <div className="match-control-guide">
                    <div className="match-control-item">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>End the current game and return to menu</span>
                    </div>
                    <div className="match-control-item">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                      </svg>
                      <span>Return to the main menu</span>
                    </div>
                    <div className="match-control-item">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      <span>Restart the game with new card positions</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
      {showStartScreen ? (
        <div className="start-screen">
          <h1>Memory Match</h1>
          <p>Test your memory by matching pairs of cards</p>
          
          <div className="difficulty-selector">
            <h3>Select Difficulty</h3>
            <div className="difficulty-options">
              <button 
                className={`difficulty-button ${difficulty === 'easy' ? 'selected' : ''}`} 
                onClick={() => setDifficulty('easy')}
              >
                Easy
              </button>
              <button 
                className={`difficulty-button ${difficulty === 'medium' ? 'selected' : ''}`} 
                onClick={() => setDifficulty('medium')}
              >
                Medium
              </button>
              <button 
                className={`difficulty-button ${difficulty === 'hard' ? 'selected' : ''}`} 
                onClick={() => setDifficulty('hard')}
              >
                Hard
              </button>
            </div>
          </div>
          
          <button className="start-button" onClick={initializeGame}>
            Start Game
          </button>
          <button 
            className="info-button"
            onClick={() => setShowHowToPlay(true)}
            aria-label="How to play"
            title="How to play"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </button>
        </div>
      ) : (
        <>
          <div className="game-header">
            <h1>Memory Match</h1>
            <div className="game-stats">
              <div className="stat-item">
                <span className="stat-label">Moves:</span>
                <span className="stat-value">{moves}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Time:</span>
                <span className="stat-value">{formatTime(timer)}</span>
              </div>
            </div>
          </div>
          {gameCompleted && (
            <div className="win-message">
              <h2>Congratulations! 🎉</h2>
              <p>You completed the game in {moves} moves and {formatTime(timer)}!</p>
              <div className="win-buttons">
                <button className="restart-button" onClick={initializeGame}>
                  Play Again
                </button>
                <button className="menu-button" onClick={resetGame}>
                  Main Menu
                </button>
              </div>
            </div>
          )}
          
          {showConfetti && (
            <div className="confetti-container">
              {Array.from({ length: 150 }).map((_, i) => {
                const size = Math.random() * 10 + 5;
                const angle = Math.random() * 360;
                const cardColor = cardDesigns[Math.floor(Math.random() * cardDesigns.length)].color;
                
                return (
                  <div 
                    key={i} 
                    className="confetti"
                    style={{
                      left: `${Math.random() * 100}%`,
                      width: `${size}px`,
                      height: `${size * 1.5}px`,
                      animationDelay: `${Math.random() * 5}s`,
                      animationDuration: `${Math.random() * 3 + 3}s`,
                      backgroundColor: cardColor,
                      transform: `rotate(${angle}deg)`,
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Memory game grid with cards */}
          <div className={`memory-game ${difficulty}`}>
            {cards && cards.length > 0 ? (
              cards.map((card, index) => (
                <div
                  key={card.uniqueId}
                  className={`memory-card 
                    ${card.isFlipped ? 'flipped' : ''} 
                    ${card.isMatched ? 'matched' : ''} 
                    ${card.isMatched && card.id === lastMatchedPair ? 'match-animation' : ''}`
                  }
                  onClick={() => handleCardClick(index)}
                >
                  <div className="memory-card-inner">
                    <div className="memory-card-back">
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
                      </svg>
                    </div>
                    <div className="memory-card-front" style={{ backgroundColor: card.color }}>
                      {card.pattern === "geometric" && (
                        <svg viewBox="0 0 24 24">
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" />
                        </svg>
                      )}
                      {card.pattern === "waves" && (
                        <svg viewBox="0 0 24 24">
                          <path d="M2,12 Q7,8 12,12 T22,12" strokeWidth="2" fill="none" />
                          <path d="M2,17 Q7,13 12,17 T22,17" strokeWidth="2" fill="none" />
                          <path d="M2,7 Q7,3 12,7 T22,7" strokeWidth="2" fill="none" />
                        </svg>
                      )}
                      {card.pattern === "circles" && (
                        <svg viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="5" />
                          <circle cx="12" cy="12" r="9" fill="none" strokeWidth="2" />
                        </svg>
                      )}
                      {card.pattern === "triangles" && (
                        <svg viewBox="0 0 24 24">
                          <polygon points="12,3 20,18 4,18" />
                        </svg>
                      )}
                      {card.pattern === "zigzag" && (
                        <svg viewBox="0 0 24 24">
                          <polyline points="2,7 7,12 2,17 7,22 12,17 17,22 22,17 17,12 22,7" strokeWidth="2" fill="none" />
                        </svg>
                      )}
                      {card.pattern === "dots" && (
                        <svg viewBox="0 0 24 24">
                          <circle cx="6" cy="6" r="2" />
                          <circle cx="12" cy="6" r="2" />
                          <circle cx="18" cy="6" r="2" />
                          <circle cx="6" cy="12" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="18" cy="12" r="2" />
                          <circle cx="6" cy="18" r="2" />
                          <circle cx="12" cy="18" r="2" />
                          <circle cx="18" cy="18" r="2" />
                        </svg>
                      )}
                      {card.pattern === "lines" && (
                        <svg viewBox="0 0 24 24">
                          <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2" stroke="white" />
                          <line x1="20" y1="4" x2="4" y2="20" strokeWidth="2" stroke="white" />
                          <line x1="12" y1="2" x2="12" y2="22" strokeWidth="2" stroke="white" />
                        </svg>
                      )}
                      {card.pattern === "crosses" && (
                        <svg viewBox="0 0 24 24">
                          <path d="M5,5 L19,19 M19,5 L5,19" strokeWidth="3" stroke="white" fill="none" />
                        </svg>
                      )}
                      {card.pattern === "stars" && (
                        <svg viewBox="0 0 24 24">
                          <path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.1-6.3-4.6-6.3 4.6 2.3-7.1-6-4.4h7.6z" />
                        </svg>
                      )}
                      {card.pattern === "hexagons" && (
                        <svg viewBox="0 0 24 24">
                          <path d="M12,3 L20,8 L20,16 L12,21 L4,16 L4,8 z" />
                        </svg>
                      )}
                      {card.pattern === "diamonds" && (
                        <svg viewBox="0 0 24 24">
                          <rect x="12" y="1" width="10" height="10" transform="rotate(45 12 12)" />
                        </svg>
                      )}
                      {card.pattern === "curves" && (
                        <svg viewBox="0 0 24 24">
                          <path d="M4,12 C8,4 16,4 20,12 C16,20 8,20 4,12 z" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-cards-message">Loading cards...</div>
            )}
          </div>

          <div className="match-controls">
            <button 
              className="match-control-button end-game"
              onClick={resetGame}
              aria-label="End game"
              title="End game and return to menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button 
              className="match-control-button info-button"
              onClick={() => setShowHowToPlay(true)}
              aria-label="How to play"
              title="How to play"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </button>
            <button 
              className="match-control-button"
              onClick={resetGame}
              aria-label="Back to menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <button 
              className="match-control-button"
              onClick={initializeGame}
              aria-label="Restart game"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MatchPairs;