import { Suspense, useEffect, useRef, useState } from "react";
import {
  CameraControls,
  ContactShadows,
  GradientTexture,
  Sky,
  Stars,
  Text,
} from "@react-three/drei";
import { useChat } from "../hooks/useChat";
import { Avatar } from "./Avatar";

const Dots = ({ ...props }) => {
  const { loading } = useChat();
  const [loadingText, setLoadingText] = useState("");
  
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingText((text) => text.length > 2 ? "." : text + ".");
      }, 800);
      return () => clearInterval(interval);
    } else {
      setLoadingText("");
    }
  }, [loading]);
  
  if (!loading) return null;
  
  return (
    <group {...props}>
      <Text fontSize={0.14} anchorX="left" anchorY="bottom">
        {loadingText}
        <meshBasicMaterial attach="material" color="black" />
      </Text>
    </group>
  );
};

const EnhancedFloor = () => {
  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -0.001, 0]} 
      receiveShadow
    >
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial 
        color="#f0f0f0"
        roughness={0.7}
        metalness={0.1}
      >
        <GradientTexture
          stops={[0, 1]} 
          colors={["#cccccc", "#f5f5f5"]} 
          size={1024} 
        />
      </meshStandardMaterial>
    </mesh>
  );
};

export const Experience = ({ cameraZoomed }) => {
  const cameraControls = useRef();
  
  useEffect(() => {
    if (cameraControls.current) {
      // Increased minimum distance to prevent zooming inside avatar
      cameraControls.current.minDistance = 3;
      cameraControls.current.maxDistance = 6;
      
      // Set initial camera position at a safer distance
      cameraControls.current.setLookAt(0, 2, 4.5, 0, 1.5, 0);
    }
  }, []);

  useEffect(() => {
    if (cameraControls.current) {
      if (cameraZoomed) {
        // Less aggressive zoomed in view
        cameraControls.current.setLookAt(0, 1.8, 3, 0, 1.5, 0, true);
      } else {
        // Default view with increased distance
        cameraControls.current.setLookAt(0, 2.2, 4.2, 0, 1.0, 0, true);
      }
    }
  }, [cameraZoomed]);

  return (
    <>
      <CameraControls ref={cameraControls} />
      
      {/* Enhanced dynamic background */}
      <color attach="background" args={["#f5f9ff"]} />
      <Sky 
        sunPosition={[10, 5, 10]} 
        turbidity={0.1}
        rayleigh={0.5}
        mieCoefficient={0.01}
        distance={450000}
      />
      <Stars 
        radius={100} 
        depth={50} 
        count={5000} 
        factor={4} 
        fade 
      />
      
      {/* Better lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[2048, 2048]} 
      />
      <pointLight 
        position={[-5, 5, -5]} 
        intensity={0.5} 
        color="#ffeecc" 
      />
      
      <Suspense>
        <Dots position-y={1.9} position-x={-0.1} />
      </Suspense>
      
      <Avatar rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} />
      
      <EnhancedFloor />
      
      <ContactShadows 
        opacity={0.7} 
        scale={10} 
        blur={1.5} 
        far={10} 
        resolution={256}
        color="#000000" 
      />
    </>
  );
};