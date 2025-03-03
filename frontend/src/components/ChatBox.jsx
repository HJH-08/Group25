import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "../styles/ChatBox.css";
import { useChat } from "../hooks/useChat";
import { useModel } from "../hooks/useModel";
import { useVoice } from "../hooks/useVoice";

const ChatBox = ({ messages, userInput, setUserInput, handleSendMessage, isLoading }) => {
  const messagesEndRef = useRef(null);
  const { connectionStatus } = useChat();
  const { modelConfig } = useModel();
  const { 
    isRecording, 
    isSpeaking, 
    recognizedText, 
    startRecording,
    stopRecording 
  } = useVoice();

  // Update user input when speech recognition provides text
  useEffect(() => {
    if (recognizedText) {
      setUserInput(recognizedText);
    }
  }, [recognizedText, setUserInput]);

  // Auto-scroll to bottom whenever new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Render message helper function
  const renderMessage = (message, index) => {
    if (message.sender === 'system') {
      return (
        <div key={index} className="message system-message">
          {message.text}
        </div>
      );
    } else if (message.sender === 'user') {
      return (
        <div key={index} className="message user-message">
          {message.text}
        </div>
      );
    } else {
      return (
        <div key={index} className="message ai-message">
          {message.text}
        </div>
      );
    }
  };

  const getModelDisplayInfo = () => {
    if (!modelConfig) return null;
    
    const mode = modelConfig.use_ollama ? "offline" : "online";
    const modelName = modelConfig.current_model_name || modelConfig.current_model;
    
    return { mode, modelName };
  };

  const modelDisplayInfo = getModelDisplayInfo();

  return (
    <div className="chatbox-container">
      {connectionStatus !== "connected" && (
        <div className={`connection-status ${connectionStatus}`}>
          {connectionStatus === "connecting" ? (
            <>Connecting to AI service...</>
          ) : connectionStatus === "error" ? (
            <>Connection error. Please check your backend server.</>
          ) : null}
        </div>
      )}
      <div className="chat-messages">
        {messages.map((msg, index) => renderMessage(msg, index))}
        {isLoading && <div className="message ai-message typing">Companio is typing<span>.</span><span>.</span><span>.</span></div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-container">
        <input
          className="chat-input"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? "Listening..." : "Type your message..."}
          disabled={connectionStatus !== "connected" || isLoading || isSpeaking}
        />
        
        {/* Microphone button */}
        <button 
          className={`speech-button ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
          disabled={connectionStatus !== "connected" || isLoading || isSpeaking}
          title={isRecording ? "Stop recording" : "Start recording"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </button>
        
        <button 
          className="send-button"
          onClick={handleSendMessage}
          disabled={connectionStatus !== "connected" || isLoading || isSpeaking || !userInput.trim()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
      {modelDisplayInfo && (
        <div className="model-info">
          Using {modelDisplayInfo.mode} model: {modelDisplayInfo.modelName}
        </div>
      )}
    </div>
  );
};

// PropTypes remain the same
ChatBox.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      sender: PropTypes.string.isRequired
    })
  ).isRequired,
  userInput: PropTypes.string.isRequired,
  setUserInput: PropTypes.func.isRequired,
  handleSendMessage: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

export default ChatBox;