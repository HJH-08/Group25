import React, { useState, useEffect } from 'react';
import { useModel } from '../hooks/useModel';
import '../styles/ModelSelector.css';
import maleAvatar from '../images/male-avatar.png';
import femaleAvatar from '../images/female-avatar.png';

const ModelSelector = ({ onClose }) => {
  const { modelConfig, loading, error, switchingModel, switchModel } = useModel();
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [useSpeech, setUseSpeech] = useState(true); 
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [selectedAvatarType, setSelectedAvatarType] = useState("male");

  // Update local state when model config is loaded
  useEffect(() => {
    if (modelConfig) {
      setSelectedMode(modelConfig.use_ollama ? 'offline' : 'online');
      setSelectedModel(modelConfig.current_model);
      setUseSpeech(modelConfig.use_speech_output);
      setSelectedAvatarType(modelConfig.avatar_type || "male");
    }
  }, [modelConfig]);

  const handleModeChange = (mode) => {
    setSelectedMode(mode);
    
    // Only try to set default model if modelConfig exists
    if (modelConfig) {
      // Set default model for the selected mode
      if (mode === 'offline' && modelConfig?.available_models?.offline?.length > 0) {
        // First value from the tuple
        setSelectedModel(modelConfig.available_models.offline[0][1]);
      } else if (mode === 'online' && modelConfig?.available_models?.online?.length > 0) {
        setSelectedModel(modelConfig.available_models.online[0][0]);
      }
    }
    
    // Clear any previous errors/success messages
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleModelChange = (event) => {
    setSelectedModel(event.target.value);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleSpeechToggle = () => {
    setUseSpeech(prev => !prev);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleAvatarChange = (type) => {
    if (isChanging || !modelConfig) return;
    
    setSelectedAvatarType(type);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleSubmit = async () => {
    if (!modelConfig) {
      setSubmitError("Cannot apply settings: Backend server not connected");
      return;
    }
    
    try {
      setSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);
      
      const result = await switchModel(
        selectedMode === 'offline', 
        selectedModel, 
        useSpeech, 
        selectedAvatarType
      );
      
      setSubmitSuccess(result.message || "Settings updated successfully!");
      
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset avatar selection to match the current modelConfig before closing
    if (modelConfig) {
      setSelectedAvatarType(modelConfig.avatar_type);
    }
    onClose();
  }

  const isChanging = submitting || switchingModel;
  
  // Safely calculate currentModelName to avoid null errors
  let currentModelName = "Not Connected";
  if (modelConfig && modelConfig.current_model) {
    if (modelConfig.use_ollama) {
      const selectedOfflineModel = modelConfig.available_models?.offline?.find(
        ([_, id]) => id === modelConfig.current_model
      );
      currentModelName = `Offline - ${selectedOfflineModel?.[2] || modelConfig.current_model}`;
    } else {
      currentModelName = `Online - ${modelConfig.current_model}`;
    }
  }


  return (
    <div className="model-selector">
      <div className="model-selector-content" onClick={(e) => e.stopPropagation()}>
        <div className="model-selector-header">
          <h2>Model Settings</h2>
          <button className="close-button" onClick={handleCancel} disabled={isChanging}>×</button>
        </div>
        
        <div className="model-selector-scrollable">
          {loading ? (
            <div className="model-selector-loading">
              <h3>Loading Model Settings...</h3>
              <div className="loading-spinner"></div>
            </div>
          ) : error || !modelConfig ? (
            <div className="model-selector-error">
              <h3>Connection Error</h3>
              <p className="error-message">{error || "Could not connect to backend server"}</p>
              <p>Make sure the backend server is running at http://localhost:8000</p>
            </div>
          ) : (
            <>
              <div className="current-model">
                <p>Currently using: <strong>{currentModelName}</strong></p>
                <p>Speech Output: <strong>{modelConfig?.use_speech_output ? 'Enabled' : 'Disabled'}</strong></p>
                <p>Avatar: <strong>{modelConfig?.avatar_type === 'female' ? 'Female' : 'Male'}</strong></p>
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
              
              {/* Speech Toggle Section */}
              <div className="model-selector-section">
                <h3>Speech Settings</h3>
                <div className="speech-toggle">
                  <div className={`toggle-switch ${useSpeech ? 'active' : ''}`} onClick={handleSpeechToggle}>
                    <div className="toggle-slider"></div>
                  </div>
                  <span>{useSpeech ? 'Speech Output Enabled' : 'Speech Output Disabled'}</span>
                </div>
                
                <div className="mode-description">
                  <p>
                    {useSpeech
                      ? "Speech output converts AI responses to audio. Disable to improve performance."
                      : "Speech output is disabled. The AI will respond with text only."}
                  </p>
                </div>
              </div>
              
              {/* Avatar Selection Section */}
              <div className="model-selector-section">
                <h3>Avatar Selection</h3>
                <div className="avatar-options">
                  <div 
                    className={`avatar-option ${selectedAvatarType === "male" ? "selected" : ""}`}
                    onClick={() => !isChanging && handleAvatarChange("male")}
                  >
                    <div className="avatar-preview">
                      <div 
                        className="avatar-image-placeholder" 
                        style={{ backgroundImage: `url(${maleAvatar})` }} 
                      />
                    </div>
                    <span>Male</span>
                  </div>
                  
                  <div 
                    className={`avatar-option ${selectedAvatarType === "female" ? "selected" : ""}`}
                    onClick={() => !isChanging && handleAvatarChange("female")}
                  >
                    <div className="avatar-preview">
                      <div 
                        className="avatar-image-placeholder" 
                        style={{ backgroundImage: `url(${femaleAvatar})` }} 
                      />
                    </div>
                    <span>Female</span>
                  </div>
                </div>
                
                <div className="mode-description">
                  <p>Choose which avatar represents your assistant.</p>
                </div>
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
            </>
          )}
        </div>
        
        <div className="model-selector-footer">
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
              disabled={isChanging || loading || !modelConfig}
            >
              {isChanging ? 'Applying...' : 'Apply Changes'}
            </button>
          </div>
          
          {isChanging && (
            <div className="switching-message">
              <div className="loading-spinner"></div>
              <p>Updating settings, please wait...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;