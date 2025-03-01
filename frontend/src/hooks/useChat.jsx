import { createContext, useContext, useState, useEffect } from "react";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  
  // Check connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionStatus("connecting");
        const response = await fetch('http://localhost:8000/api/config', {
          method: 'GET',
          signal: AbortSignal.timeout(5000) // Add timeout to prevent hanging
        });
        
        if (response.ok) {
          setConnectionStatus("connected");
          
          // Add system message about connection
          setMessages([{ 
            sender: 'system', 
            text: `Connected to chat service` 
          }]);
        } else {
          setConnectionStatus("error");
        }
      } catch (error) {
        console.error("Connection error:", error);
        setConnectionStatus("error");
      }
    };
    
    checkConnection();
  }, []);

  // Function to simply update the connection status (useful after model changes)
  const refreshConnection = async () => {
    try {
      setConnectionStatus("connecting");
      
      // Add a slight delay to allow the model to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch('http://localhost:8000/api/config', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        setConnectionStatus("connected");
        
        // Add system message about model change
        setMessages(prev => [...prev, { 
          sender: 'system', 
          text: `Reconnected to chat service` 
        }]);
        
        return true;
      } else {
        setConnectionStatus("error");
        return false;
      }
    } catch (error) {
      console.error("Connection error:", error);
      setConnectionStatus("error");
      return false;
    }
  };

  const chat = async (userInput) => {
    // Don't allow chat if not connected
    if (connectionStatus !== "connected") {
      const errorMsg = "Not connected to chat service. Please try again later.";
      setMessages(prev => [...prev, 
        { sender: 'user', text: userInput },
        { sender: 'system', text: errorMsg }
      ]);
      return errorMsg;
    }
    
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
        
        setMessages(prev => [...prev, 
          { sender: 'user', text: userInput },
          { sender: 'system', text: errorMsg }
        ]);
        
        return errorMsg;
      }
    } catch (error) {
      console.error("Chat API error:", error);
      const errorMsg = "Connection error. Please try again later.";
      setMessage(errorMsg);
      setIsSpeaking(true);
      
      setMessages(prev => [...prev, 
        { sender: 'user', text: userInput },
        { sender: 'system', text: errorMsg }
      ]);
      
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
        messages,
        connectionStatus,
        refreshConnection
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