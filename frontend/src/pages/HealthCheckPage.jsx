import React, { useState, useRef, useEffect } from "react";
import { useAvatar } from "../context/AvatarContext";
import ChatBox from "../components/ChatBox";
import { useNavigate } from "react-router-dom";
import "../styles/HealthCheckPage.css";

const HealthCheckPage = () => {
    const { avatar } = useAvatar();  
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const videoRef = useRef(null);
    const navigate = useNavigate();

    // Function to play video only when needed
    const playVideo = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
        }
    };

    // Play video once on initial load
    useEffect(() => {
        if (avatar?.video) {
            playVideo();
        }
    }, [avatar]);

    // Play video when a message is sent
    const handleSendMessage = () => {
        if (!userInput.trim()) return;

        setMessages((prev) => [...prev, { sender: "user", text: userInput }]);

        // Simulated AI response + replay video
        setTimeout(() => {
            setMessages((prev) => [...prev, { sender: "ai", text: "Please describe your health status today." }]);
            playVideo();  
        }, 1000);

        setUserInput("");  
    };

    return (
        <div className="container">
            {/* Button moved to top-right */}
            <button className="switch-mode-btn" onClick={() => navigate("/ai-interaction")}>
                Go to Interaction Mode
            </button>

            <h1 className="title">Health Check-In</h1>

            {/* Avatar Display */}
            <div className="video-container">
                {avatar ? (
                    avatar.video ? (
                        <video ref={videoRef} src={avatar.video} muted />  
                    ) : (
                        <img src={avatar.image} alt={avatar.name} />
                    )
                ) : (
                    <h2>No Avatar Selected</h2>
                )}
            </div>

            {/* Chatbox Component */}
            <div className="chatbox-wrapper">
                <ChatBox
                    messages={messages}
                    userInput={userInput}
                    setUserInput={setUserInput}
                    handleSendMessage={handleSendMessage}
                />
            </div>

        </div>
    );
};

export default HealthCheckPage;
