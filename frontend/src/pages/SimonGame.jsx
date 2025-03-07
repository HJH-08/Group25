import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SimonGame.css';

function SimonGame() {
    const navigate = useNavigate();
    
    // Game state
    const [pattern, setPattern] = useState([]);
    const [userPattern, setUserPattern] = useState([]);
    const [level, setLevel] = useState(0);
    const [isPlayingPattern, setIsPlayingPattern] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [highScore, setHighScore] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);
    const [showStartScreen, setShowStartScreen] = useState(true);
    const [showHowToPlay, setShowHowToPlay] = useState(false);
    
    // Refs for DOM elements
    const topLeftRef = useRef(null);
    const topRightRef = useRef(null);
    const bottomLeftRef = useRef(null);
    const bottomRightRef = useRef(null);
    const clip1Ref = useRef(null);
    const clip2Ref = useRef(null);
    const clip3Ref = useRef(null);
    const clip4Ref = useRef(null);
    
    // Timer refs for cleanup
    const patternTimers = useRef([]);
    const confettiTimer = useRef(null);
    
    // Load high score on component mount
    useEffect(() => {
        const savedScore = localStorage.getItem('simonHighScore');
        if (savedScore) {
            setHighScore(parseInt(savedScore, 10));
        }
    }, []);
    
    // Clean up timers when component unmounts
    useEffect(() => {
        return () => {
            patternTimers.current.forEach(timer => clearTimeout(timer));
            if (confettiTimer.current) clearTimeout(confettiTimer.current);
        };
    }, []);
    
    const navigateToHome = () => {
        navigate('/3DUI');
    };
    
    // Start a new game
    const startGame = () => {
        setShowStartScreen(false);
        setGameStarted(true);
        setGameOver(false);
        setLevel(1);
        setPattern([]);
        setUserPattern([]);
        
        // Start with one random pattern
        const newPattern = [generateRandomPad()];
        setPattern(newPattern);
        
        // Wait a moment before showing the pattern
        setTimeout(() => {
            playPattern(newPattern);
        }, 1000);
    };
    
    // Generate a random pad number (1-4)
    const generateRandomPad = () => {
        return Math.floor(Math.random() * 4) + 1;
    };
    
    // Play the current pattern sequence
    const playPattern = (patternToPlay) => {
        setIsPlayingPattern(true);
        setUserPattern([]);
        
        // Clear any existing timers
        patternTimers.current.forEach(timer => clearTimeout(timer));
        patternTimers.current = [];
        
        // Play each step in the pattern with timing
        patternToPlay.forEach((pad, index) => {
            const timer = setTimeout(() => {
                activatePad(pad);
                
                // Check if this is the last pad in the sequence
                if (index === patternToPlay.length - 1) {
                    const endTimer = setTimeout(() => {
                        setIsPlayingPattern(false);
                    }, 700);
                    patternTimers.current.push(endTimer);
                }
            }, index * 700);
            patternTimers.current.push(timer);
        });
    };
    
    // Handle when user clicks a pad
    const handlePadClick = (padNumber) => {
        // Ignore clicks when game is not started or when pattern is playing
        if (!gameStarted || isPlayingPattern || gameOver) return;
        
        activatePad(padNumber);
        
        // Add to user's pattern
        const newUserPattern = [...userPattern, padNumber];
        setUserPattern(newUserPattern);
        
        // Check if user's input matches the pattern so far
        const currentIndex = newUserPattern.length - 1;
        
        if (pattern[currentIndex] !== newUserPattern[currentIndex]) {
            // User made a mistake
            handleGameOver();
            return;
        }
        
        // Check if user completed the current pattern successfully
        if (newUserPattern.length === pattern.length) {
            // User completed the pattern
            handleSuccess();
        }
    };
    
    // Handle when user successfully completes a pattern
    const handleSuccess = () => {
        // Check for milestone (every 5 levels)
        if (level % 5 === 0) {
            celebrateMilestone();
        }
        
        // Increase level
        const newLevel = level + 1;
        setLevel(newLevel);
        
        // Add a new step to the pattern
        const newPattern = [...pattern, generateRandomPad()];
        setPattern(newPattern);
        
        // Clear user pattern
        setUserPattern([]);
        
        // Wait a moment before showing the new pattern
        setTimeout(() => {
            playPattern(newPattern);
        }, 1000);
        
        // Update high score if needed
        if (newLevel > highScore) {
            setHighScore(newLevel);
            localStorage.setItem('simonHighScore', newLevel.toString());
        }
    };
    
    // Handle when user makes a mistake
    const handleGameOver = () => {
        // Flash all pads to indicate error
        flashAllPads();
        
        // Set game over state
        setGameOver(true);
        
        // Play error sound
        playErrorSound();
    };
    
    // Flash all pads simultaneously (for errors)
    const flashAllPads = () => {
        if (topLeftRef.current) topLeftRef.current.classList.add('lit');
        if (topRightRef.current) topRightRef.current.classList.add('lit');
        if (bottomLeftRef.current) bottomLeftRef.current.classList.add('lit');
        if (bottomRightRef.current) bottomRightRef.current.classList.add('lit');
        
        setTimeout(() => {
            if (topLeftRef.current) topLeftRef.current.classList.remove('lit');
            if (topRightRef.current) topRightRef.current.classList.remove('lit');
            if (bottomLeftRef.current) bottomLeftRef.current.classList.remove('lit');
            if (bottomRightRef.current) bottomRightRef.current.classList.remove('lit');
        }, 300);
    };
    
    // Play error sound
    const playErrorSound = () => {
        // Play all sounds together for error effect
        if (clip1Ref.current) {
            clip1Ref.current.currentTime = 0;
            clip1Ref.current.play().catch(e => console.log("Audio error:", e));
        }
        if (clip2Ref.current) {
            clip2Ref.current.currentTime = 0;
            clip2Ref.current.play().catch(e => console.log("Audio error:", e));
        }
    };
    
    // Activate a specific pad with light and sound
    const activatePad = (padNumber) => {
        // Play sound
        if (padNumber === 1 && clip1Ref.current) {
            clip1Ref.current.currentTime = 0;
            clip1Ref.current.play().catch(e => console.log("Audio error:", e));
        }
        if (padNumber === 2 && clip2Ref.current) {
            clip2Ref.current.currentTime = 0;
            clip2Ref.current.play().catch(e => console.log("Audio error:", e));
        }
        if (padNumber === 3 && clip3Ref.current) {
            clip3Ref.current.currentTime = 0;
            clip3Ref.current.play().catch(e => console.log("Audio error:", e));
        }
        if (padNumber === 4 && clip4Ref.current) {
            clip4Ref.current.currentTime = 0;
            clip4Ref.current.play().catch(e => console.log("Audio error:", e));
        }
        
        // Light up pad
        if (padNumber === 1 && topLeftRef.current) topLeftRef.current.classList.add('lit');
        if (padNumber === 2 && topRightRef.current) topRightRef.current.classList.add('lit');
        if (padNumber === 3 && bottomLeftRef.current) bottomLeftRef.current.classList.add('lit');
        if (padNumber === 4 && bottomRightRef.current) bottomRightRef.current.classList.add('lit');
        
        // Turn off light after delay
        setTimeout(() => {
            if (padNumber === 1 && topLeftRef.current) topLeftRef.current.classList.remove('lit');
            if (padNumber === 2 && topRightRef.current) topRightRef.current.classList.remove('lit');
            if (padNumber === 3 && bottomLeftRef.current) bottomLeftRef.current.classList.remove('lit');
            if (padNumber === 4 && bottomRightRef.current) bottomRightRef.current.classList.remove('lit');
        }, 300);
    };
    
    // Celebration for milestone achievements
    const celebrateMilestone = () => {
        setShowConfetti(true);
        
        confettiTimer.current = setTimeout(() => {
            setShowConfetti(false);
        }, 3000);
    };
    
    // Go back to main menu
    const goToMenu = () => {
        setShowStartScreen(true);
        setGameStarted(false);
        setGameOver(false);
    };
    
    // Try again after game over
    const tryAgain = () => {
        setGameOver(false);
        setUserPattern([]);
        
        // Replay the same pattern
        setTimeout(() => {
            playPattern(pattern);
        }, 1000);
    };
    
    // Generate confetti for celebrations
    const renderConfetti = () => {
        return Array.from({ length: 150 }).map((_, i) => {
            const colors = ["#66c2a5", "#fc8d59", "#fee08b", "#8da0cb", "#4A90E2"];
            const size = Math.random() * 10 + 5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const angle = Math.random() * 360;
            
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
                        backgroundColor: color,
                        transform: `rotate(${angle}deg)`,
                    }}
                />
            );
        });
    };

    return (
        <div className="simon-game-container">
            {/* Back button */}
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
            {/* How to Play Modal */}
            {showHowToPlay && (
                <div className="simon-how-to-play-modal"
                    onClick={(e) => {
                        // Close modal when clicking outside the content area
                        if (e.target.className === "simon-how-to-play-modal") {
                            setShowHowToPlay(false);
                        }
                    }}
                >
                    <div className="simon-how-to-play-content">
                        <button 
                            className="simon-close-how-to" 
                            onClick={() => setShowHowToPlay(false)}
                            aria-label="Close instructions"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h2>How to Play Simon</h2>
                        <div className="simon-instructions">
                            <h3>Game Objective</h3>
                            <p>Simon Game is a memory game where you need to remember and repeat a growing sequence of colours and sounds.</p>
                            
                            <h3>How to Play</h3>
                            <ol>
                                <li>Watch as Simon lights up a sequence of coloured pads.</li>
                                <li>After the sequence plays, repeat it by clicking the pads in the same order.</li>
                                <li>Each round, Simon adds one more step to the pattern.</li>
                                <li>If you make a mistake, the game is over.</li>
                                <li>Try to beat your high score by remembering longer sequences!</li>
                            </ol>
                            
                            <h3>The Game Board</h3>
                            <p>The Simon board consists of four colored pads:</p>
                            <ul>
                                <li>Green (top-left)</li>
                                <li>Red (top-right)</li>
                                <li>Yellow (bottom-left)</li>
                                <li>Blue (bottom-right)</li>
                            </ul>
                            
                            <h3>Controls</h3>
                            <div className="simon-control-guide">
                                <div className="simon-control-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                                    </svg>
                                    <span>New Game: Start a fresh game with a new pattern</span>
                                </div>
                                <div className="simon-control-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                    </svg>
                                    <span>Menu: Return to the main menu</span>
                                </div>
                                <div className="simon-control-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                    </svg>
                                    <span>How to Play: Open this instructions panel</span>
                                </div>
                            </div>
                            
                            <h3>Tips</h3>
                            <ul>
                                <li>Try to associate sounds with colors to remember the sequence better.</li>
                                <li>Start slow and build confidence with shorter sequences.</li>
                                <li>Pay close attention during the "Watch" phase.</li>
                                <li>Every 5 levels, you'll get a special celebration!</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {showStartScreen ? (
                <div className="start-screen">
                    <h1>Simon Game</h1>
                    <p>Test your memory! Follow the pattern of lights and sounds.</p>
                    <p className="high-score">High Score: {highScore}</p>
                    <button className="simon-start-button" onClick={startGame}>
                        Start Game
                    </button>
                    <button 
                        className="simon-info-button"
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
                        <h1>Simon Game</h1>
                        <div className="game-stats">
                            <div className="stat-item">
                                <span className="stat-label">Level</span>
                                <span className="stat-value">{level}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">High Score</span>
                                <span className="stat-value">{highScore}</span>
                            </div>
                        </div>
                    </div>

                    {/* Game over message */}
                    {gameOver && (
                        <div className="win-message">
                            <h2>Game Over!</h2>
                            <p>You reached level {level}</p>
                            <div className="win-buttons">
                                <button className="restart-button" onClick={tryAgain}>
                                    Try Again
                                </button>
                                <button className="restart-button" onClick={startGame}>
                                    New Game
                                </button>
                                <button className="menu-button" onClick={goToMenu}>
                                    Main Menu
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Simon game board */}
                    <div className="simon-board">
                        <div className="simon-pads">
                            <div 
                                id="topleft" 
                                className="pad" 
                                ref={topLeftRef}
                                onClick={() => handlePadClick(1)}
                            ></div>
                            <div 
                                id="topright" 
                                className="pad" 
                                ref={topRightRef}
                                onClick={() => handlePadClick(2)}
                            ></div>
                            <div 
                                id="bottomleft" 
                                className="pad" 
                                ref={bottomLeftRef}
                                onClick={() => handlePadClick(3)}
                            ></div>
                            <div 
                                id="bottomright" 
                                className="pad" 
                                ref={bottomRightRef}
                                onClick={() => handlePadClick(4)}
                            ></div>
                            <div className="center-circle">
                                <div className="turn-counter">{level}</div>
                                <div>{isPlayingPattern ? 'Watch' : 'Your Turn'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Game controls */}
                    <div className="simon-controls">
                        <button 
                            className="simon-control-button"
                            onClick={startGame}
                            disabled={isPlayingPattern && !gameOver}
                        >
                            New Game
                        </button>
                        <button 
                            className="simon-control-button simon-info-button"
                            onClick={() => setShowHowToPlay(true)}
                            aria-label="How to play"
                            title="How to play"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                            </svg>
                        </button>
                        <button 
                            className="simon-control-button end-game"
                            onClick={goToMenu}
                        >
                            Menu
                        </button>
                    </div>

                    {/* Confetti for milestone celebration */}
                    {showConfetti && (
                        <div className="confetti-container">
                            {renderConfetti()}
                        </div>
                    )}

                    {/* Hidden audio elements for game sounds */}
                    <audio 
                        ref={clip1Ref} 
                        src="/beeps/beep1.mp3" 
                        preload="auto"
                    ></audio>
                    <audio 
                        ref={clip2Ref} 
                        src="/beeps/beep2.mp3" 
                        preload="auto"
                    ></audio>
                    <audio 
                        ref={clip3Ref} 
                        src="/beeps/beep3.mp3" 
                        preload="auto"
                    ></audio>
                    <audio 
                        ref={clip4Ref} 
                        src="/beeps/beep4.mp3" 
                        preload="auto"
                    ></audio>
                </>
            )}
        </div>
    );
}

export default SimonGame;