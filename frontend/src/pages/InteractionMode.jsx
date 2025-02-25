import React from "react";
import { useNavigate } from "react-router-dom";
import { useAvatar } from "../context/AvatarContext";  // Import Global State

const InteractionMode = () => {
    const navigate = useNavigate();
    const { avatar, setMode } = useAvatar();  // Use global state

    console.log("Avatar in InteractionMode:", avatar); // Debugging

    if (!avatar) {
        return <h1>Error: No avatar selected. Go back to the avatar selection page.</h1>;
    }

    return (
        <div style={{ textAlign: "center", padding: "50px" }}>
            <h1>Choose your mode of interaction</h1>
            <div style={{ display: "flex", justifyContent: "center", gap: "30px", marginTop: "30px" }}>
                <div
                    onClick={() => { setMode("interaction"); navigate("/ai-interaction"); }}
                    style={{
                        cursor: "pointer",
                        border: "1px solid #ccc",
                        borderRadius: "10px",
                        padding: "20px",
                        width: "200px",
                    }}
                >
                    {avatar.video ? (
                        <video
                            src={avatar.video}
                            autoPlay
                            loop
                            muted
                            style={{
                                width: "100%",
                                height: "200px",
                                objectFit: "contain",
                                borderRadius: "10px",
                            }}
                        />
                    ) : (
                        <div style={{ backgroundColor: "#dfe7fd", padding: "20px", borderRadius: "8px" }}>
                            No Video Available
                        </div>
                    )}
                    <p>Interaction</p>
                </div>

                <div
                    onClick={() => { setMode("health-check"); navigate("/ai-interaction"); }}
                    style={{
                        cursor: "pointer",
                        border: "1px solid #ccc",
                        borderRadius: "10px",
                        padding: "20px",
                        width: "200px",
                    }}
                >
                    <img
                        src={avatar.image}
                        alt={avatar.name}
                        style={{
                            width: "100%",
                            height: "200px",
                            objectFit: "contain",
                            borderRadius: "10px",
                        }}
                    />
                    <p>Health Check-In</p>
                </div>
            </div>
        </div>
    );
};

export default InteractionMode;
