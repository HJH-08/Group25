import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const WelcomePage = () => {
    const navigate = useNavigate();
    const [randomVideo, setRandomVideo] = useState("");

    useEffect(() => {
        const videoList = [
            "/videos/dog-video.mp4",
            "/videos/goldfish-video.mp4",
            "/videos/parrot-video.mp4",
        ];
        const randomIndex = Math.floor(Math.random() * videoList.length);
        setRandomVideo(videoList[randomIndex]);

        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.body.style.overflow = "hidden";
    }, []);

    return (
        <div style={styles.container}>
            <div style={styles.left}>
                <div style={styles.textContainer}>
                    <h1 style={styles.heading}>
                        <span>Welcome to</span>
                        <br />
                        <span style={styles.brand}>Companio</span>
                    </h1>
                    <p style={styles.subText}>Your buddy is ready and waiting for you!</p>
                </div>
                <button
                    onClick={() => navigate("/choose-avatar")}
                    style={styles.button}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = "#0056b3")}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = "#007bff")}
                >
                    Get Started!
                </button>
            </div>

            <div style={styles.right}>
                {randomVideo && (
                    <video autoPlay loop muted style={styles.video}>
                        <source src={randomVideo} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                )}
            </div>
        </div>
    );
};

// Styles
const styles = {
    container: {
        display: "flex",
        width: "100vw",
        height: "100vh",
        margin: "0",
        padding: "0",
        overflow: "hidden",
        boxSizing: "border-box",
    },
    left: {
        width: "40vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start", // Push content higher
        alignItems: "center",
        textAlign: "center",
        backgroundColor: "#f8f9fa",
        padding: "40px",
        paddingTop: "15vh", // Moved text higher
    },
    textContainer: {
        marginBottom: "20px",
    },
    heading: {
        fontSize: "2.5rem", // Bigger text
        fontWeight: "bold",
        lineHeight: "1.1",
        marginBottom: "20vh",
        alignItems: "left",
        textAlign: "left",
    },
    brand: {
        fontSize: "10rem", // Even bigger for "Companio"
        color: "#007bff",
    },
    subText: {
        fontSize: "1.8rem",
        color: "#555",
        marginTop: "5px",
    },
    button: {
        padding: "18px 36px",
        fontSize: "1.8rem",
        cursor: "pointer",
        borderRadius: "12px",
        border: "none",
        backgroundColor: "#007bff",
        color: "#fff",
        boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.2)",
        transition: "background-color 0.3s, transform 0.2s",
        marginTop: "-20px", // Raised button higher
    },
    right: {
        width: "60vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    video: {
        width: "100%",
        height: "100vh",
        objectFit: "cover",
    },
};

export default WelcomePage;
