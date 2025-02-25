import React, { createContext, useState, useContext } from "react";

// Create Context
const AvatarContext = createContext();

// Custom hook for using AvatarContext
export const useAvatar = () => useContext(AvatarContext);

// Provider component
export const AvatarProvider = ({ children }) => {
    const [avatar, setAvatar] = useState(null);
    const [mode, setMode] = useState("interaction");

    return (
        <AvatarContext.Provider value={{ avatar, setAvatar, mode, setMode }}>
            {children}
        </AvatarContext.Provider>
    );
};
