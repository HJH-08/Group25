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

const backgroundConfigs = {
  default: {
    skyColor: "#f5f9ff",
    sunPosition: [10, 5, 10],
    turbidity: 0.1,
    rayleigh: 0.5,
    mieCoefficient: 0.01,
    starsFactor: 3,
    ambientLightIntensity: 0.6,
    directionalLightIntensity: 1.5,
    directionalLightColor: "#ffffff",
    pointLightColor: "#ffeecc",
  },
  sunset: {
    skyColor: "#ff7e5f",
    sunPosition: [0, 0.25, 5],
    turbidity: 0.2,
    rayleigh: 3,
    mieCoefficient: 0.05,
    starsFactor: 2,
    ambientLightIntensity: 0.55,
    directionalLightIntensity: 1.2,
    directionalLightColor: "#ff8c47",
    pointLightColor: "#ff6b35",
  },
  night: {
    skyColor: "#0c1445",
    sunPosition: [0, -5, 0],
    turbidity: 0.05,
    rayleigh: 0.1,
    mieCoefficient: 0.001,
    starsFactor: 8,
    ambientLightIntensity: 0.4,        // Increased from 0.25
    directionalLightIntensity: 0.2,    // Increased from 0.1
    directionalLightColor: "#3b68d9",
    pointLightColor: "#a0c2ff",
    // Adding a specialized face light for night mode
    faceLight: true,
    faceLightIntensity: 0.7,
    faceLightColor: "#e1e9ff",
    faceLightPosition: [0, 2, 2]       // Position in front of the avatar's face
  },
  dream: {
    skyColor: "#ffd6e0",
    sunPosition: [5, 3, 5],
    turbidity: 0.15,
    rayleigh: 1.2,
    mieCoefficient: 0.03,
    starsFactor: 5,
    ambientLightIntensity: 0.7,
    directionalLightIntensity: 1.4,
    directionalLightColor: "#ffb6c1",
    pointLightColor: "#c792ea",
  }
};

export const Experience = ({ cameraZoomed, backgroundType = 'default' }) => {
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

  const bgConfig = backgroundConfigs[backgroundType];

  return (
    <>
      <CameraControls ref={cameraControls} />
      
      {/* Enhanced dynamic background */}
      <color attach="background" args={[bgConfig.skyColor]} />
      <Sky 
        sunPosition={bgConfig.sunPosition} 
        turbidity={bgConfig.turbidity}
        rayleigh={bgConfig.rayleigh}
        mieCoefficient={bgConfig.mieCoefficient}
        distance={450000}
      />
      <Stars 
        radius={100} 
        depth={50} 
        count={5000} 
        factor={bgConfig.starsFactor} 
        fade 
      />
      
      {/* Dynamic lighting based on selected background */}
      <ambientLight intensity={bgConfig.ambientLightIntensity} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={bgConfig.directionalLightIntensity} 
        castShadow 
        shadow-mapSize={[2048, 2048]} 
        color={bgConfig.directionalLightColor}
      />
      <pointLight 
        position={[-5, 5, -5]} 
        intensity={0.5} 
        color={bgConfig.pointLightColor} 
      />
      {/* Special face light for night mode */}
      {bgConfig.faceLight && (
        <spotLight
          position={bgConfig.faceLightPosition}
          intensity={bgConfig.faceLightIntensity}
          color={bgConfig.faceLightColor}
          angle={0.5}
          penumbra={0.5}
          distance={10}
          castShadow={false}
          target-position={[0, 1.5, 0]}
        />
      )}
      
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