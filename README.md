# Companio - AI Desktop Assistant


## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
  - [Frontend](#-frontend)
  - [Backend](#-backend)
  - [Local AI](#-local-ai)
  - [Azure Services](#-azure-services)
  - [Tooling & Build](#-tooling--build)
  - [Development](#-development)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Steps](#steps)
- [Development](#development-1)
- [Production](#production)
- [Usage](#usage)
- [Commands](#commands)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [Getting Help](#getting-help)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Overview
Companio is an advanced AI desktop assistant. It provides voice recognition, intelligent conversation abilities, and dual-mode architecture with runtime switching supported. Companio is your AI companion in an AI-driven world.

## Features
- 🧠 **Intelligent Conversation**: Companio is capable of understanding context and maintaining conversations via a RAG-enabled conversation history database.
- 🔄 **Dual-Mode Architecture**: Runtime switching between offline and online models for flexible performance.
- 🔈 **Voice Interface**: Interact with Companio with real-time STT and TTS capabilities.
- 👤 **Interactive Avatars**: Choose between two animated avatars for a more personalised and engaging experience.
- 🎮 **Memory Minigames**: Sharpen your memory with two fun and interactive in-app games.
- ✨ **Smart UI**: A minimalist design with dynamic backgrounds for a personalised experience.

## Tech Stack
### 🖥️ Frontend
- [React](https://reactjs.org/) – UI library for building interactive interfaces
- [Electron](https://www.electronjs.org/) – Cross-platform desktop app framework
- [Three.js](https://threejs.org/) + [@react-three/fiber](https://github.com/pmndrs/react-three-fiber) – 3D rendering and avatars
- [Tailwind CSS](https://tailwindcss.com/) – CSS framework

### ⚙️ Backend
- [Python 3](https://www.python.org/) – Primary backend language
- [FastAPI](https://fastapi.tiangolo.com) – API server framework
- [Semantic Kernel](https://github.com/microsoft/semantic-kernel) - SDK for LLM integration and AI agent building

### 🤖 Local AI
- [Ollama](https://ollama.com) - Local LLM runtime enabling offline AI functionality
- [Qdrant](https://qdrant.tech/) – Offline vector database for long-term memory storage
- [Coqui TTS](https://github.com/coqui-ai/TTS) - Offline text-to-speech functionality

### ☁️ Azure Services
- [Azure OpenAI](https://azure.microsoft.com/en-gb/products/ai-services/openai-service) - Cloud-based access to advanced OpenAI models for AI functionality
- [Azure AI Search](https://azure.microsoft.com/en-us/products/ai-services/ai-search/) - Online vector database for long-term memory storage
- [Azure AI Speech](https://azure.microsoft.com/en-us/products/ai-services/ai-speech/) – Online speech-to-text & text-to-speech functionality

### 🛠️ Tooling & Build
- [PyInstaller](https://pyinstaller.org/en/stable/) – For compiling Python backend into an executable
- [Electron Builder](https://www.electron.build/) – Packaging & distribution

### 🧑‍💻 Development
- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

## Installation

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Python 3.8+
- pip
- Ollama with Phi3.5 and granite3.1-dense:2b installed

### Steps

### Installing dependencies

1. Clone the repository:
```
git clone https://github.com/HJH-08/Group25.git
```

2. Create a .env file in the templates directory to store API keys:
```
# --------------- Azure OpenAI Settings ---------------
AZURE_OPENAI_API_KEY="your_azure_openai_api_key"
AZURE_OPENAI_ENDPOINT = "your_azure_openai_endpoint"
AZURE_OPENAI_DEPLOYMENT_NAME = "gpt-4"

AZURE_AI_SEARCH_KEY="your_azure_ai_search_api_key"
AZURE_AI_SEARCH_ENDPOINT="your_azure_ai_search_endpoint"
AZURE_AI_SEARCH_INDEX="your_azure_ai_search_index"

AZURE_OPENAI_EMBEDDING_DEPLOYMENT="text-embedding-ada-002"
AZURE_OPENAI_EMBEDDING_API_KEY="your_azure_openai_embedding_api_key"
AZURE_OPENAI_EMBEDDING_ENDPOINT="your_azure_openai_embedding_endpoint"

# Azure Speech Service credentials
AZURE_SPEECH_KEY = "your_azure_speech_api_key"
AZURE_SPEECH_REGION = "your_azure_speech_region"
```

3. Install frontend dependencies:

```
cd frontend
npm install  # or yarn install
```

4. Install backend dependencies:
```
cd templates
pip install -r templates_requirements.txt
```

### Development
1. Start the backend server:
```
cd templates
python3 app.py
```
2. Start the frontend application:
```
cd frontend
npm build  # or yarn start
npm run electron # or yarn run electron
```

### Production
1. Compile the backend server
```
cd backend_build
python3 build_backend.py
```

2. Package electron application
```
cd frontend
npm run electron-build # or yarn run electron-build
```
Note: your application will be installed in /Applications

For custom install destination, run:
```
cd frontend
npm run electron-build -- --dir=your/custom/path/here # or use yarn
```


## Usage

- For development, electron app will launch upon running npm run electron
- For production, start application at the install destination
- Grant necessary permissions for microphone access when prompted.
- Use the chatbox to speak to Companio.
- Toggle between online and offline modes in settings to switch AI models
- Select your preferred avatar from the avatar selection screen
- Access memory games through the games menu
- Change backgrounds via the background selector


## Commands

### Use the navigation buttons in the UI to navigate to the model selection settings, background selector, chatbox, and games menu.


## Development

### Project Structure
```
companio/
├── frontend/         
│   ├── public/
│   ├── src/
│   ├── electron/
│   ├── package.json
│   └── build/
├── templates/         
│   ├── bin/
│   ├── models/
│   ├── app.py
│   └── templates_requirements.txt
├── backend_build/
│   └── build_backend.py
└── README.md
```

## Troubleshooting

### Common Issues
- **Microphone not working**: Ensure you've granted microphone permissions in your system settings
- **Offline mode not functioning**: Verify Ollama is running properly with the required models
- **Online mode not functioning**: Ensure you've set up your environment variables correctly
- **Audio not playing**: Check your system's audio output settings

### Getting Help
For further assistance, open an issue on the GitHub repository with:
- Your operating system
- Detailed error description

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements
- Thanks to all contributors who have helped shape Companio
- Built with support from UCL, Avanade, and IBM
- Avatar models adapted from CGTrader under royalty-free license: [Male Avatar](https://www.cgtrader.com/products/casual-man-rigged) and [Female Avatar](https://www.cgtrader.com/products/woman-brown-skirt) 


