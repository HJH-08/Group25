import React from "react";
import { Sky, Stars } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

const BackgroundScene = () => {
  const { scene } = useThree();
  scene.background = null; // Ensure transparency

  return (
    <>
      {/* Sky with same configuration as Experience.jsx */}
      <Sky
        sunPosition={[10, 5, 10]}
        turbidity={0.1}
        rayleigh={0.5}
        mieCoefficient={0.01}
        distance={450000}
      />

      {/* Stars for a 3D effect */}
      <Stars radius={100} depth={50} count={5000} factor={3} fade />

      {/* Ambient Lighting */}
      <ambientLight intensity={0.6} />

      {/* Directional Light to simulate sunlight */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        color={"#ffffff"}
      />
    </>
  );
};

export default BackgroundScene;
