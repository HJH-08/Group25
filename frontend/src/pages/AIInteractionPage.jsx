import React, { useState, useRef, useEffect } from "react";
import { useAvatar } from "../context/AvatarContext";
import ChatBox from "../components/ChatBox";  // 🆕 Import ChatBox component
import "../styles/AIInteractionPage.css";    // 🆕 Import external styles

const AIInteractionPage = () => {
    const { avatar, mode } = useAvatar();
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const videoRef = useRef(null);

    console.log("AIInteractionPage Avatar:", avatar);
    console.log("AIInteractionPage Mode:", mode);

    useEffect(() => {
        if (avatar?.video) {
            videoRef.current?.play();
        }
    }, [avatar]);

    const handleSendMessage = () => {
        if (!userInput.trim()) return;

        setMessages((prev) => [...prev, { sender: "user", text: userInput }]);
        setTimeout(() => {
            setMessages((prev) => [...prev, { sender: "ai", text: "Hello! How can I assist you today?" }]);
        }, 1000);

        setUserInput("");
    };

    return (
        <div className="container">  {/* 🆕 Now uses CSS classes instead of inline styles */}
            <h1 className="title">{mode === "interaction" ? "Interaction Mode" : "Health Check-In"}</h1>

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

            {/* 🆕 Using the ChatBox Component */}
            <ChatBox
                messages={messages}
                userInput={userInput}
                setUserInput={setUserInput}
                handleSendMessage={handleSendMessage}
            />
        </div>
    );
};

export default AIInteractionPage;
