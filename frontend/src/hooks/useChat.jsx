import { createContext, useContext, useState } from "react";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const chat = async (userInput) => {
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userInput }),
      });
      
      const data = await response.json();
      
      if (data.response) {
        // Store the response as a simple string
        setMessage(data.response);
        setIsSpeaking(true);
        
        // Add to messages history
        setMessages(prev => [...prev, 
          { sender: 'user', text: userInput },
          { sender: 'ai', text: data.response }
        ]);
        
        return data.response;
      } else {
        const errorMsg = "Connection error. Please try again later.";
        setMessage(errorMsg);
        setIsSpeaking(true);
        return errorMsg;
      }
    } catch (error) {
      console.error("Chat API error:", error);
      const errorMsg = "Connection error. Please try again later.";
      setMessage(errorMsg);
      setIsSpeaking(true);
      return errorMsg;
    } finally {
      setLoading(false);
    }
  };

  const onMessagePlayed = () => {
    setMessage(null);
    setIsSpeaking(false);
  };

  return (
    <ChatContext.Provider
      value={{
        chat,
        message,
        isSpeaking,
        onMessagePlayed,
        loading,
        messages
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
