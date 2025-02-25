import React, { useEffect, useRef } from "react";
import "../styles/ChatBox.css"; // Import styles

const ChatBox = ({ messages, userInput, setUserInput, handleSendMessage }) => {
    const chatMessagesRef = useRef(null);

    // Automatically scroll to the latest message
    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="chatbox-container">
            {/* Scrollable Chat Messages */}
            <div className="chat-messages" ref={chatMessagesRef}>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`message ${msg.sender === "user" ? "user-message" : "ai-message"}`}
                    >
                        {msg.text}
                    </div>
                ))}
            </div>

            {/* Input Field */}
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
