import React, { useState, useEffect } from 'react';
import { useModel } from '../hooks/useModel';
import '../styles/ModelSelector.css';

const ModelSelector = ({ onClose }) => {
  const { modelConfig, loading, error, switchingModel, switchModel } = useModel();
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Update local state when model config is loaded
  useEffect(() => {
    if (modelConfig) {
      setSelectedMode(modelConfig.use_ollama ? 'offline' : 'online');
      setSelectedModel(modelConfig.current_model);
    }
  }, [modelConfig]);

  const handleModeChange = (mode) => {
    setSelectedMode(mode);
    
    // Set default model for the selected mode
    if (mode === 'offline' && modelConfig?.available_models?.offline?.length > 0) {
      // First value from the tuple
      setSelectedModel(modelConfig.available_models.offline[0][1]);
    } else if (mode === 'online' && modelConfig?.available_models?.online?.length > 0) {
      setSelectedModel(modelConfig.available_models.online[0][0]);
    }
    
    // Clear any previous errors/success messages
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleModelChange = (event) => {
    setSelectedModel(event.target.value);
    // Clear any previous errors/success messages
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);
      
      const result = await switchModel(selectedMode === 'offline', selectedModel);
      
      // Show success message
      setSubmitSuccess(result.message || "Model switched successfully!");
      
      // Close after a delay to show the success message
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  }

  if (loading) {
    return (
      <div className="model-selector">
        <div className="model-selector-content">
          <h2>Loading Model Settings...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error && !modelConfig) {
    return (
      <div className="model-selector">
        <div className="model-selector-content">
          <h2>Connection Error</h2>
          <p className="error-message">{error}</p>
          <p>Make sure the backend server is running at http://localhost:8000</p>
          <button className="model-button primary" onClick={handleCancel}>Close</button>
        </div>
      </div>
    );
  }

  const isChanging = submitting || switchingModel;
  const currentModelName = modelConfig?.use_ollama ? 
    `${selectedMode === 'offline' ? 'Offline' : 'Online'} - ${
      modelConfig.available_models.offline.find(([_, id]) => id === modelConfig.current_model)?.[2] || modelConfig.current_model
    }` : 
    `${selectedMode === 'online' ? 'Online' : 'Offline'} - ${modelConfig.current_model}`;

  return (
    <div className="model-selector">
      <div className="model-selector-content" onClick={(e) => e.stopPropagation()}>
        <h2>Model Settings</h2>
        
        <div className="current-model">
          <p>Currently using: <strong>{currentModelName}</strong></p>
        </div>
        
        <div className="model-selector-section">
          <h3>Mode</h3>
          <div className="mode-toggle">
            <button
              className={`mode-button ${selectedMode === 'offline' ? 'active' : ''}`}
              onClick={() => handleModeChange('offline')}
              disabled={isChanging}
            >
              Offline
            </button>
            <button
              className={`mode-button ${selectedMode === 'online' ? 'active' : ''}`}
              onClick={() => handleModeChange('online')}
              disabled={isChanging}
            >
              Online
            </button>
          </div>
          
          <div className="mode-description">
            {selectedMode === 'offline' ? 
              <p>Offline mode uses local models through Ollama. No internet connection needed.</p> :
              <p>Online mode uses Azure OpenAI services. Requires internet connection.</p>
            }
          </div>
        </div>
        
        <div className="model-selector-section">
          <h3>Model</h3>
          {selectedMode === 'offline' && modelConfig?.available_models?.offline && (
            <select 
              value={selectedModel}
              onChange={handleModelChange}
              disabled={isChanging}
              className="model-dropdown"
            >
              {modelConfig.available_models.offline.map(([key, id, name]) => (
                <option key={key} value={id}>{name || id}</option>
              ))}
            </select>
          )}
          
          {selectedMode === 'online' && modelConfig?.available_models?.online && (
            <select 
              value={selectedModel}
              onChange={handleModelChange}
              disabled={isChanging || modelConfig.available_models.online.length <= 1}
              className="model-dropdown"
            >
              {modelConfig.available_models.online.map(([id, name]) => (
                <option key={id} value={id}>{name || id}</option>
              ))}
            </select>
          )}
        </div>
        
        {submitError && (
          <div className="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {submitError}
          </div>
        )}
        
        {submitSuccess && (
          <div className="success-message">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M0 0h24v24H0z" fill="none" />
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            {submitSuccess}
          </div>
        )}
        
        <div className="button-container">
          <button 
            className="model-button secondary" 
            onClick={handleCancel}
            disabled={isChanging}
          >
            Cancel
          </button>
          <button 
            className="model-button primary" 
            onClick={handleSubmit}
            disabled={isChanging}
          >
            {isChanging ? 'Switching...' : 'Apply Changes'}
          </button>
        </div>
        
        {isChanging && (
          <div className="switching-message">
            <div className="loading-spinner"></div>
            <p>Switching models, please wait...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelSelector;