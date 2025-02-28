import React from "react";
import { useNavigate } from "react-router-dom";
import { useAvatar } from "../context/AvatarContext";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Custom arrow components
const NextArrow = ({ onClick }) => (
    <div style={styles.nextArrow} onClick={onClick}>
        ❯
    </div>
);

const PrevArrow = ({ onClick }) => (
    <div style={styles.prevArrow} onClick={onClick}>
        ❮
    </div>
);

const InteractionMode = () => {
    const navigate = useNavigate();
    const { avatar, setMode } = useAvatar();

    console.log("Avatar in InteractionMode:", avatar);

    if (!avatar) {
        return <h1>Error: No avatar selected. Go back to the avatar selection page.</h1>;
    }

    const options = [
        {
            mode: "interaction",
            text: "Interaction",
            content: avatar.video ? (
                <video
                    src={avatar.video}
                    autoPlay
                    loop
                    muted
                    style={styles.image} // Keep same size as images
                />
            ) : (
                <div style={styles.noVideo}>No Video Available</div>
            ),
        },
        {
            mode: "health-check",
            text: "Health Check-In",
            content: (
                <img src={avatar.image} alt={avatar.name} style={styles.image} />
            ),
        },
    ];

    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        centerMode: true,
        centerPadding: "0",
        autoplay: true,
        autoplaySpeed: 2500,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
        adaptiveHeight: true,
    };

    return (
        <div style={styles.container}>
            {/* 🔥 Topbar with "Companio" aligned to the left */}
            <div style={styles.topbar}>
                <div style={styles.logo} onClick={() => navigate("/")}>
                    Companio
                </div>
            </div>

            <h1 style={styles.heading}>Choose your mode of interaction</h1>

            <div style={styles.carouselWrapper}>
                <Slider {...settings} style={styles.carousel}>
                    {options.map((option, index) => (
                        <div
                            key={index}
                            style={styles.slide}
                            onClick={() => {
                                setMode(option.mode);
                                navigate("/ai-interaction");
                            }}
                        >
                            {option.content}
                            <p style={styles.name}>{option.text}</p>
                        </div>
                    ))}
                </Slider>
            </div>
        </div>
    );
};

// 💡 **Styles - Matched to Avatar Selection**
const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        height: "90vh",
        textAlign: "center",
        paddingTop: "20px",
    },
    topbar: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        backgroundColor: "#007bff",
        color: "white",
        fontSize: "2rem",
        fontWeight: "bold",
        padding: "15px 20px",
        display: "flex",
        alignItems: "center",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    logo: {
        cursor: "pointer",
        fontSize: "2rem",
        fontWeight: "bold",
        transition: "opacity 0.3s",
    },
    heading: {
        fontSize: "2.5rem",
        fontWeight: "normal",
        marginBottom: "10px",
        marginTop: "80px",
    },
    carouselWrapper: {
        width: "800px",
        height: "600px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    carousel: {
        maxWidth: "100%",
    },
    slide: {
        textAlign: "center",
        cursor: "pointer",
        padding: "20px",
        transition: "transform 0.3s",
    },
    image: {
        width: "100%",
        height: "auto",
        maxWidth: "400px",
        borderRadius: "10px",
        margin: "auto",
    },
    name: {
        marginTop: "15px",
        fontSize: "2.5rem",
        fontWeight: "bold",
    },
    nextArrow: {
        position: "absolute",
        top: "50%",
        right: "-60px",
        transform: "translateY(-50%)",
        fontSize: "4rem",
        cursor: "pointer",
        zIndex: 2,
        color: "#333",
    },
    prevArrow: {
        position: "absolute",
        top: "50%",
        left: "-60px",
        transform: "translateY(-50%)",
        fontSize: "4rem",
        cursor: "pointer",
        zIndex: 2,
        color: "#333",
    },
};

export default InteractionMode;
