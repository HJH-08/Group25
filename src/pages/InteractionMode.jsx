import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const InteractionMode = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Retrieve the selected avatar passed via state
    const { avatar } = location.state || { avatar: null };

    // Debugging: Log the selected avatar and video source
    console.log("Avatar passed to Interaction Mode:", avatar);

    // Map videos for each avatar
    const avatarVideos = {
        goldfish: "/videos/goldfish-video.mp4",
        parrot: "/videos/parrot-video.mp4",
        cat: "/videos/cat-video.mp4",
        dog: "/videos/dog-video.mp4",
    };

    // Normalize avatar name to find the corresponding video
    const videoKey = avatar?.name?.toLowerCase().trim();
    const videoSrc = avatarVideos[videoKey];

    // Debugging: Log the generated video source
    console.log("Generated Video Source:", videoSrc);

    return (
        <div style={{ textAlign: "center", padding: "50px" }}>
            <h1>Choose your mode of interaction</h1>
            <div style={{ display: "flex", justifyContent: "center", gap: "30px", marginTop: "30px" }}>
                {/* Interaction */}
                <div
                    onClick={() => navigate("/ai-interaction", { state: { avatar, mode: "interaction" } })}
                    style={{
                        cursor: "pointer",
                        textAlign: "center",
                        border: "1px solid #ccc",
                        borderRadius: "10px",
                        padding: "20px",
                        width: "200px",
                    }}
                >
                    {videoSrc ? (
                        <video
                            src={videoSrc}
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
                        <div
                            style={{
                                width: "100%",
                                height: "150px",
                                backgroundColor: "#dfe7fd",
                                borderRadius: "8px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <p style={{ fontSize: "18px", fontWeight: "bold" }}>No Video Available</p>
                        </div>
                    )}
                    <p style={{ marginTop: "10px" }}>Interaction</p>
                </div>

                {/* Health Check-In */}
                <div
                    onClick={() => navigate("/ai-interaction", { state: { avatar, mode: "health-check" } })}
                    style={{
                        cursor: "pointer",
                        textAlign: "center",
                        border: "1px solid #ccc",
                        borderRadius: "10px",
                        padding: "20px",
                        width: "200px",
                    }}
                >
                    {avatar ? (
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
                    ) : (
                        <div
                            style={{
                                width: "100%",
                                height: "150px",
                                backgroundColor: "#fdebd0",
                                borderRadius: "8px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <p style={{ fontSize: "18px", fontWeight: "bold" }}>No Avatar Selected</p>
                        </div>
                    )}
                    <p style={{ marginTop: "10px" }}>Health Check-In</p>
                </div>
            </div>
        </div>
    );
};

export default InteractionMode;
