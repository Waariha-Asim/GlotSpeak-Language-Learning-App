# GlotSpeak-Language-Learning-App

GlotSpeak is an AI-powered language learning application designed to help users improve their grammar, vocabulary, and conversational skills through interactive exercises and AI chat. The project includes structured lessons, vocab modules, pronunciation practice, and a full front-end & back-end setup.

---

## Features

GlotSpeak offers a wide range of features for effective language learning:

### User Authentication
- **Sign-Up, Login, and Forgot Password** functionality.
- Password reset sent securely via registered email.

### Settings
- Enable **Dark Mode**.  
- Edit personal information.  
- Select language level: **Beginner**, **Intermediate**, or **Advanced**.

### Grammar Module
- 300+ multiple-choice questions (MCQs) for grammar practice.  
- Instant feedback and explanations for selected answers.

### Vocabulary Module
- Words categorized by level with meanings.  
- Practice and explore vocabulary efficiently.

### Speak Module
- 1000 words categorized as **easy**, **medium**, or **hard**.  
- Evaluates pronunciation accuracy with feedback and percentage score.  
- Users can listen to correct pronunciations and practice until mastery.

### Lesson Library
- 1000+ lessons covering real-life scenarios and sub-scenarios.  
- Includes practice exercises for contextual learning.

### AI Chat
- JumpSpeak-style AI chat with multiple scenarios and three difficulty levels.  
- Interact via **voice input** (Speak Now) or typing.  
- AI provides feedback by appreciating responses, highlighting mistakes, and suggesting ideal replies.  
- Supports **US/UK male and female voices**.

---
## Live Demo
Check out the app online: [https://glotspeak.com](https://glotspeak.com)

## Tech Stack
- Front-end: TypeScript 
- Back-end: MongoDB 
- AI/API: Gemini LLM 
- TTS & Speech Recognition APIs

---
## Project Structure

GlotSpeak-Language-Learning-App/
├── frontend/ # Front-end React/Vite application
│ ├── src/ # Source code (components, hooks, utils, data)
│ ├── public/ # Static assets
│ ├── package.json
│ └── ...other config files
├── backend/ # Node.js + MongoDB backend
│ ├── server.js
│ ├── package.json
│ └── ...other backend files
├── .gitignore
├── README.md
└── env.example # Example environment variables

---
## Environment Setup

The actual `.env` file is **not included** in the repository for security reasons. An `env.example` is provided for reference.

## Prerequisites

- Node.js (v18+ recommended)  
- pnpm / npm / yarn  
- Python 3.x (for virtual environment if required)  
- MongoDB URI for database connection  

---

## Installation

1. **Clone the repository**

git clone https://github.com/Waariha-Asim/GlotSpeak-Language-Learning-App.git
cd GlotSpeak-Language-Learning-App

2. **Install dependencies for Frontend**

cd frontend
npm install


3. **Install dependencies for Backend**

cd ../backend
npm install


4. **Set up environment variables**

- Copy `env.example` to `.env` and fill in your credentials:


cp env.example .env
Then edit .env
- Add your Gmail credentials and MongoDB URI.

5. **Run the development server**

1) Frontend:

cd frontend
npm run dev


2) Backend:

cd backend
npm start


6. **Access the app**

- Run the frontend and backend servers as explained above.  
- Open your browser and navigate to the local development URL provided by your frontend server.

---


## Contributing

- Use your own API keys and credentials for testing or deployment.  
- Follow proper Git practices and maintain project structure.

---

## License

This project is open-source and free for educational and personal use. Contact the owner before using it commercially.
