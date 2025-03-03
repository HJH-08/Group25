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

const AvatarSelection = () => {
    const navigate = useNavigate();
    const { setAvatar } = useAvatar();

    const avatars = [
        { id: 1, name: "Goldfish", image: "/images/goldfish.png", video: "/videos/goldfish-video.mp4" },
        { id: 2, name: "Parrot", image: "/images/parrot.png", video: "/videos/parrot-video.mp4" },
        { id: 3, name: "Cat", image: "/images/cat.png", video: "/videos/cat-video.mp4" },
        { id: 4, name: "Dog", image: "/images/dog.png", video: "/videos/dog-video.mp4" },
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
        autoplaySpeed: 2000,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
        adaptiveHeight: true,
    };

    const handleAvatarSelection = (avatar) => {
        console.log("Selected Avatar:", avatar);
        setAvatar(avatar);
        navigate("/interaction-mode");
    };

    const handle3DTest = () => {
        navigate("/3DUI");
    };

    return (
        <div style={styles.container}>
            {/* 🔥 Topbar with "Companio" aligned to the left */}
            <div style={styles.topbar}>
                <div style={styles.logo} onClick={() => navigate("/")}>
                    Companio
                </div>
            </div>

            <h1 style={styles.heading}>Please choose your avatar for today!</h1>

            <div style={styles.carouselWrapper}>
                <Slider {...settings} style={styles.carousel}>
                    {avatars.map((avatar) => (
                        <div key={avatar.id} style={styles.slide} onClick={() => handleAvatarSelection(avatar)}>
                            <img src={avatar.image} alt={avatar.name} style={styles.image} />
                            <p style={styles.name}>{avatar.name}</p>
                        </div>
                    ))}
                </Slider>
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

// 💡 Styles
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
        fontSize: "2.5rem", // Smaller than before
        fontWeight: "normal", // Now normal weight
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

export default AvatarSelection;
