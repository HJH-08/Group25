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

            {showStartScreen ? (
                <div className="start-screen">
                    <h1>Simon Game</h1>
                    <p>Test your memory! Follow the pattern of lights and sounds.</p>
                    <p className="high-score">High Score: {highScore}</p>
                    <button className="start-button" onClick={startGame}>
                        Start Game
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
                    <div className="controls">
                        <button 
                            className="control-button"
                            onClick={startGame}
                            disabled={isPlayingPattern && !gameOver}
                        >
                            New Game
                        </button>

                        <button 
                            className="control-button end-game"
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
                        src="https://s3.amazonaws.com/freecodecamp/simonSound1.mp3" 
                        preload="auto"
                    ></audio>
                    <audio 
                        ref={clip2Ref} 
                        src="https://s3.amazonaws.com/freecodecamp/simonSound2.mp3" 
                        preload="auto"
                    ></audio>
                    <audio 
                        ref={clip3Ref} 
                        src="https://s3.amazonaws.com/freecodecamp/simonSound3.mp3" 
                        preload="auto"
                    ></audio>
                    <audio 
                        ref={clip4Ref} 
                        src="https://s3.amazonaws.com/freecodecamp/simonSound4.mp3" 
                        preload="auto"
                    ></audio>
                </>
            )}
        </div>
    );
}

export default SimonGame;