import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { CameraControls, ContactShadows } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import BackgroundScene from "../components/BackgroundScene";
import { ModelProvider } from "../hooks/useModel";  // ModelProvider should be at the top
import { VoiceProvider } from "../hooks/useVoice";
import { ChatProvider } from "../hooks/useChat";
import "../styles/WelcomePage.css";

const WelcomePage = () => {
  const navigate = useNavigate();
  const avatarRef = useRef();
  const cameraControls = useRef();
  const [clickedAvatar, setClickedAvatar] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const handleStartClick = () => {
    if (cameraControls.current) {
      setIsTransitioning(true); // Start fade effect
  
      // Smoothly move camera to original position
      cameraControls.current.setLookAt(0, 0.3, 7, 0, 0, 0, true); 
  
      setTimeout(() => {
        setFadeOut(true); // Start fade effect
        setTimeout(() => {
          navigate("/3DUI"); // Navigate after fade completes
        }, 1000); // Reduce pause duration to 1s
      }, 100); // Reduce initial wait time before fade
    }
  };
  
  useEffect(() => {
    if (cameraControls.current) {
      cameraControls.current.minDistance = 3;
      cameraControls.current.maxDistance = 6;
      cameraControls.current.setLookAt(0, 0.3, 4.5, 0, 1.5, 0);
    }
  }, []);

  const handleAvatarClick = () => {
    if (avatarRef.current && !avatarRef.current.isPlayingSpecialAnimation()) {
      setClickedAvatar(true);
    }
  };

  useEffect(() => {
    if (clickedAvatar) {
      setClickedAvatar(false);
    }
  }, [clickedAvatar]);

  return (
    <ModelProvider> {/* ModelProvider must be outside VoiceProvider */}
      <VoiceProvider>
        <ChatProvider>
          <div className="welcome-container">
            <div className={`fade-overlay ${fadeOut ? "fade-out" : ""}`} />
            {/* 3D Canvas with background and avatar */}
            <Canvas shadows camera={{ position: [0, 0.3, 5], fov: 40 }}>
              <Suspense fallback={null}>
                <CameraControls ref={cameraControls} />
                <BackgroundScene />
                <Avatar 
                  ref={avatarRef} 
                  rotation={[-Math.PI / 2.1, 0, 0.03]} 
                  position={[0, -1, 0]} 
                  triggerRandomAnimation={clickedAvatar}
                />
                <AvatarClickArea onAvatarClick={handleAvatarClick} />
                <ContactShadows opacity={0.7} scale={10} blur={1.5} far={10} resolution={256} color="#000000" position={[0, -1, 0]}/>
              </Suspense>
            </Canvas>

            {/* UI Overlay with Navigation Button */}
            <div className="welcome-overlay">
              <h1 className="welcome-heading">Welcome to <span>Companio</span></h1>
              <button className={`start-button ${isTransitioning ? "fade-out" : ""}`} onClick={handleStartClick}>
                Get Started
              </button>
            </div>
          </div>
        </ChatProvider>
      </VoiceProvider>
    </ModelProvider>
  );
};

// Invisible click area for triggering avatar animations
const AvatarClickArea = ({ onAvatarClick }) => {
  return (
    <mesh 
      position={[0, 0.5, 0]} // Centered around the avatar
      onClick={(e) => {
        e.stopPropagation();
        onAvatarClick();
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      <cylinderGeometry args={[0.3, 0.3, 3, 16]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
};

export default WelcomePage;
