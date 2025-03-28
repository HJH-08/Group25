import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { ModelProvider } from "./hooks/useModel";
import { VoiceProvider } from "./hooks/useVoice"; 
import WelcomePage from "./pages/WelcomePage";
import ThreeDPage from "./pages/3DUI"; 
import MatchPairs from "./pages/MatchPairs";
import SimonGame from "./pages/SimonGame";

const App = () => {
    return (
<ModelProvider>
    <VoiceProvider>
        <Router>
            <Routes>
                <Route path="/" element={<WelcomePage />} />
                <Route path="/3DUI" element={<ThreeDPage />} />
                <Route path="/match-pairs" element={<MatchPairs />} />
                <Route path="/simon-game" element={<SimonGame />} />
            </Routes>
        </Router>
    </VoiceProvider>
</ModelProvider>
    );
};

export default App;