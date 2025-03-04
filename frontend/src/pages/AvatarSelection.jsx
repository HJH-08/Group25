import React from "react";
import { useNavigate } from "react-router-dom";
import { useAvatar } from "../context/AvatarContext";  // Import Global Context
import "../styles/AvatarSelection.css";  // Import external CSS


const AvatarSelection = () => {
    const navigate = useNavigate();
    const { setAvatar } = useAvatar();  // Use Global State

    const avatars = [
        { id: 1, name: "Goldfish", image: "/images/goldfish.png", video: "/videos/goldfish-video.mp4" },
        { id: 2, name: "Parrot", image: "/images/parrot.png", video: "/videos/parrot-video.mp4" },
        { id: 3, name: "Cat", image: "/images/cat.png", video: "/videos/cat-video.mp4" },
        { id: 4, name: "Dog", image: "/images/dog.png", video: "/videos/dog-video.mp4" },
    ];

    const handleAvatarSelection = (avatar) => {
        console.log("Selected Avatar:", avatar);  // Debugging
        setAvatar(avatar);  // Store avatar globally
        navigate("/interaction-mode");
    };

    return (
        <div className="avatar-selection-container">
            <h1>Please choose your avatar for today!</h1>
            <div className="avatar-grid">
                {avatars.map((avatar) => (
                    <div key={avatar.id} className="avatar-card" onClick={() => handleAvatarSelection(avatar)}>
                        <img src={avatar.image} alt={avatar.name} className="avatar-image" />
                        <p className="avatar-name">{avatar.name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AvatarSelection;
