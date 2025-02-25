import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AvatarProvider } from "./context/AvatarContext";
import WelcomePage from "./pages/WelcomePage";
import AvatarSelection from "./pages/AvatarSelection";
import InteractionMode from "./pages/InteractionMode";
import AIInteractionPage from "./pages/AIInteractionPage";

const App = () => {
    return (
        <AvatarProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<WelcomePage />} />
                    <Route path="/choose-avatar" element={<AvatarSelection />} />
                    <Route path="/interaction-mode" element={<InteractionMode />} />
                    <Route path="/ai-interaction" element={<AIInteractionPage />} />
                    <Route path="/interaction-page" element={<h1>Interaction Page</h1>} />
                    <Route path="/health-check" element={<h1>Health Check-In Page</h1>} />
                </Routes>
            </Router>
        </AvatarProvider>
    );
};

export default App;
