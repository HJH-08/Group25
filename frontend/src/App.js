import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AvatarProvider } from "./context/AvatarContext";
import { ModelProvider } from "./hooks/useModel";
import { VoiceProvider } from "./hooks/useVoice"; 
import WelcomePage from "./pages/WelcomePage";
import AvatarSelection from "./pages/AvatarSelection";
import InteractionMode from "./pages/InteractionMode";
import AIInteractionPage from "./pages/AIInteractionPage";
import HealthCheckPage from "./pages/HealthCheckPage";
import ThreeDPage from "./pages/3DUI"; 
import MatchPairs from "./pages/MatchPairs";
import SimonGame from "./pages/SimonGame";

const App = () => {
    return (
        <AvatarProvider>
            <ModelProvider>
                <VoiceProvider>
                    <Router>
                        <Routes>
                            <Route path="/" element={<WelcomePage />} />
                            <Route path="/choose-avatar" element={<AvatarSelection />} />
                            <Route path="/interaction-mode" element={<InteractionMode />} />
                            <Route path="/interaction-page" element={<InteractionMode />} />
                            <Route path="/ai-interaction" element={<AIInteractionPage />} />
                            <Route path="/health-check" element={<HealthCheckPage />} />
                            <Route path="/3d-avatar" element={<HealthCheckPage />} /> 
                            <Route path="/3DUI" element={<ThreeDPage />} />
                            <Route path="/match-pairs" element={<MatchPairs />} />
                            <Route path="/simon-game" element={<SimonGame />} />
                        </Routes>
                    </Router>
                </VoiceProvider>
            </ModelProvider>
        </AvatarProvider>
    );
};

export default App;