import { useAnimations, useGLTF, useFBX } from "@react-three/drei";
import React, { useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";
import { useVoice } from "../hooks/useVoice";
import { useModel } from "../hooks/useModel";

export function Avatar(props) {
  const { nodes, materials } = useGLTF("/models/glasses_assistant.glb");
  const { messages } = useChat();
  const { isSpeaking } = useVoice();
  const { modelConfig } = useModel();
  const [isFirstGreeting, setIsFirstGreeting] = useState(true);
  const [localIsSpeaking, setLocalIsSpeaking] = useState(false);
  const group = useRef();
  const [animation, setAnimation] = useState("Idle");
  const lastMessageRef = useRef(null);

  // Animation constants
  const TRANSITION_DURATION = 500;
  const MOUTH_UPDATE_INTERVAL = 100;
  const FALLBACK_SPEAKING_DURATION = 3000; // 3 seconds when speech is disabled
  const ANIMATION_SWITCH_INTERVAL = 2500; // 2.5 seconds between animation switches

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

  // Get the last message for animation context
  const lastMessage = messages && messages.length > 0 
    ? messages[messages.length - 1] 
    : null;

  // Monitor last message changes to trigger animation in speech disabled mode
  useEffect(() => {
    if (!lastMessage) return;
    
    // Keep track of the last message for comparison
    if (lastMessageRef.current?.text !== lastMessage.text && lastMessage.sender === 'ai') {
      lastMessageRef.current = lastMessage;
      
      // Check if speech is disabled but we got a new AI message - simulate speaking state
      if (modelConfig && modelConfig.use_speech_output === false) {
        console.log("Speech is disabled - simulating speaking state for animation");
        setLocalIsSpeaking(true);
        
        // Set timer to stop the simulated speaking after FALLBACK_SPEAKING_DURATION
        const timer = setTimeout(() => {
          setLocalIsSpeaking(false);
        }, FALLBACK_SPEAKING_DURATION);
        
        return () => clearTimeout(timer);
      }
    }
  }, [lastMessage, modelConfig]);
  
  // Compute effective speaking state from either real speech or simulated speech
  const effectivelySpeaking = isSpeaking || localIsSpeaking;

  // Handle animation transitions based on state
  useEffect(() => {
    // Ensure morphTarget dictionaries exist before accessing
    if (!nodes.Wolf3D_Head?.morphTargetDictionary || !nodes.Wolf3D_Teeth?.morphTargetDictionary) {
      return;
    }
    
    const mouthSmileIndex = nodes.Wolf3D_Head.morphTargetDictionary["mouthSmile"];
    const mouthOpenIndex = nodes.Wolf3D_Head.morphTargetDictionary["mouthOpen"];
    
    if (mouthSmileIndex === undefined || mouthOpenIndex === undefined) {
      console.warn("Morph targets for mouth not found");
      return;
    }
    
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
    let animationSwitchInterval;
    
    // Switch to talking animation when speaking
    if (effectivelySpeaking && lastMessage?.sender === 'ai') {
      console.log("Avatar is now speaking - activating talking animation");
      
      // Start with one of the talking animations
      const initialAnimation = Math.random() > 0.5 ? "DefaultTalking" : "AlternativeTalking";
      setAnimation(initialAnimation);
      
      // Clear any existing intervals/timeouts
      clearInterval(mouthAnimationInterval);
      clearTimeout(talkingTimeout);
      clearInterval(animationSwitchInterval);
      
      // Create an interval that switches between the two talking animations
      animationSwitchInterval = setInterval(() => {
        setAnimation(prev => 
          prev === "DefaultTalking" ? "AlternativeTalking" : "DefaultTalking"
        );
        console.log("Switching to alternate talking animation");
      }, ANIMATION_SWITCH_INTERVAL);
      
      // Create an interval that changes mouth movements continuously
      mouthAnimationInterval = setInterval(() => {
        const mouthOpenValue = Math.random() * 0.5 + 0.5; // Range 0.5-1.0 for more pronounced movement
        const mouthSmileValue = mouthOpenValue * 0.3 + 0.3; // Range ~0.3-0.6
        
        // Safety check before modifying mouth movements
        if (nodes.Wolf3D_Head?.morphTargetInfluences) {
          nodes.Wolf3D_Head.morphTargetInfluences[mouthOpenIndex] = mouthOpenValue;
          nodes.Wolf3D_Head.morphTargetInfluences[mouthSmileIndex] = mouthSmileValue;
        }
      }, MOUTH_UPDATE_INTERVAL);
      
    } else if (!effectivelySpeaking) {
      // Message is complete or not speaking, return to idle
      clearInterval(mouthAnimationInterval);
      clearTimeout(talkingTimeout);
      clearInterval(animationSwitchInterval);
      
      // Don't switch animation immediately if we're transitioning from speaking
      if (animation.includes("Talking")) {
        // Start a smooth transition back to idle
        const currentOpenValue = nodes.Wolf3D_Head.morphTargetInfluences[mouthOpenIndex] || 0;
        const currentSmileValue = nodes.Wolf3D_Head.morphTargetInfluences[mouthSmileIndex] || 0;
        const targetOpenValue = 0.01;
        const targetSmileValue = 0.6;
        
        setAnimation("Idle");
        
        // Create a smooth transition for mouth morphs
        const steps = 10;
        const stepDuration = TRANSITION_DURATION / steps;
        
        let step = 0;
        const mouthTransitionInterval = setInterval(() => {
          step++;
          const progress = step / steps;
          
          // Linear interpolation for mouth shapes
          // Safety check before modifying mouth movements
          if (nodes.Wolf3D_Head?.morphTargetInfluences) {
            nodes.Wolf3D_Head.morphTargetInfluences[mouthOpenIndex] = 
              currentOpenValue + (targetOpenValue - currentOpenValue) * progress;
            nodes.Wolf3D_Head.morphTargetInfluences[mouthSmileIndex] = 
              currentSmileValue + (targetSmileValue - currentSmileValue) * progress;
          }
          
          if (step >= steps) {
            clearInterval(mouthTransitionInterval);
          }
        }, stepDuration);
      } else if (animation !== "Idle" && !animation.includes("Greeting")) {
        setAnimation("Idle");
        setDefaultSmile();
      }
    }
    
    // Clean up on unmount or when dependencies change
    return () => {
      clearInterval(mouthAnimationInterval);
      clearTimeout(talkingTimeout);
      clearInterval(animationSwitchInterval);
    };
  }, [effectivelySpeaking, lastMessage, isFirstGreeting, actions, animation, nodes]);

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
      console.log(`Playing animation: ${animation}`);
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
