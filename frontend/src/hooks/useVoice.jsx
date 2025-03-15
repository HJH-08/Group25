import { useState, createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { useModel } from './useModel';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

const VoiceContext = createContext();

// Create a stable reference that persists across renders
// This will hold our speech recognizer outside React's lifecycle
const globalRecognizerState = {
  recognizer: null,
  isDisposed: true,
  isRecording: false
};

export const VoiceProvider = ({ children }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [currentAudio, setCurrentAudio] = useState(null);
  
  // Reference to track component's mounted state
  const isMountedRef = useRef(true);
  
  // Get model config to check if speech is enabled
  const { modelConfig } = useModel();
  
  // Load mute preference on component mount
  useEffect(() => {
    isMountedRef.current = true;
    
    const savedMuteState = localStorage.getItem('companioMuted') === 'true';
    if (savedMuteState) {
      setIsMuted(true);
      
      // Apply mute setting to all media elements
      document.querySelectorAll('audio, video').forEach(media => {
        media.muted = true;
      });
      
      // Suspend audio context if available
      if (typeof window !== 'undefined' && window.audioContext) {
        try {
          window.audioContext.suspend();
        } catch (e) {
          console.error("Could not suspend audio context:", e);
        }
      }
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Toggle mute function
  const toggleMute = useCallback(() => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    
    // Set muted state on current audio rather than stopping it
    if (currentAudio) {
      currentAudio.muted = newMuteState;
    }
    
    // Mute/unmute all HTML audio and video elements
    document.querySelectorAll('audio, video').forEach(media => {
      media.muted = newMuteState;
    });
    
    // For Web Audio API
    if (typeof window !== 'undefined' && window.audioContext) {
      try {
        if (newMuteState) {
          window.audioContext.suspend();
        } else {
          window.audioContext.resume();
        }
      } catch (e) {
        console.error("Could not control audio context:", e);
      }
    }
    
    // Store preference
    localStorage.setItem('companioMuted', newMuteState);
  }, [isMuted, currentAudio]);

  // Safe cleanup of the recognizer for reuse
  const disposeRecognizer = useCallback(() => {
    if (globalRecognizerState.recognizer && !globalRecognizerState.isDisposed) {
      console.log("Disposing speech recognizer...");
      try {
        // First stop recognition if it's running
        if (globalRecognizerState.isRecording) {
          globalRecognizerState.recognizer.stopContinuousRecognitionAsync(
            () => {
              console.log("Recognition stopped before disposal");
              try {
                globalRecognizerState.recognizer.close();
                console.log("Recognizer disposed after stopping");
              } catch (err) {
                console.error("Error closing recognizer after stopping:", err);
              }
              globalRecognizerState.isDisposed = true;
              globalRecognizerState.recognizer = null;
              globalRecognizerState.isRecording = false;
              
              if (isMountedRef.current) {
                setIsRecording(false);
              }
            },
            (err) => {
              console.error("Error stopping recognition during disposal:", err);
              try {
                globalRecognizerState.recognizer.close();
              } catch (closeErr) {
                console.error("Error closing recognizer after failed stop:", closeErr);
              }
              globalRecognizerState.isDisposed = true;
              globalRecognizerState.recognizer = null;
              globalRecognizerState.isRecording = false;
              
              if (isMountedRef.current) {
                setIsRecording(false);
              }
            }
          );
        } else {
          // If not recording, close directly
          globalRecognizerState.recognizer.close();
          globalRecognizerState.isDisposed = true;
          globalRecognizerState.recognizer = null;
          console.log("Recognizer disposed (not recording)");
        }
      } catch (err) {
        console.error("Error in disposeRecognizer:", err);
        globalRecognizerState.isDisposed = true;
        globalRecognizerState.recognizer = null;
        globalRecognizerState.isRecording = false;
        
        if (isMountedRef.current) {
          setIsRecording(false);
        }
      }
    }
  }, []);

  // Define stopRecording with useCallback to memoize it
  const stopRecording = useCallback(() => {
    if (!globalRecognizerState.recognizer || globalRecognizerState.isDisposed) {
      setIsRecording(false);
      globalRecognizerState.isRecording = false;
      return;
    }

    try {
      console.log("Stopping speech recognition...");
      globalRecognizerState.recognizer.stopContinuousRecognitionAsync(
        () => {
          console.log("Recognition stopped successfully");
          setIsRecording(false);
          globalRecognizerState.isRecording = false;
          
          // Don't automatically dispose after recognition
          // Let the user decide when to start/stop using the microphone
          // The recognizer will be disposed when component unmounts
        },
        (error) => {
          console.error("Error stopping recognition:", error);
          setIsRecording(false);
          globalRecognizerState.isRecording = false;
          
          // Only dispose in case of error
          disposeRecognizer();
        }
      );
    } catch (err) {
      console.error("Error in stopRecording:", err);
      setIsRecording(false);
      globalRecognizerState.isRecording = false;
      
      // Dispose in case of exception
      disposeRecognizer();
    }
  }, [disposeRecognizer]);

  // Initialize Azure recognizer with credentials
  const initializeAzureRecognizer = async () => {
    // If already initialized and not disposed, just reuse
    if (globalRecognizerState.recognizer && !globalRecognizerState.isDisposed) {
      console.log("Reusing existing recognizer");
      return globalRecognizerState.recognizer;
    }
    
    // Otherwise, create a new recognizer
    try {
      console.log("Initializing Azure Speech recognizer...");
      
      // Fetch Azure credentials from backend
      const response = await fetch('http://localhost:8000/api/azure-credentials');
      if (!response.ok) {
        throw new Error(`Failed to fetch Azure credentials: ${response.status}`);
      }
      
      const { subscriptionKey, region } = await response.json();
      console.log(`Got credentials for region: ${region}`);
      
      // Create speech config
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, region);
      speechConfig.speechRecognitionLanguage = 'en-US';
      
      // Create audio config for microphone input
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      
      // Create speech recognizer
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
      console.log("Recognizer created successfully");
      
      // Important: set up all event handlers before starting recognition
      recognizer.recognized = (sender, event) => {
        if (event.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const text = event.result.text.trim();
          console.log(`RECOGNIZED: ${text}`);
          if (text && isMountedRef.current) {
            setRecognizedText(text);
          }
        }
      };
      
      recognizer.recognizing = (sender, event) => {
        if (event.result.reason === SpeechSDK.ResultReason.RecognizingSpeech) {
          const text = event.result.text.trim();
          console.log(`RECOGNIZING: ${text}`);
        }
      };
      
      recognizer.canceled = (sender, event) => {
        console.log(`CANCELED: Reason=${event.reason}`);
        if (event.reason === SpeechSDK.CancellationReason.Error) {
          console.error(`CANCELED: ErrorCode=${event.errorCode}`);
          console.error(`CANCELED: ErrorDetails=${event.errorDetails}`);
        }
        
        globalRecognizerState.isRecording = false;
        if (isMountedRef.current) {
          setIsRecording(false);
        }
      };
      
      recognizer.sessionStarted = (sender, event) => {
        console.log("SESSION STARTED");
      };
      
      recognizer.sessionStopped = (sender, event) => {
        console.log("SESSION STOPPED");
        globalRecognizerState.isRecording = false;
        if (isMountedRef.current) {
          setIsRecording(false);
        }
      };
      
      // Store in global state
      globalRecognizerState.recognizer = recognizer;
      globalRecognizerState.isDisposed = false;
      
      console.log("Azure Speech recognizer initialized successfully");
      return recognizer;
    } catch (error) {
      console.error("Error initializing Azure Speech recognizer:", error);
      return null;
    }
  };

  const startRecording = async () => {
    // If already recording, stop first
    if (isRecording) {
      await stopRecording();
      // Small delay to ensure previous session is fully stopped
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Reset recognized text
    setRecognizedText('');
    console.log("Starting speech recognition...");
    
    try {
      // Get recognizer (initialize if needed)
      const recognizer = await initializeAzureRecognizer();
      
      if (!recognizer) {
        throw new Error("Failed to initialize speech recognizer");
      }
      
      // Start recognition
      recognizer.startContinuousRecognitionAsync(
        () => {
          console.log("✅ Recognition started successfully");
          globalRecognizerState.isRecording = true;
          if (isMountedRef.current) {
            setIsRecording(true);
          }
        },
        (error) => {
          console.error("❌ Error starting recognition:", error);
          globalRecognizerState.isRecording = false;
          if (isMountedRef.current) {
            setIsRecording(false);
          }
          disposeRecognizer();
        }
      );
    } catch (error) {
      console.error("Error in startRecording:", error);
      globalRecognizerState.isRecording = false;
      if (isMountedRef.current) {
        setIsRecording(false);
      }
      disposeRecognizer();
    }
  };

  // Stop any currently playing audio before playing new audio
  const stopCurrentAudio = useCallback(() => {
    if (currentAudio) {
      console.log("Stopping current audio playback");
      currentAudio.pause();
      currentAudio.src = "";
      URL.revokeObjectURL(currentAudio.src);
      setCurrentAudio(null);
      setIsSpeaking(false);
    }
  }, [currentAudio]);

  // Speak text using server-side TTS
  const speakText = async (text) => {
    // Don't speak if muted
    if (isMuted) {
      console.log("Audio is muted, skipping speech");
      return;
    }
    
    // Don't process empty text
    if (!text) return;
    
    // Add a stronger guard against concurrent speech requests
    if (isSpeaking || currentAudio) {
      console.log("Already speaking, ignoring new speech request");
      return;
    }
    
    // First check if modelConfig is loaded
    if (!modelConfig) {
      console.log("Model config not loaded yet, checking server directly");
      try {
        // Try to fetch speech setting directly from server
        const configResponse = await fetch('http://localhost:8000/api/config');
        if (!configResponse.ok) {
          throw new Error("Failed to check speech settings");
        }
        const serverConfig = await configResponse.json();
        
        // If speech is disabled on server, don't continue
        if (serverConfig.use_speech_output === false) {
          console.log("Speech output is disabled on server, skipping TTS");
          return;
        }
      } catch (error) {
        console.error("Error checking speech settings:", error);
        // Continue with speech anyway in case of error
      }
    } else if (modelConfig.use_speech_output === false) {
      // If modelConfig and speech is disabled, don't continue
      console.log("Speech output is disabled in settings, skipping TTS");
      return;
    }
    
    try {
      // Set speaking state first
      setIsSpeaking(true);
      // Store the current text being spoken to prevent duplicate requests
      const messageId = Date.now();
      window._lastSpokenMessageId = messageId;
      
      console.log(`Speaking text (ID: ${messageId}):`, text.substring(0, 50) + "...");
      
      const response = await fetch('http://localhost:8000/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      
      if (!response.ok) {
        throw new Error(`TTS API returned ${response.status} ${response.statusText}`);
      }
      
      const audioBlob = await response.blob();
      console.log(`Received audio blob of size: ${audioBlob.size} bytes`);
      
      // Check if another speech request has taken priority during fetch
      if (window._lastSpokenMessageId !== messageId) {
        console.log("New speech request started, aborting this one");
        setIsSpeaking(false);
        return;
      }
      
      if (audioBlob.size < 100) {
        console.warn("Warning: Audio blob is very small, might be empty");
        setIsSpeaking(false);
        return;
      }
      
      // Create a clean new audio element
      const audio = new Audio();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Store current audio
      setCurrentAudio(audio);
      
      // Set up event handlers before setting source
      audio.onended = () => {
        console.log(`Audio playback completed for message ID: ${messageId}`);
        URL.revokeObjectURL(audioUrl);
        if (isMountedRef.current) {
          setCurrentAudio(null);
          setIsSpeaking(false);
        }
      };
      
      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        URL.revokeObjectURL(audioUrl);
        if (isMountedRef.current) {
          setCurrentAudio(null);
          setIsSpeaking(false);
        }
      };
      
      // Set source and play
      audio.src = audioUrl;
      await audio.play().catch(error => {
        console.error("Failed to play audio:", error);
        URL.revokeObjectURL(audioUrl);
        if (isMountedRef.current) {
          setCurrentAudio(null);
          setIsSpeaking(false);
        }
      });
      
    } catch (error) {
      console.error("Error in speech synthesis:", error);
      if (isMountedRef.current) {
        setIsSpeaking(false);
        setCurrentAudio(null);
      }
    }
  };

  // Cleanup function when component unmounts - only happens when the app truly closes
  useEffect(() => {
    // This will run when the component is truly unmounted
    return () => {
      console.log("Component TRULY unmounting, cleaning up resources");
      stopCurrentAudio();
      
      // Use the global state to clean up
      if (globalRecognizerState.recognizer && !globalRecognizerState.isDisposed) {
        try {
          // Direct cleanup without callbacks to avoid React state updates
          if (globalRecognizerState.isRecording) {
            try {
              globalRecognizerState.recognizer.stopContinuousRecognitionAsync();
            } catch (stopErr) {
              console.error("Final cleanup - stop error:", stopErr);
            }
          }
          
          try {
            globalRecognizerState.recognizer.close();
          } catch (closeErr) {
            console.error("Final cleanup - close error:", closeErr);
          }
          
          globalRecognizerState.isDisposed = true;
          globalRecognizerState.recognizer = null;
          globalRecognizerState.isRecording = false;
          
          console.log("Successfully cleaned up speech recognizer on unmount");
        } catch (err) {
          console.error("Error during final cleanup:", err);
          globalRecognizerState.isDisposed = true;
          globalRecognizerState.recognizer = null;
        }
      }
    };
  }, [stopCurrentAudio]);

  return (
    <VoiceContext.Provider
      value={{
        isRecording,
        isSpeaking, 
        isMuted,
        recognizedText,
        setRecognizedText,
        startRecording,
        stopRecording,
        speakText,
        toggleMute,
        stopCurrentAudio
      }}
    >
      {children}
      <audio 
        style={{ display: 'none' }} 
        onEnded={() => isMountedRef.current && setIsSpeaking(false)}
      />
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoice must be used within a VoiceProvider");
  }
  return context;
};