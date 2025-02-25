import React from "react";
import "../styles/ChatBox.css"; // Import external CSS file

const ChatBox = ({ messages, userInput, setUserInput, handleSendMessage }) => {
    return (
        <div className="chatbox-container">
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender === "user" ? "user-message" : "ai-message"}`}>
                        {msg.text}
                    </div>
                ))}
            </div>
            <div className="input-container">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your message..."
                    className="chat-input"
                />
                <button onClick={handleSendMessage} className="send-button">
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatBox;
