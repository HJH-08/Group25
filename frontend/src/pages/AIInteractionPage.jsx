import React, { useState, useRef, useEffect } from "react";
import { useAvatar } from "../context/AvatarContext";
import ChatBox from "../components/ChatBox";  
import { useNavigate } from "react-router-dom";  
import "../styles/AIInteractionPage.css";    

const AIInteractionPage = () => {
    const { avatar } = useAvatar();  
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const videoRef = useRef(null);
    const navigate = useNavigate();  

    console.log("AIInteractionPage Avatar:", avatar);
    console.log("AIInteractionPage Mode: Interaction");  

    // Play avatar video **once on page load**
    useEffect(() => {
        if (avatar?.video) {
            videoRef.current?.play();
        }
    }, [avatar]);

    // Function to replay video when a message is sent
    const playVideo = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
        }
    };

    // Function to handle message submission
    const handleSendMessage = () => {
        if (!userInput.trim()) return;

        setMessages((prev) => [...prev, { sender: "user", text: userInput }]);

        // Simulated AI response + replay video
        setTimeout(() => {
            setMessages((prev) => [...prev, { sender: "ai", text: "Hello! How can I assist you today?" }]);
            playVideo();  // 🔥 Video plays only after AI response
        }, 1000);

        setUserInput("");  
    };

    // Navigate to Health Check-In page
    const goToHealthCheck = () => {
        navigate("/health-check");  
    };

    return (
        <div className="container">
            {/* Button at top-right */}
            <button className="switch-health-btn" onClick={goToHealthCheck}>
                Go to Health Check-In
            </button>

            <h1 className="title">Interaction Mode</h1>

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

export default AIInteractionPage;
