import { useAnimations, useGLTF, useFBX } from "@react-three/drei";
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { useChat } from "../hooks/useChat";
import { useVoice } from "../hooks/useVoice";
import { useModel } from "../hooks/useModel";

export const AvatarFemale = forwardRef((props, ref) => {
  const { nodes, materials } = useGLTF("/models/female_avatar.glb");
  const group = useRef();
  const rootBoneRef = useRef();
  const { messages } = useChat();
  const { isSpeaking } = useVoice();
  const { modelConfig } = useModel();
  const [animation, setAnimation] = useState("Idle");
  const [isFirstGreeting, setIsFirstGreeting] = useState(true);
  const [isPlayingRandomAnimation, setIsPlayingRandomAnimation] = useState(false);
  const [localIsSpeaking, setLocalIsSpeaking] = useState(false);
  const lastMessageRef = useRef(null);

  // Store original position of root bone
  const [rootBoneOriginalPosition, setRootBoneOriginalPosition] = useState(null);
  const [rootBoneOriginalQuaternion, setRootBoneOriginalQuaternion] = useState(null);
  
  // Load all animations
  const { animations: idleAnimations } = useFBX("animations/female_avatar_animations/idle.fbx");
  const { animations: greetingAnimations } = useFBX("animations/female_avatar_animations/greeting.fbx");
  const { animations: talkingAnimations } = useFBX("animations/female_avatar_animations/talking.fbx");
  const { animations: talkingAltAnimations } = useFBX("animations/female_avatar_animations/talking_alternative.fbx");
  
  // Name the animations
  idleAnimations[0].name = "Idle";
  greetingAnimations[0].name = "DefaultGreeting";
  talkingAnimations[0].name = "DefaultTalking";
  talkingAltAnimations[0].name = "AlternativeTalking";

  // Setup animations
  const { actions, mixer } = useAnimations(
    [idleAnimations[0], greetingAnimations[0], talkingAnimations[0], talkingAltAnimations[0]], 
    group
  );

  // Store reference to the root bone and its original position on mount
  useEffect(() => {
    if (nodes.CC_Base_BoneRoot) {
      rootBoneRef.current = nodes.CC_Base_BoneRoot;
      
      // Store original position and rotation
      setRootBoneOriginalPosition(rootBoneRef.current.position.clone());
      setRootBoneOriginalQuaternion(rootBoneRef.current.quaternion.clone());
    }
  }, [nodes]);

  // Get the last message for animation context
  const lastMessage = messages && messages.length > 0 
    ? messages[messages.length - 1] 
    : null;

  // Expose methods to parent components through ref
  useImperativeHandle(ref, () => ({
    isPlayingSpecialAnimation: () => {
      return isSpeaking || localIsSpeaking || isFirstGreeting || isPlayingRandomAnimation;
    },
    group: group
  }));

  // Switch animation when animation state changes
  useEffect(() => {
    if (actions && actions[animation]) {
      console.log(`Playing animation: ${animation}`);
      
      // Get all currently running animations for proper crossfading
      const runningActions = [];
      Object.entries(actions).forEach(([name, action]) => {
        if (action.isRunning()) {
          runningActions.push({ name, action });
        }
      });
      
      // Set up the new animation first before fading out old ones
      const currentAction = actions[animation];
      currentAction.reset();
      
      // Apply different transition times based on animation types
      let transitionTime = 0.5; // Default transition
      
      if (animation.includes("Talking") && runningActions.some(a => a.name.includes("Talking"))) {
        // Extra smooth transition between talking animations
        transitionTime = 0.8;
      } else if (animation === "Idle" && runningActions.some(a => a.name.includes("Talking"))) {
        // Smooth transition from talking to idle
        transitionTime = 1.0;
      }
      
      // Now fade out all current animations with the appropriate transition time
      runningActions.forEach(({ name, action }) => {
        if (name !== animation) {
          action.fadeOut(transitionTime);
        }
      });
      
      // And fade in the new animation
      currentAction.fadeIn(transitionTime).play();
      
      // Add event listeners to the mixer to reset root bone
      if (mixer) {
        const resetRootBone = () => {
          if (rootBoneRef.current && rootBoneOriginalPosition && rootBoneOriginalQuaternion) {
            // Reset to original position and rotation
            rootBoneRef.current.position.copy(rootBoneOriginalPosition);
            rootBoneRef.current.quaternion.copy(rootBoneOriginalQuaternion);
          }
        };
        
        // Reset after each animation frame
        mixer.addEventListener('loop', resetRootBone);
        mixer.addEventListener('finished', resetRootBone);
        
        return () => {
          mixer.removeEventListener('loop', resetRootBone);
          mixer.removeEventListener('finished', resetRootBone);
        };
      }
    } else if (actions) {
      console.error("Animation not found in actions:", animation);
    }
  }, [animation, actions, mixer, rootBoneOriginalPosition, rootBoneOriginalQuaternion]);

  // Animation constants
  const FALLBACK_SPEAKING_DURATION = 3000; // 3 seconds when speech is disabled
  const BLINK_INTERVAL_MIN = 2000; // Minimum time between blinks in milliseconds
  const BLINK_INTERVAL_MAX = 6000; // Maximum time between blinks

  // Create refs for blinking state
  const blinkTimeoutRef = useRef(null);
  const isBlinkingRef = useRef(false);

  // Handle initial greeting animation
  useEffect(() => {
    if (isFirstGreeting) {
      setAnimation("DefaultGreeting");
      
      const greetingDuration = actions["DefaultGreeting"]?.getClip().duration * 1000 || 3000;
      setTimeout(() => {
        setIsFirstGreeting(false);
        setAnimation("Idle");
      }, greetingDuration);
    }
  }, [isFirstGreeting, actions]);

  // Monitor last message changes to trigger animation in speech disabled mode
  useEffect(() => {
    if (!lastMessage) return;
    
    // Keep track of the last message for comparison
    if (lastMessageRef.current?.text !== lastMessage.text && lastMessage.sender === 'ai') {
      lastMessageRef.current = lastMessage;
      
      // Check if speech is disabled but we got a new AI message - simulate speaking state
      if (modelConfig && modelConfig.use_speech_output === false) {
        setLocalIsSpeaking(true);
        
        // Set timer to stop the simulated speaking after FALLBACK_SPEAKING_DURATION
        const timer = setTimeout(() => {
          setLocalIsSpeaking(false);
        }, FALLBACK_SPEAKING_DURATION);
        
        return () => clearTimeout(timer);
      }
    }
  }, [lastMessage, modelConfig]);
  
  // Play random animation function
  const playRandomAnimation = useCallback(() => {
    const animationOptions = [
      "DefaultGreeting",
      "DefaultTalking",
      "AlternativeTalking"
    ];
    
    // Pick a random animation, excluding the current one
    let availableOptions = animationOptions.filter(anim => anim !== animation);
    const randomAnimation = availableOptions[Math.floor(Math.random() * availableOptions.length)];
    
    console.log(`Playing random animation: ${randomAnimation}`);
    setIsPlayingRandomAnimation(true);
    setAnimation(randomAnimation);
    
    // Get the duration of the animation
    const animationDuration = actions[randomAnimation]?.getClip().duration * 1000 || 2000;
    
    // Return to idle after the animation completes
    setTimeout(() => {
      setAnimation("Idle");
      setIsPlayingRandomAnimation(false);
    }, animationDuration);
  }, [animation, actions]);

  // Handle random animation trigger from prop
  useEffect(() => {
    if (props.triggerRandomAnimation && 
        !isSpeaking && 
        !localIsSpeaking && 
        !isFirstGreeting && 
        !isPlayingRandomAnimation) {
      playRandomAnimation();
    }
  }, [props.triggerRandomAnimation, isSpeaking, localIsSpeaking, isFirstGreeting, isPlayingRandomAnimation, playRandomAnimation]);

  // Handle talking animations based on speaking state
  useEffect(() => {
    let animationSwitchInterval;
    let animationTimeout;
    
    // Don't override first greeting or random animations
    if (isFirstGreeting || isPlayingRandomAnimation) {
      return;
    }
    
    // Switch to talking animation when speaking
    if (isSpeaking || localIsSpeaking) {
      // Clear any existing timeouts/intervals to prevent conflicts
      clearTimeout(animationTimeout);
      clearInterval(animationSwitchInterval);
      
      // Start with one of the talking animations
      const initialAnimation = Math.random() > 0.5 ? "DefaultTalking" : "AlternativeTalking";
      setAnimation(initialAnimation);
      
      // Create a function to handle smooth animation transitions
      const switchTalkingAnimation = () => {
        // Get current animation and its duration
        const currentAnim = animation.includes("Talking") ? animation : initialAnimation;
        const nextAnim = currentAnim === "DefaultTalking" ? "AlternativeTalking" : "DefaultTalking";
        const currentDuration = actions[currentAnim]?.getClip().duration * 1000 || 2000;
        
        // Allow current animation to play at least 80% through before switching
        const minimumPlayTime = currentDuration * 0.8;
        
        // Schedule the next animation after the current one is mostly complete
        animationTimeout = setTimeout(() => {
          // Only transition if still speaking
          if (isSpeaking || localIsSpeaking) {
            setAnimation(nextAnim);
            
            // Schedule the next animation transition
            switchTalkingAnimation();
          }
        }, minimumPlayTime);
      };
      
      // Start the animation switching cycle
      switchTalkingAnimation();
    } else {
      // Not speaking, return to idle with proper cleanup
      clearInterval(animationSwitchInterval);
      clearTimeout(animationTimeout);
      
      // Only switch to idle if not already idle and not in special animation
      if (animation !== "Idle" && !animation.includes("Greeting")) {
        setAnimation("Idle");
      }
    }
    
    // Clean up intervals and timeouts on unmount or dependency changes
    return () => {
      clearInterval(animationSwitchInterval);
      clearTimeout(animationTimeout);
    };
  }, [isSpeaking, localIsSpeaking, isFirstGreeting, isPlayingRandomAnimation, animation, actions]);

  // Keep position fixed every frame - actively counter any movement
  useFrame(() => {
    // Fix the group position
    if (group.current) {
      group.current.position.set(0, 0, 0);
      group.current.rotation.set(0, 0, 0);
    }
    
    // Fix the root bone position
    if (rootBoneRef.current && rootBoneOriginalPosition && rootBoneOriginalQuaternion) {
      rootBoneRef.current.position.copy(rootBoneOriginalPosition);
      rootBoneRef.current.quaternion.copy(rootBoneOriginalQuaternion);
    }
    
    // Also fix the Armature group position
    const armature = group.current?.getObjectByName("Armature");
    if (armature) {
      armature.position.set(0, 0, 0);
      armature.rotation.set(0, 0, 0);
    }
    
    // Fix the Scene group
    const scene = group.current?.getObjectByName("Scene");
    if (scene) {
      scene.position.set(0, 0, 0);
      scene.rotation.set(0, 0, 0);
    }
  });

  // Create a ref to track morph targets
  const mouthMorphsRef = useRef({});
  const isSpeakingRef = useRef(false);
  const isGreetingRef = useRef(false);

  // Check for available morph targets once on mount
  useEffect(() => {
    console.log("Checking available morph targets in model...");
  }, [nodes]);

  // Helper functions for mouth morphs
  const resetMouthMorphs = useCallback(() => {
    const morphs = mouthMorphsRef.current;
    if (!nodes.CC_Base_Body_2?.morphTargetInfluences) return;
    
    if (morphs.mouthOpen !== undefined) nodes.CC_Base_Body_2.morphTargetInfluences[morphs.mouthOpen] = 0.05;
    if (morphs.mouthSmile !== undefined) nodes.CC_Base_Body_2.morphTargetInfluences[morphs.mouthSmile] = 0.3;
    if (morphs.mouthSmileL !== undefined) nodes.CC_Base_Body_2.morphTargetInfluences[morphs.mouthSmileL] = 0.3;
    if (morphs.mouthSmileR !== undefined) nodes.CC_Base_Body_2.morphTargetInfluences[morphs.mouthSmileR] = 0.3;
    if (morphs.mouthBottom !== undefined) nodes.CC_Base_Body_2.morphTargetInfluences[morphs.mouthBottom] = 0;
    if (morphs.mouthTop !== undefined) nodes.CC_Base_Body_2.morphTargetInfluences[morphs.mouthTop] = 0;
  }, [nodes.CC_Base_Body_2]);

  const setGreetingSmile = useCallback(() => {
    const morphs = mouthMorphsRef.current;
    if (!nodes.CC_Base_Body_2?.morphTargetInfluences) return;
    
    if (morphs.mouthSmile !== undefined) nodes.CC_Base_Body_2.morphTargetInfluences[morphs.mouthSmile] = 0.7;
    if (morphs.mouthSmileL !== undefined) nodes.CC_Base_Body_2.morphTargetInfluences[morphs.mouthSmileL] = 0.7;
    if (morphs.mouthSmileR !== undefined) nodes.CC_Base_Body_2.morphTargetInfluences[morphs.mouthSmileR] = 0.7;
    if (morphs.mouthOpen !== undefined) nodes.CC_Base_Body_2.morphTargetInfluences[morphs.mouthOpen] = 0.15;
  }, [nodes.CC_Base_Body_2]);

  // Add this effect for mouth animations
  useEffect(() => {
    // Don't animate the mouth if morph targets aren't available
    if (!nodes.CC_Base_Body_2?.morphTargetDictionary || !nodes.CC_Base_Body_2?.morphTargetInfluences) {
      return;
    }

    // Store the morph indices in the ref so we can access them in useFrame
    mouthMorphsRef.current = {
      mouthOpen: nodes.CC_Base_Body_2.morphTargetDictionary["Mouth_Open"],
      mouthSmile: nodes.CC_Base_Body_2.morphTargetDictionary["Mouth_Smile"],
      mouthSmileL: nodes.CC_Base_Body_2.morphTargetDictionary["Mouth_Smile_L"],
      mouthSmileR: nodes.CC_Base_Body_2.morphTargetDictionary["Mouth_Smile_R"],
      mouthBottom: nodes.CC_Base_Body_2.morphTargetDictionary["Mouth_Bottom_Lip_Down"],
      mouthTop: nodes.CC_Base_Body_2.morphTargetDictionary["Mouth_Top_Lip_Up"]
    };

    // Check that we have at least one usable mouth morph
    if (mouthMorphsRef.current.mouthOpen === undefined && mouthMorphsRef.current.mouthSmileL === undefined) {
      console.error("No usable mouth morphs found");
      return;
    }

    // Update refs for speaking and greeting status
    isSpeakingRef.current = (isSpeaking || localIsSpeaking) && !isFirstGreeting && !isPlayingRandomAnimation;
    isGreetingRef.current = isFirstGreeting;

    // Reset all influences to default state initially
    resetMouthMorphs();
    
    let mouthAnimationInterval;
    
    // If speaking, animate the mouth with more natural random values
    if (isSpeakingRef.current) {
      clearInterval(mouthAnimationInterval);
      
      mouthAnimationInterval = setInterval(() => {
        // Generate random mouth values with more natural ranges
        const openAmount = Math.random() * 0.5 + 0.1; // Range 0.1-0.6 (more moderate)
        const smileAmount = Math.random() * 0.2 + 0.4; // Range 0.4-0.6 (pleasant smile)
        
        // Apply to primary mouth morphs with natural values
        if (mouthMorphsRef.current.mouthOpen !== undefined && nodes.CC_Base_Body_2) {
          nodes.CC_Base_Body_2.morphTargetInfluences[mouthMorphsRef.current.mouthOpen] = openAmount;
        }
        
        // Occasionally use lip movement for variation
        if (Math.random() > 0.6) {
          if (mouthMorphsRef.current.mouthBottom !== undefined && nodes.CC_Base_Body_2) {
            const bottomAmount = Math.random() * 0.3; // More subtle
            nodes.CC_Base_Body_2.morphTargetInfluences[mouthMorphsRef.current.mouthBottom] = bottomAmount;
          }
        }
        
        // Adjust smile based on how open the mouth is
        if (nodes.CC_Base_Body_2) {
          const adjustedSmileAmount = openAmount > 0.4 ? smileAmount * 0.7 : smileAmount;
          
          // Apply smile with natural values
          if (mouthMorphsRef.current.mouthSmile !== undefined) {
            nodes.CC_Base_Body_2.morphTargetInfluences[mouthMorphsRef.current.mouthSmile] = adjustedSmileAmount;
          }
          
          if (mouthMorphsRef.current.mouthSmileL !== undefined) {
            nodes.CC_Base_Body_2.morphTargetInfluences[mouthMorphsRef.current.mouthSmileL] = adjustedSmileAmount;
          }
          
          if (mouthMorphsRef.current.mouthSmileR !== undefined) {
            nodes.CC_Base_Body_2.morphTargetInfluences[mouthMorphsRef.current.mouthSmileR] = adjustedSmileAmount;
          }
        }
      }, 150); // Moderate interval for more natural movement
    } else {
      // Not speaking, reset to default state
      clearInterval(mouthAnimationInterval);
      
      if (isFirstGreeting) {
        // Warm smile for greeting (not extreme)
        setGreetingSmile();
      } else {
        resetMouthMorphs();
      }
    }
    
    // Cleanup
    return () => {
      clearInterval(mouthAnimationInterval);
    };
  }, [
    isSpeaking, 
    localIsSpeaking, 
    isFirstGreeting, 
    isPlayingRandomAnimation, 
    nodes.CC_Base_Body_2,
    resetMouthMorphs,
    setGreetingSmile
  ]);

  // Add this effect to handle periodic eye blinking with smooth transitions
  useEffect(() => {
    // Check if we have the necessary morph targets for blinking
    if (!nodes.CC_Base_Body_2?.morphTargetDictionary || !nodes.CC_Base_Body_2?.morphTargetInfluences) {
      return;
    }
    
    // Get eye blink morph targets
    const eyeBlinkLeftIndex = nodes.CC_Base_Body_2.morphTargetDictionary["Eye_Blink_L"];
    const eyeBlinkRightIndex = nodes.CC_Base_Body_2.morphTargetDictionary["Eye_Blink_R"];
    const eyeBlinkIndex = nodes.CC_Base_Body_2.morphTargetDictionary["Eyes_Blink"];
    
    // Store these in a ref for use in the blink function
    const blinkMorphs = {
      left: eyeBlinkLeftIndex,
      right: eyeBlinkRightIndex,
      both: eyeBlinkIndex
    };
    
    // If we don't have any valid blink morphs, exit
    if (blinkMorphs.left === undefined && blinkMorphs.right === undefined && blinkMorphs.both === undefined) {
      return;
    }
    
    // Constants for smooth blinking
    const BLINK_CLOSE_DURATION = 100; // Time to close eyes (ms)
    const BLINK_STAY_CLOSED_DURATION = 50; // Time eyes stay closed (ms)
    const BLINK_OPEN_DURATION = 150; // Time to open eyes again (ms)
    
    // Function to perform a single blink with smooth transitions
    const doBlink = () => {
      if (!nodes.CC_Base_Body_2?.morphTargetInfluences) return;
      
      isBlinkingRef.current = true;
      let blinkStartTime = Date.now();
      let blinkPhase = 'closing'; // phases: closing, closed, opening
      
      // Create animation frames for smooth blinking
      const animateBlink = () => {
        const now = Date.now();
        const elapsed = now - blinkStartTime;
        
        // Phase 1: Closing the eyes smoothly
        if (blinkPhase === 'closing') {
          // Calculate progress of eye closing (0 to 1)
          const progress = Math.min(elapsed / BLINK_CLOSE_DURATION, 1);
          
          // Apply easing for more natural movement (ease-in)
          const easedProgress = Math.sin(progress * Math.PI / 2);
          
          // Apply the morphs with the eased progress
          if (blinkMorphs.both !== undefined) {
            nodes.CC_Base_Body_2.morphTargetInfluences[blinkMorphs.both] = easedProgress;
          }
          if (blinkMorphs.left !== undefined) {
            nodes.CC_Base_Body_2.morphTargetInfluences[blinkMorphs.left] = easedProgress;
          }
          if (blinkMorphs.right !== undefined) {
            nodes.CC_Base_Body_2.morphTargetInfluences[blinkMorphs.right] = easedProgress;
          }
          
          // If we've finished closing, move to the 'closed' phase
          if (progress >= 1) {
            blinkPhase = 'closed';
            blinkStartTime = now; // Reset the timer for the next phase
          }
          
          requestAnimationFrame(animateBlink);
        }
        
        // Phase 2: Keep eyes closed for a moment
        else if (blinkPhase === 'closed') {
          // Keep eyes fully closed
          if (blinkMorphs.both !== undefined) {
            nodes.CC_Base_Body_2.morphTargetInfluences[blinkMorphs.both] = 1.0;
          }
          if (blinkMorphs.left !== undefined) {
            nodes.CC_Base_Body_2.morphTargetInfluences[blinkMorphs.left] = 1.0;
          }
          if (blinkMorphs.right !== undefined) {
            nodes.CC_Base_Body_2.morphTargetInfluences[blinkMorphs.right] = 1.0;
          }
          
          // If we've stayed closed long enough, start opening
          if (elapsed >= BLINK_STAY_CLOSED_DURATION) {
            blinkPhase = 'opening';
            blinkStartTime = now; // Reset the timer for the next phase
          }
          
          requestAnimationFrame(animateBlink);
        }
        
        // Phase 3: Opening the eyes smoothly
        else if (blinkPhase === 'opening') {
          // Calculate progress of eye opening (0 to 1)
          const progress = Math.min(elapsed / BLINK_OPEN_DURATION, 1);
          
          // Apply easing for more natural movement (ease-out)
          const easedProgress = 1 - Math.sin((1 - progress) * Math.PI / 2);
          
          // Apply the morphs with the eased progress (inverted since we're opening)
          if (blinkMorphs.both !== undefined) {
            nodes.CC_Base_Body_2.morphTargetInfluences[blinkMorphs.both] = 1 - easedProgress;
          }
          if (blinkMorphs.left !== undefined) {
            nodes.CC_Base_Body_2.morphTargetInfluences[blinkMorphs.left] = 1 - easedProgress;
          }
          if (blinkMorphs.right !== undefined) {
            nodes.CC_Base_Body_2.morphTargetInfluences[blinkMorphs.right] = 1 - easedProgress;
          }
          
          // If we've finished opening, end the animation
          if (progress >= 1) {
            isBlinkingRef.current = false;
            scheduleNextBlink();
            return;
          }
          
          requestAnimationFrame(animateBlink);
        }
      };
      
      // Start the animation
      animateBlink();
    };
    
    // Function to schedule the next blink
    const scheduleNextBlink = () => {
      // Clear any existing timeout
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current);
      }
      
      // Random interval between min and max
      const nextBlinkTime = Math.random() * (BLINK_INTERVAL_MAX - BLINK_INTERVAL_MIN) + BLINK_INTERVAL_MIN;
      
      // Schedule next blink
      blinkTimeoutRef.current = setTimeout(doBlink, nextBlinkTime);
    };
    
    // Start the blinking cycle
    scheduleNextBlink();
    
    // Clean up on unmount
    return () => {
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current);
      }
    };
  }, [nodes.CC_Base_Body_2]);

  // Use a separate useFrame hook outside of useEffect
  useFrame(() => {
    // Keep enforcing morph target values each frame
    if (!nodes.CC_Base_Body_2?.morphTargetInfluences) return;
    
    // Update speaking and greeting refs to current state
    isSpeakingRef.current = (isSpeaking || localIsSpeaking) && !isFirstGreeting && !isPlayingRandomAnimation;
    isGreetingRef.current = isFirstGreeting;
    
    const morphs = mouthMorphsRef.current;
    
    // Only enforce mouth morphs if we're not in the middle of blinking
    if (!isBlinkingRef.current) {
      // We don't need to do anything in the useFrame for speaking since the interval handles it
      if (!isSpeakingRef.current && isGreetingRef.current) {
        // Keep enforcing greeting smile in each frame
        if (morphs.mouthSmile !== undefined) {
          nodes.CC_Base_Body_2.morphTargetInfluences[morphs.mouthSmile] = 0.7;
        }
        if (morphs.mouthSmileL !== undefined) {
          nodes.CC_Base_Body_2.morphTargetInfluences[morphs.mouthSmileL] = 0.7;
        }
        if (morphs.mouthSmileR !== undefined) {
          nodes.CC_Base_Body_2.morphTargetInfluences[morphs.mouthSmileR] = 0.7;
        }
        if (morphs.mouthOpen !== undefined) {
          nodes.CC_Base_Body_2.morphTargetInfluences[morphs.mouthOpen] = 0.15;
        }
      } else if (!isSpeakingRef.current && !isGreetingRef.current && !isPlayingRandomAnimation) {
        // Keep enforcing the default idle expression - slight smile
        if (morphs.mouthSmile !== undefined) {
          nodes.CC_Base_Body_2.morphTargetInfluences[morphs.mouthSmile] = 0.3;
        }
        if (morphs.mouthSmileL !== undefined) {
          nodes.CC_Base_Body_2.morphTargetInfluences[morphs.mouthSmileL] = 0.3;
        }
        if (morphs.mouthSmileR !== undefined) {
          nodes.CC_Base_Body_2.morphTargetInfluences[morphs.mouthSmileR] = 0.3;
        }
      }
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group name="Armature" scale={0.01}>
          <skinnedMesh
            name="Bra"
            geometry={nodes.Bra.geometry}
            material={materials.Bra}
            skeleton={nodes.Bra.skeleton}
          />
          <group name="CC_Base_Body">
            <skinnedMesh
              name="CC_Base_Body_1"
              geometry={nodes.CC_Base_Body_1.geometry}
              material={materials.Std_Tongue}
              skeleton={nodes.CC_Base_Body_1.skeleton}
              morphTargetDictionary={nodes.CC_Base_Body_1.morphTargetDictionary}
              morphTargetInfluences={nodes.CC_Base_Body_1.morphTargetInfluences}
            />
            <skinnedMesh
              name="CC_Base_Body_2"
              geometry={nodes.CC_Base_Body_2.geometry}
              material={materials.Std_Skin_Head}
              skeleton={nodes.CC_Base_Body_2.skeleton}
              morphTargetDictionary={nodes.CC_Base_Body_2.morphTargetDictionary}
              morphTargetInfluences={nodes.CC_Base_Body_2.morphTargetInfluences}
            />
            <skinnedMesh
              name="CC_Base_Body_3"
              geometry={nodes.CC_Base_Body_3.geometry}
              material={materials.Std_Skin_Body}
              skeleton={nodes.CC_Base_Body_3.skeleton}
              morphTargetDictionary={nodes.CC_Base_Body_3.morphTargetDictionary}
              morphTargetInfluences={nodes.CC_Base_Body_3.morphTargetInfluences}
            />
            <skinnedMesh
              name="CC_Base_Body_4"
              geometry={nodes.CC_Base_Body_4.geometry}
              material={materials.Std_Skin_Arm}
              skeleton={nodes.CC_Base_Body_4.skeleton}
              morphTargetDictionary={nodes.CC_Base_Body_4.morphTargetDictionary}
              morphTargetInfluences={nodes.CC_Base_Body_4.morphTargetInfluences}
            />
            <skinnedMesh
              name="CC_Base_Body_5"
              geometry={nodes.CC_Base_Body_5.geometry}
              material={materials.Std_Skin_Leg}
              skeleton={nodes.CC_Base_Body_5.skeleton}
              morphTargetDictionary={nodes.CC_Base_Body_5.morphTargetDictionary}
              morphTargetInfluences={nodes.CC_Base_Body_5.morphTargetInfluences}
            />
            <skinnedMesh
              name="CC_Base_Body_6"
              geometry={nodes.CC_Base_Body_6.geometry}
              material={materials.Std_Nails}
              skeleton={nodes.CC_Base_Body_6.skeleton}
              morphTargetDictionary={nodes.CC_Base_Body_6.morphTargetDictionary}
              morphTargetInfluences={nodes.CC_Base_Body_6.morphTargetInfluences}
            />
            <skinnedMesh
              name="CC_Base_Body_7"
              geometry={nodes.CC_Base_Body_7.geometry}
              material={materials.Std_Eyelash}
              skeleton={nodes.CC_Base_Body_7.skeleton}
              morphTargetDictionary={nodes.CC_Base_Body_7.morphTargetDictionary}
              morphTargetInfluences={nodes.CC_Base_Body_7.morphTargetInfluences}
            />
            <skinnedMesh
              name="CC_Base_Body_8"
              geometry={nodes.CC_Base_Body_8.geometry}
              material={materials.Std_Upper_Teeth}
              skeleton={nodes.CC_Base_Body_8.skeleton}
              morphTargetDictionary={nodes.CC_Base_Body_8.morphTargetDictionary}
              morphTargetInfluences={nodes.CC_Base_Body_8.morphTargetInfluences}
            />
            <skinnedMesh
              name="CC_Base_Body_9"
              geometry={nodes.CC_Base_Body_9.geometry}
              material={materials.Std_Lower_Teeth}
              skeleton={nodes.CC_Base_Body_9.skeleton}
              morphTargetDictionary={nodes.CC_Base_Body_9.morphTargetDictionary}
              morphTargetInfluences={nodes.CC_Base_Body_9.morphTargetInfluences}
            />
            <skinnedMesh
              name="CC_Base_Body_10"
              geometry={nodes.CC_Base_Body_10.geometry}
              material={materials.Std_Eye_R}
              skeleton={nodes.CC_Base_Body_10.skeleton}
              morphTargetDictionary={nodes.CC_Base_Body_10.morphTargetDictionary}
              morphTargetInfluences={nodes.CC_Base_Body_10.morphTargetInfluences}
            />
            <skinnedMesh
              name="CC_Base_Body_11"
              geometry={nodes.CC_Base_Body_11.geometry}
              material={materials.Std_Cornea_R}
              skeleton={nodes.CC_Base_Body_11.skeleton}
              morphTargetDictionary={nodes.CC_Base_Body_11.morphTargetDictionary}
              morphTargetInfluences={nodes.CC_Base_Body_11.morphTargetInfluences}
            />
            <skinnedMesh
              name="CC_Base_Body_12"
              geometry={nodes.CC_Base_Body_12.geometry}
              material={materials.Std_Eye_L}
              skeleton={nodes.CC_Base_Body_12.skeleton}
              morphTargetDictionary={nodes.CC_Base_Body_12.morphTargetDictionary}
              morphTargetInfluences={nodes.CC_Base_Body_12.morphTargetInfluences}
            />
            <skinnedMesh
              name="CC_Base_Body_13"
              geometry={nodes.CC_Base_Body_13.geometry}
              material={materials.Std_Cornea_L}
              skeleton={nodes.CC_Base_Body_13.skeleton}
              morphTargetDictionary={nodes.CC_Base_Body_13.morphTargetDictionary}
              morphTargetInfluences={nodes.CC_Base_Body_13.morphTargetInfluences}
            />
          </group>
          <group name="CC_Base_EyeOcclusion">
            <skinnedMesh
              name="CC_Base_EyeOcclusion_1"
              geometry={nodes.CC_Base_EyeOcclusion_1.geometry}
              material={materials.Std_Eye_Occlusion_R}
              skeleton={nodes.CC_Base_EyeOcclusion_1.skeleton}
              morphTargetDictionary={nodes.CC_Base_EyeOcclusion_1.morphTargetDictionary}
              morphTargetInfluences={nodes.CC_Base_EyeOcclusion_1.morphTargetInfluences}
            />
            <skinnedMesh
              name="CC_Base_EyeOcclusion_2"
              geometry={nodes.CC_Base_EyeOcclusion_2.geometry}
              material={materials.Std_Eye_Occlusion_L}
              skeleton={nodes.CC_Base_EyeOcclusion_2.skeleton}
              morphTargetDictionary={nodes.CC_Base_EyeOcclusion_2.morphTargetDictionary}
              morphTargetInfluences={nodes.CC_Base_EyeOcclusion_2.morphTargetInfluences}
            />
          </group>
          <group name="CC_Base_TearLine">
            <skinnedMesh
              name="CC_Base_TearLine_1"
              geometry={nodes.CC_Base_TearLine_1.geometry}
              material={materials.Std_Tearline_R}
              skeleton={nodes.CC_Base_TearLine_1.skeleton}
              morphTargetDictionary={nodes.CC_Base_TearLine_1.morphTargetDictionary}
              morphTargetInfluences={nodes.CC_Base_TearLine_1.morphTargetInfluences}
            />
            <skinnedMesh
              name="CC_Base_TearLine_2"
              geometry={nodes.CC_Base_TearLine_2.geometry}
              material={materials.Std_Tearline_L}
              skeleton={nodes.CC_Base_TearLine_2.skeleton}
              morphTargetDictionary={nodes.CC_Base_TearLine_2.morphTargetDictionary}
              morphTargetInfluences={nodes.CC_Base_TearLine_2.morphTargetInfluences}
            />
          </group>
          <group name="Female_Angled">
            <skinnedMesh
              name="Female_Angled_1"
              geometry={nodes.Female_Angled_1.geometry}
              material={materials.Female_Angled_Transparency}
              skeleton={nodes.Female_Angled_1.skeleton}
              morphTargetDictionary={nodes.Female_Angled_1.morphTargetDictionary}
              morphTargetInfluences={nodes.Female_Angled_1.morphTargetInfluences}
            />
            <skinnedMesh
              name="Female_Angled_2"
              geometry={nodes.Female_Angled_2.geometry}
              material={materials.Female_Angled_Base_Transparency}
              skeleton={nodes.Female_Angled_2.skeleton}
              morphTargetDictionary={nodes.Female_Angled_2.morphTargetDictionary}
              morphTargetInfluences={nodes.Female_Angled_2.morphTargetInfluences}
            />
          </group>
          <skinnedMesh
            name="High_Heels"
            geometry={nodes.High_Heels.geometry}
            material={materials.High_Heels}
            skeleton={nodes.High_Heels.skeleton}
          />
          <skinnedMesh
            name="Knee_length_skirt"
            geometry={nodes.Knee_length_skirt.geometry}
            material={materials.Knee_length_skirt}
            skeleton={nodes.Knee_length_skirt.skeleton}
          />
          <group name="Side_part_wavy">
            <skinnedMesh
              name="Side_part_wavy_1"
              geometry={nodes.Side_part_wavy_1.geometry}
              material={materials.Scalp_Transparency}
              skeleton={nodes.Side_part_wavy_1.skeleton}
              morphTargetDictionary={nodes.Side_part_wavy_1.morphTargetDictionary}
              morphTargetInfluences={nodes.Side_part_wavy_1.morphTargetInfluences}
            />
            <skinnedMesh
              name="Side_part_wavy_2"
              geometry={nodes.Side_part_wavy_2.geometry}
              material={materials.Hair_Transparency}
              skeleton={nodes.Side_part_wavy_2.skeleton}
              morphTargetDictionary={nodes.Side_part_wavy_2.morphTargetDictionary}
              morphTargetInfluences={nodes.Side_part_wavy_2.morphTargetInfluences}
            />
          </group>
          <skinnedMesh
            name="Turtleneck_sweater"
            geometry={nodes.Turtleneck_sweater.geometry}
            material={materials.Turtleneck_sweater}
            skeleton={nodes.Turtleneck_sweater.skeleton}
          />
          <skinnedMesh
            name="Underwear_Bottoms"
            geometry={nodes.Underwear_Bottoms.geometry}
            material={materials.Underwear_Bottoms}
            skeleton={nodes.Underwear_Bottoms.skeleton}
          />
          <primitive object={nodes.CC_Base_BoneRoot} />
        </group>
      </group>
    </group>
  );
});

useGLTF.preload('/models/female_avatar.glb');