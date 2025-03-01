import React, { useState, useRef, useEffect } from "react";
// Third party imports
import { Canvas } from "@react-three/fiber";
import { Loader } from "@react-three/drei";
// Local imports
import { ChatProvider, useChat } from "../hooks/useChat";
import { Experience } from "../components/Experience";
import ChatBox from "../components/ChatBox";
import BackgroundSwitcher from "../components/BackgroundSwitcher";
import GameSelector from "../components/GameSelector";
// Styles
import "../styles/3DUI.css";

const ThreeDimensionalContent = () => { 
  // State management
  const { chat, messages, loading } = useChat();
  const [userInput, setUserInput] = useState("");
  const [cameraZoomed, setCameraZoomed] = useState(true);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [backgroundType, setBackgroundType] = useState("default");
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [showGameSelector, setShowGameSelector] = useState(false);

   // Refs for detecting clicks outside
   const chatBoxRef = useRef(null);
   const backgroundSelectorRef = useRef(null);
   const gameSelectorRef = useRef(null);
   const backgroundToggleRef = useRef(null);
   const gameToggleRef = useRef(null);

  /**
   * Handles sending a new chat message
   */
  const handleSendMessage = () => {
    if (userInput.trim() === "") return;
    
    chat(userInput);
    setUserInput("");
  };

  // Toggle background selector visibility
  const toggleBackgroundSelector = () => {
    setShowBackgroundSelector(prev => !prev);
    // Close game selector if it's open
    if (showGameSelector) setShowGameSelector(false);
  };

  // Toggle game selector visibility
  const toggleGameSelector = () => {
    setShowGameSelector(prev => !prev);
    // Close background selector if it's open
    if (showBackgroundSelector) setShowBackgroundSelector(false);
  };

  // Handle background selection
  const handleSelectBackground = (type) => {
    setBackgroundType(type);
    setShowBackgroundSelector(false);
  };

  // Handle clicks outside of menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Handle ChatBox
      if (chatExpanded && 
        chatBoxRef.current && 
        !chatBoxRef.current.contains(event.target)) {
      setChatExpanded(false);
    }
      
      // Handle Background Selector
      if (showBackgroundSelector && 
          backgroundSelectorRef.current && 
          !backgroundSelectorRef.current.contains(event.target) &&
          backgroundToggleRef.current && 
          !backgroundToggleRef.current.contains(event.target)) {
        setShowBackgroundSelector(false);
      }
      
      // Handle Game Selector
      if (showGameSelector && 
          gameSelectorRef.current && 
          !gameSelectorRef.current.contains(event.target) &&
          gameToggleRef.current && 
          !gameToggleRef.current.contains(event.target)) {
        setShowGameSelector(false);
      }
    };

    // Add event listener when any menu is open
    if (chatExpanded || showBackgroundSelector || showGameSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    } 
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [chatExpanded, showBackgroundSelector, showGameSelector]);

  return (
    <>
      <Loader />
      
      <div className="welcome-banner">
        <h1>Welcome to Companio</h1>
        <p>Your interactive 3D companion</p>
      </div>
      
      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 30 }}
        style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%" }}
      >
        <Experience cameraZoomed={cameraZoomed} backgroundType={backgroundType} />
      </Canvas>
      
      <div className={`chatbox-container-wrapper ${chatExpanded ? "expanded" : "collapsed"}`}
      ref={chatBoxRef}>
        {chatExpanded ? (
          <>
            <div className="chatbox-header">
              <button 
                className="chatbox-close-button" 
                onClick={() => setChatExpanded(false)}
                aria-label="Collapse chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ChatBox
              messages={messages}
              userInput={userInput}
              setUserInput={setUserInput}
              handleSendMessage={handleSendMessage}
              isLoading={loading}
            />
          </>
        ) : (
          <button 

            onClick={() => setChatExpanded(true)}
            className="chat-toggle-button"
            aria-label="Expand chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="ui-layer">
      <button
          ref={gameToggleRef}
          onClick={toggleGameSelector}
          className="games-button"
          aria-label="Open games"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
          </svg>
        </button>
        <div className="controls-panel">
          <button
            onClick={() => setCameraZoomed(!cameraZoomed)}
            className="control-button zoom-button"
            aria-label="Toggle zoom"
          >
            {cameraZoomed ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
              </svg>
            )}
          </button>
          <button
            ref={backgroundToggleRef}
            onClick={toggleBackgroundSelector}
            className="control-button background-button"
            aria-label="Change background"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div ref={backgroundSelectorRef}>
      <BackgroundSwitcher 
        show={showBackgroundSelector}
        currentBackground={backgroundType}
        onSelectBackground={handleSelectBackground}
      />
      </div>

    <div ref={gameSelectorRef}>
      <GameSelector
        show={showGameSelector}
        onClose={() => setShowGameSelector(false)}
      />
      </div>
    </>
  );
};

const ThreeDPage = () => (
  <ChatProvider>
    <ThreeDimensionalContent />
  </ChatProvider>
);

export default ThreeDPage;