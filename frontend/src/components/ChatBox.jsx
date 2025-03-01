import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "../styles/ChatBox.css";
import { useChat } from "../hooks/useChat";
import { useModel } from "../hooks/useModel";

const ChatBox = ({ messages, userInput, setUserInput, handleSendMessage, isLoading }) => {
  const messagesEndRef = useRef(null);
  const { connectionStatus } = useChat();
  const { modelConfig } = useModel();
  
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

  // Add styles for system messages
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
          placeholder="Type your message..."
          disabled={connectionStatus !== "connected" || isLoading}
        />
        <button 
          className="send-button"
          onClick={handleSendMessage}
          disabled={connectionStatus !== "connected" || isLoading}
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