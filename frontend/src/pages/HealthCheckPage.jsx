import React, { useState, useRef, useEffect } from "react";
import { useAvatar } from "../context/AvatarContext";
import ChatBox from "../components/ChatBox";
import { useNavigate } from "react-router-dom";
import "../styles/HealthCheckPage.css";

const HealthCheckPage = () => {
    const { avatar } = useAvatar();  // Avatar remains the same
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const videoRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (avatar?.video) {
            videoRef.current?.play();
        }
    }, [avatar]);

    const handleSendMessage = () => {
        if (!userInput.trim()) return;

        setMessages((prev) => [...prev, { sender: "user", text: userInput }]);
        setTimeout(() => {
            setMessages((prev) => [...prev, { sender: "ai", text: "Please describe your health status today." }]);
        }, 1000);

        setUserInput("");
    };

    return (
        <div className="container">
            {/* 🆕 Button to go back to Interaction Mode */}
            <button className="switch-mode-btn" onClick={() => navigate("/ai-interaction")}>
                Go to Interaction Mode
            </button>

            <h1 className="title">Health Check-In</h1>

            {/* Avatar Display */}
            <div className="video-container">
                {avatar ? (
                    avatar.video ? (
                        <video ref={videoRef} src={avatar.video} muted autoPlay loop />
                    ) : (
                        <img src={avatar.image} alt={avatar.name} />
                    )
                ) : (
                    <h2>No Avatar Selected</h2>
                )}
            </div>

            {/* Chatbox Component */}
            <ChatBox
                messages={messages}
                userInput={userInput}
                setUserInput={setUserInput}
                handleSendMessage={handleSendMessage}
            />
        </div>
    );
};

export default HealthCheckPage;
