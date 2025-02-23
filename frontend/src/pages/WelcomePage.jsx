import React from "react";
import { useNavigate } from "react-router-dom";

const WelcomePage = () => {
    const navigate = useNavigate();

    return (
        <div style={{ textAlign: "center", padding: "50px" }}>
            <h1>Welcome to Companio!</h1>
            <p>Your buddy is ready and waiting for you!</p>
            <button
                onClick={() => navigate("/choose-avatar")}
                style={{
                    padding: "10px 20px",
                    fontSize: "16px",
                    cursor: "pointer",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                }}
            >
                Get Started!
            </button>
        </div>
    );
};

export default WelcomePage;
