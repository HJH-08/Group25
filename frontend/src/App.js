import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AvatarProvider } from "./context/AvatarContext";
import WelcomePage from "./pages/WelcomePage";
import AvatarSelection from "./pages/AvatarSelection";
import InteractionMode from "./pages/InteractionMode";
import AIInteractionPage from "./pages/AIInteractionPage";
import HealthCheckPage from "./pages/HealthCheckPage";  // ✅ Ensure HealthCheckPage is imported

const App = () => {
    return (
        <AvatarProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<WelcomePage />} />
                    <Route path="/choose-avatar" element={<AvatarSelection />} />
                    <Route path="/interaction-mode" element={<InteractionMode />} />
                    <Route path="/interaction-page" element={<InteractionMode />} />  {/* ✅ FIXED */}
                    <Route path="/ai-interaction" element={<AIInteractionPage />} />
                    <Route path="/health-check" element={<HealthCheckPage />} />  {/* ✅ FIXED */}
                </Routes>
            </Router>
        </AvatarProvider>
    );
};

export default App;
