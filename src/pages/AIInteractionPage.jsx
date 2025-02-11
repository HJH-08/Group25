import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";

const AIInteractionPage = () => {
    const location = useLocation();
    const { avatar, mode } = location.state || { avatar: null, mode: "interaction" };

    // State for chatbot conversation
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");

    // Ref to control the video element
    const videoRef = useRef(null);

    // Function to play the video once
    const playVideo = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0; // Restart video
            videoRef.current.play(); // Play video
        }
    };

    // Play video on initial load
    useEffect(() => {
        playVideo();
    }, []);

    // Function to handle message submission
    const handleSendMessage = () => {
        if (!userInput.trim()) return;

        // Add user message to the chat
        setMessages((prev) => [...prev, { sender: "user", text: userInput }]);

        // Simulate AI response
        setTimeout(() => {
            setMessages((prev) => [...prev, { sender: "ai", text: "Hello! How can I assist you today?" }]);

            // Play video again after AI response
            playVideo();
        }, 1000);

        setUserInput(""); // Clear input field
    };

    return (
        <div
            style={{
                padding: "20px",
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: "10px",
            }}
        >
            {/* Page Title (Top Left Corner) */}
            <h1 style={{ position: "absolute", top: "10px", left: "15px", margin: "0" }}>
                {mode === "interaction" ? "Interaction Mode" : "Health Check-In"}
            </h1>

            {/* Avatar Display */}
            <div style={{ flex: "0 0 auto", display: "flex", justifyContent: "center", alignItems: "center" }}>
                {avatar && avatar.video ? (
                    <video
                        ref={videoRef}
                        src={avatar.video}
                        muted
                        style={{
                            maxHeight: "70vh",
                            maxWidth: "70vw",
                            borderRadius: "15px",
                        }}
                    />
                ) : (
                    <img
                        src={avatar?.image}
                        alt={avatar?.name}
                        style={{
                            maxHeight: "70vh",
                            maxWidth: "70vw",
                            objectFit: "contain",
                            borderRadius: "15px",
                        }}
                    />
                )}
            </div>

            {/* Chatbot Interface */}
            <div style={{ flex: "0 0 auto", width: "100%", padding: "10px", display: "flex", flexDirection: "column" }}>
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        padding: "6px",
                        backgroundColor: "#f9f9f9",
                        fontSize: "12px",
                        height: "90px",
                    }}
                >
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            style={{
                                textAlign: msg.sender === "user" ? "right" : "left",
                                marginBottom: "5px",
                            }}
                        >
                            <span
                                style={{
                                    display: "inline-block",
                                    padding: "4px 8px",
                                    borderRadius: "8px",
                                    backgroundColor: msg.sender === "user" ? "#d1e7dd" : "#e9ecef",
                                    fontSize: "12px",
                                }}
                            >
                                {msg.text}
                            </span>
                        </div>
                    ))}
                </div>
                <div style={{ display: "flex", gap: "5px", marginTop: "6px" }}>
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Type your message..."
                        style={{
                            flex: 1,
                            padding: "6px",
                            borderRadius: "8px",
                            border: "1px solid #ccc",
                            fontSize: "12px",
                        }}
                    />
                    <button
                        onClick={handleSendMessage}
                        style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            backgroundColor: "#007bff",
                            color: "white",
                            fontSize: "12px",
                            cursor: "pointer",
                            border: "none",
                        }}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIInteractionPage;
