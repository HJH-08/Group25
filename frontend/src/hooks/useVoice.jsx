import { useState, createContext, useContext, useCallback, useEffect } from 'react';
import { useModel } from './useModel';

const VoiceContext = createContext();

// Set up browser speech recognition with fallbacks
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

// Configure speech recognition if available
if (recognition) {
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
}

export const VoiceProvider = ({ children }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Add mute state
  const [recognizedText, setRecognizedText] = useState('');
  const [currentAudio, setCurrentAudio] = useState(null);
  
  // Get model config to check if speech is enabled
  const { modelConfig } = useModel();
  
  // Load mute preference on component mount
  useEffect(() => {
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

  // Define stopRecording with useCallback to memoize it
  const stopRecording = useCallback(() => {
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const startRecording = async () => {
    if (!recognition) {
      console.error("Speech recognition not supported in this browser");
      return;
    }

    try {
      // Set up recognition handlers
      recognition.onstart = () => {
        setIsRecording(true);
        setRecognizedText('');
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setRecognizedText(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        stopRecording();
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      // Start listening
      recognition.start();
    } catch (error) {
      console.error("Error starting speech recognition:", error);
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

  // Checks if speech is enabled and not muted
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
        setCurrentAudio(null);
        // Immediately set isSpeaking to false instead of using setTimeout
        setIsSpeaking(false);
      };
      
      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
        setIsSpeaking(false);
      };
      
      // Set source and play
      audio.src = audioUrl;
      await audio.play().catch(error => {
        console.error("Failed to play audio:", error);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
        setIsSpeaking(false);
      });
      
    } catch (error) {
      console.error("Error in speech synthesis:", error);
      setIsSpeaking(false);
      setCurrentAudio(null);
    }
  };

  // Cleanup function when component unmounts
  useEffect(() => {
    return () => {
      stopCurrentAudio();
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
        onEnded={() => setIsSpeaking(false)}
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