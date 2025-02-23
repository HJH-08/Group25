import React from "react";
import { useNavigate } from "react-router-dom";

const AvatarSelection = () => {
    const navigate = useNavigate();

    const avatars = [
        { id: 1, name: "Goldfish", image: "/images/goldfish.png" },
        { id: 2, name: "Parrot", image: "/images/parrot.png" },
        { id: 3, name: "Cat", image: "/images/cat.png" },
        { id: 4, name: "Dog", image: "/images/dog.png" },
    ];

    const handleAvatarSelection = (avatar) => {
        console.log("Selected Avatar:", avatar); // Debugging
        navigate("/interaction-mode", { state: { avatar } }); // Pass avatar to the next page
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
        </div>
    );
};

export default AvatarSelection;
