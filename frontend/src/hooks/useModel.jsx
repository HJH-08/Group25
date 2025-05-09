import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const ModelContext = createContext();

export const ModelProvider = ({ children }) => {
  // Use the hook to get all model functionality
  const modelState = useModelHook();
  
  return (
    <ModelContext.Provider value={modelState}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = () => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error("useModel must be used within a ModelProvider");
  }
  return context;
};

// Main hook function with all the logic
const useModelHook = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modelConfig, setModelConfig] = useState(null);
  const [switchingModel, setSwitchingModel] = useState(false);
  
  // Function for avatar selection
  const setConfigValue = useCallback((key, value) => {
    setModelConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: value
      };
    });
  }, []);
  
  // Helper function to get friendly names for models
  const getFriendlyModelName = useCallback((modelId) => {
    switch(modelId) {
      case 'phi3.5:latest':
        return 'Phi 3.5';
      case 'granite3.1-dense:2b':
        return 'IBM Granite';
      case 'gpt-4':
        return 'GPT-4';
      default:
        return modelId;
    }
  }, []);
  
  // Function to fetch current model configuration
  const fetchModelConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('http://localhost:8000/api/config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch configuration (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Loaded model config:", data);
      
      // Add friendly names to the model options
      if (data.available_models) {
        if (data.available_models.offline) {
          data.available_models.offline = data.available_models.offline.map(
            ([key, id]) => [key, id, getFriendlyModelName(id)]
          );
        }
        
        if (data.available_models.online) {
          data.available_models.online = data.available_models.online.map(
            id => [id, getFriendlyModelName(id)]
          );
        }
      }
      
      // Add avatar_type to the model config if it doesn't exist
      setModelConfig({
        ...data,
        current_model_name: getFriendlyModelName(data.current_model),
        use_speech_output: data.use_speech_output !== undefined ? data.use_speech_output : true,
        avatar_type: data.avatar_type || "male" // Default avatar is male
      });
    } catch (err) {
      console.error("Error fetching model config:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getFriendlyModelName]);

  // Fetch initial model configuration
  useEffect(() => {
    fetchModelConfig();
  }, [fetchModelConfig]);
  
  // Function to switch models
  const switchModel = useCallback(async (useOllama, modelId, useSpeech, avatarType = 'male') => {
    try {
      setSwitchingModel(true);
      setError(null);
      
      console.log(`Switching to ${useOllama ? 'offline' : 'online'} model: ${modelId}, speech: ${useSpeech ? 'on' : 'off'}, avatar: ${avatarType}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for model switching
      
      const response = await fetch('http://localhost:8000/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          use_ollama: useOllama,
          model_id: modelId,
          use_speech: useSpeech,
          avatar_type: avatarType 
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const result = await response.json();
      
      if (response.ok) {
        console.log("Model/settings switched:", result);
        
        // Check if there was a business logic error
        if (result.status === 'error') {
          throw new Error(result.message);
        }
        
        // Refresh the config after switching
        await fetchModelConfig();
        return result;
      } else {
        throw new Error(`Server error (${response.status}): ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Error switching model/settings:", err);
      setError(err.message);
      throw err;
    } finally {
      setSwitchingModel(false);
    }
  }, [fetchModelConfig]);
  
  // Return everything needed including the new setConfigValue
  return {
    modelConfig,
    loading,
    error,
    switchingModel,
    fetchModelConfig,
    switchModel,
    getFriendlyModelName,
    setConfigValue
  };
};