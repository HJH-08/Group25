import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "../styles/ChatBox.css";

const ChatBox = ({ messages, userInput, setUserInput, handleSendMessage }) => {
  const messagesEndRef = useRef(null);
  
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

  return (
    <div className="chatbox-container">
      <div className="chat-messages" aria-live="polite">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
          >
            {message.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="input-container">
        <input
          type="text"
          className="chat-input"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          aria-label="Message input"
        />
        <button 
          className="send-button" 
          onClick={handleSendMessage}
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
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
  handleSendMessage: PropTypes.func.isRequired
};

export default ChatBox;
