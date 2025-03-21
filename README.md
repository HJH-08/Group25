# Companio - AI Desktop Assistant

## Overview
Companio is your advanced AI assistant, built to connect with lifelike avatars. It provides voice recognition, intelligent conversation abilities, and engaging memory games to enhance your productivity and daily interactions with your computer.

## Features
- **Voice Recognition**: Interact with Companio using natural speech.
- **Intelligent Conversation**: Engage with an AI assistant capable of understanding context and maintaining conversations.
- **Flexibility**: Switch between cost-effective ofline models and the powerful online GPT model.
- **Memory-Building Games**: Try out the two different mini-games for building memory strength!

## Installation

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Python 3.8+
- pip
- Ollama with Phi3.5 and IBM Granite3.1-dense installed

### Steps
1. Clone the repository:
```
git clone https://github.com/HJH-08/Group25.git
```
2. Install frontend dependencies:
```
cd frontend
npm install  # or yarn install
```

3. Install backend dependencies:
```
pip install -r templates_requirements.txt
```
4. Start the backend server:
```
python templates/app.py
```
5. Start the frontend application:
```
npm start  # or yarn start
```

## Usage

- Launch the application at http://localhost:3000.
- Grant necessary permissions for microphone access when prompted.
- Use the chatbox to speak to your new assistant.
- Speak naturally to interact with the assistant.

## Commands

### Use the navigation buttons in the UI to navigate to the model selection settings, background selector, chatbox, and games menu.


## Development

### Project Structure
```
companio/
├── frontend/         
│   ├── public/
│   ├── src/
│   └── package.json
├── templates/         
│   ├── bin/
│   ├── models/
│   └── app.py
└── README.md
```