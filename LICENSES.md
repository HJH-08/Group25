# 📄 Licenses and Legal Information

This document outlines the licensing and privacy considerations for the Companio AI desktop assistant. It includes the tools and technologies used, their licenses, and the privacy practices applied in compliance with legal and ethical standards.

---

## 🔧 Component Licensing Overview

| Component Type        | Technology / Library                         | License                        | Notes                                                   |
|------------------------|----------------------------------------------|--------------------------------|----------------------------------------------------------|
| Frontend Framework     | React, Three.js, React-Three-Fiber          | MIT License                    | Used for UI and avatar rendering                        |
| State Management       | Zustand, React Context                      | MIT License                    | For managing local/global state                         |
| TTS/STT (Online)       | Azure Speech Services                       | Microsoft Commercial           | For voice input/output in online mode                   |
| TTS/STT (Offline)      | f5_tts, Vosk                                | MIT / Apache-2.0               | Offline voice interaction using local models            |
| Backend Framework      | FastAPI, Python                             | MIT / PSF License              | API and backend infrastructure                          |
| Orchestration          | Microsoft Semantic Kernel                   | MIT License                    | AI service routing and plugin integration               |
| LLMs (Online/Offline)  | Azure OpenAI (GPT), IBM Granite, Phi-3.5    | Microsoft / Proprietary        | Language models for chat response                       |

> **Note:** Third-party dependencies supporting the above components are listed in the next section for transparency and license attribution.

---

## 📚 Third-Party Dependency License Breakdown

| Dependency / Tool     | License                      | Usage Notes                                              |
|------------------------|------------------------------|-----------------------------------------------------------|
| PyTorch                | BSD-3-Clause                 | Required for speech synthesis and model inference        |
| FastEmbed              | Apache-2.0                   | Used for offline hybrid RAG embeddings                   |
| Qdrant                 | Apache-2.0                   | Vector database for local memory storage                 |
| Azure AI Search        | Microsoft Commercial         | Vector + keyword search in online mode                   |
| Pandas                 | BSD-3-Clause                 | Used in data handling/logging                            |
| Torchaudio             | BSD-3-Clause                 | Audio input/output streaming in offline STT              |
| Web Speech API         | Browser-native / MPL-2.0     | Fallback STT in offline browser mode                     |

---

## 🔐 Data Privacy and Protection

Companio was built with strong attention to data protection and legal compliance, particularly in contexts involving health-related data, accessibility, and multi-region cloud infrastructure.

- **No Persistent Storage of PII by Default**: While Companio does not intentionally collect personally identifiable information (PII), natural language input from users may occasionally contain such data.

- **Online Mode Data Processing**: When using online features (e.g., Azure OpenAI, Azure AI Search, Azure Speech Services), user inputs are processed through Microsoft Azure services, which may involve temporary transfers of data outside the UK/EU region depending on deployment.

- **Contractual Use with Avanade**: Use of Azure APIs is permitted under a valid enterprise developer contract with **Avanade**, authenticated via corporate credentials. This enables access to Microsoft’s responsible AI infrastructure and encryption compliance.

- **Speech & Health Conversations**: Some features (e.g., medication reminders, wellbeing check-ins) may involve user-initiated sharing of health-related inputs. No clinical diagnosis or treatment is inferred or stored.

- **Offline Privacy Option**: Users can switch to offline mode (local LLM + `f5_tts`) at any time. In this mode, all processing occurs locally and avoids cloud-based transmission entirely.

- **Data Retention**: Memory (used to recall past chats or reminders) is retained only during the session or until a user resets local data. No long-term storage is enforced by default.

- **Medical Disclaimer**:  
  _Companio is not a medical device and does not provide medical advice. It is intended for conversational companionship and general memory support only. Always consult a qualified healthcare professional for medical guidance._
