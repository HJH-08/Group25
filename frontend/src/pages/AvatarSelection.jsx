import React from "react";
import { useNavigate } from "react-router-dom";
import { useAvatar } from "../context/AvatarContext";  // Import Global Context

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

    const handle3DTest = () => {
        navigate("/3DUI");
    };

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h1>Please choose your avatar for today!</h1>
            <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap", marginTop: "20px" }}>
                {avatars.map((avatar) => (
                    <div
                        key={avatar.id}
                        onClick={() => handleAvatarSelection(avatar)}
                        style={{
                            cursor: "pointer",
                            border: "1px solid #ccc",
                            borderRadius: "10px",
                            padding: "10px",
                            textAlign: "center",
                            width: "150px",
                        }}
                    >
                        <img
                            src={avatar.image}
                            alt={avatar.name}
                            style={{ width: "100%", height: "auto", borderRadius: "8px" }}
                        />
                        <p style={{ marginTop: "10px" }}>{avatar.name}</p>
                    </div>
                ))}
            </div>
            <button 
                onClick={handle3DTest} 
                style={{ marginTop: "20px", padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
            >
                3D Avatar Test
            </button>
        </div>
    );
};

export default AvatarSelection;
