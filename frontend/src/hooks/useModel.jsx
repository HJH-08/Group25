import { useState, useEffect, useCallback } from 'react';

export const useModel = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modelConfig, setModelConfig] = useState(null);
  const [switchingModel, setSwitchingModel] = useState(false);
  
  // Helper function to get friendly names for models
  const getFriendlyModelName = useCallback((modelId) => {
    switch(modelId) {
      case 'phi3.5:latest':
        return 'Phi 3.5';
      case 'granite3.1-dense:2b':
        return 'IBM Granite';
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
      
      setModelConfig({
        ...data,
        current_model_name: getFriendlyModelName(data.current_model)
      });
    } catch (err) {
      console.error("Error fetching model config:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getFriendlyModelName]);

  // Fetch initial model configuration
  // Add fetchModelConfig to the dependency array
  useEffect(() => {
    fetchModelConfig();
  }, [fetchModelConfig]); // Include fetchModelConfig in the dependency array
  
  // Function to switch models
  // Function to switch models
const switchModel = useCallback(async (useOllama, modelId) => {
    try {
      setSwitchingModel(true); // Here we use setSwitchingModel
      setError(null);
      
      console.log(`Switching to ${useOllama ? 'offline' : 'online'} model: ${modelId}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for model switching
      
      const response = await fetch('http://localhost:8000/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          use_ollama: useOllama,
          model_id: modelId
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const result = await response.json();
      
      if (response.ok) {
        console.log("Model switched:", result);
        
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
      console.error("Error switching model:", err);
      setError(err.message);
      throw err;
    } finally {
      setSwitchingModel(false); // Here we use setSwitchingModel again
    }
  }, [fetchModelConfig]); // Add fetchModelConfig as a dependency
  
  return {
    modelConfig,
    loading,
    error,
    switchingModel,
    fetchModelConfig,
    switchModel,
    getFriendlyModelName
  };
};