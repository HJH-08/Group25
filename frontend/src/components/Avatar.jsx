import { useAnimations, useGLTF, useFBX } from "@react-three/drei";
import React, { useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";

export function Avatar(props) {
  const { nodes, materials } = useGLTF("/models/glasses_assistant.glb");
  const { message, isSpeaking, onMessagePlayed } = useChat();
  const [isFirstGreeting, setIsFirstGreeting] = useState(true);
  const group = useRef();
  const [animation, setAnimation] = useState("Idle");

  // Animation constants
  const TRANSITION_DURATION = 500;
  const TALKING_DURATION = 3000;
  const MOUTH_UPDATE_INTERVAL = 100;

  // Load and name animations
  const { animations: idleAnimation } = useFBX("/animations/idle_breathing.fbx");
  const { animations: greetingAnimationDefault } = useFBX("/animations/informal_bow.fbx");
  const { animations: greetingAnimationAlternative } = useFBX("/animations/feminine_hello.fbx");
  const { animations: talkingDefault } = useFBX("/animations/talking_main.fbx");
  const { animations: talkingAlternative } = useFBX("/animations/talking_explain.fbx");

  idleAnimation[0].name = "Idle";
  greetingAnimationDefault[0].name = "DefaultGreeting";
  greetingAnimationAlternative[0].name = "AlternativeGreeting";
  talkingDefault[0].name = "DefaultTalking";
  talkingAlternative[0].name = "AlternativeTalking";

  // Setup animations
  const { actions } = useAnimations(
    [
      idleAnimation[0], 
      greetingAnimationDefault[0], 
      greetingAnimationAlternative[0],
      talkingDefault[0],
      talkingAlternative[0]
    ], 
    group
  );

  // Handle animation transitions based on state
  useEffect(() => {
    const mouthSmileIndex = nodes.Wolf3D_Teeth.morphTargetDictionary["mouthSmile"];
    const mouthOpenIndex = nodes.Wolf3D_Teeth.morphTargetDictionary["mouthOpen"];
    
    // Set default smile for greeting and idle
    const setDefaultSmile = () => {
      nodes.Wolf3D_Head.morphTargetInfluences[mouthSmileIndex] = 0.6;
      nodes.Wolf3D_Head.morphTargetInfluences[mouthOpenIndex] = 0.01;
    };
    
    // Initial greeting on first render
    if (isFirstGreeting) {
      setAnimation("AlternativeGreeting");
      setDefaultSmile();
      
      const greetingDuration = actions["AlternativeGreeting"]?.getClip().duration * 500 || 3000;
      setTimeout(() => {
        setIsFirstGreeting(false);
        setAnimation("Idle");
      }, greetingDuration);
      return;
    }
    
    let mouthAnimationInterval;
    let talkingTimeout;
    
    // Switch to talking animation when speaking
    if (isSpeaking && message) {
      // Randomly select between the two talking animations
      const talkingAnimation = Math.random() > 0.5 ? "DefaultTalking" : "AlternativeTalking";
      setAnimation(talkingAnimation);

      
      // Clear any existing intervals/timeouts
      clearInterval(mouthAnimationInterval);
      clearTimeout(talkingTimeout);
      
      // Create an interval that changes mouth movements continuously
      mouthAnimationInterval = setInterval(() => {
        const mouthOpenValue = Math.random() * (1 - 0) + 0.5;
        const mouthSmileValue = mouthOpenValue * 0.3 + 0.3; // Range ~0.3-0.6
        
        nodes.Wolf3D_Head.morphTargetInfluences[mouthOpenIndex] = mouthOpenValue;
        nodes.Wolf3D_Head.morphTargetInfluences[mouthSmileIndex] = mouthSmileValue;
      }, MOUTH_UPDATE_INTERVAL);
      
      // Hard-code talking animation to last only 3 seconds
      talkingTimeout = setTimeout(() => {
        // Clear the random mouth movements
        clearInterval(mouthAnimationInterval);
        
        // Get current mouth values and targets
        const currentOpenValue = nodes.Wolf3D_Head.morphTargetInfluences[mouthOpenIndex];
        const currentSmileValue = nodes.Wolf3D_Head.morphTargetInfluences[mouthSmileIndex];
        const targetOpenValue = 0.01;
        const targetSmileValue = 0.6;
        
        // Start the animation transition
        setAnimation("Idle");
        
        // Create a smooth transition for mouth morphs
        const steps = 10;
        const stepDuration = TRANSITION_DURATION / steps;
        
        let step = 0;
        const mouthTransitionInterval = setInterval(() => {
          step++;
          const progress = step / steps;
          
          // Linear interpolation for mouth shapes
          nodes.Wolf3D_Head.morphTargetInfluences[mouthOpenIndex] = 
            currentOpenValue + (targetOpenValue - currentOpenValue) * progress;
          nodes.Wolf3D_Head.morphTargetInfluences[mouthSmileIndex] = 
            currentSmileValue + (targetSmileValue - currentSmileValue) * progress;
          
          if (step >= steps) {
            clearInterval(mouthTransitionInterval);
          }
        }, stepDuration);
      }, TALKING_DURATION);
      
    } else if (!isSpeaking && message) {
      // Message is complete, return to idle
      clearInterval(mouthAnimationInterval);
      clearTimeout(talkingTimeout);
      setAnimation("Idle");
      setDefaultSmile();
      
      // Notify that the message was played if needed
      if (onMessagePlayed) {
        onMessagePlayed();
      }
    } else {
      setAnimation("Idle");
      setDefaultSmile();
    }
    
    // Clean up on unmount or when dependencies change
    return () => {
      clearInterval(mouthAnimationInterval);
      clearTimeout(talkingTimeout);
    };
  }, [isSpeaking, message, isFirstGreeting, actions, nodes.Wolf3D_Head.morphTargetInfluences, 
      nodes.Wolf3D_Teeth.morphTargetDictionary, onMessagePlayed]);

  // Switch animation when animation state changes
  useEffect(() => {
    if (actions[animation]) {
      // Fade out all current animations
      Object.values(actions).forEach((action) => {
        if (action.isRunning()) {
          action.fadeOut(0.5);
        }
      });
      
      
      // Fade in the new animation
      const currentAction = actions[animation];
      currentAction.reset().fadeIn(0.5).play();
    }
  }, [animation, actions]);

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Hair.geometry}
        material={materials.Wolf3D_Hair}
        skeleton={nodes.Wolf3D_Hair.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Glasses.geometry}
        material={materials.Wolf3D_Glasses}
        skeleton={nodes.Wolf3D_Glasses.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Body.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materials.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materials.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materials.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
      />
    </group>
  );
}

useGLTF.preload("/models/glasses_assistant.glb");
