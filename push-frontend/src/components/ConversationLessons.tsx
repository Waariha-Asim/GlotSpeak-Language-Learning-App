import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, RotateCcw, RefreshCcw, Trash, MessageCircle, User, Bot, Send, Loader, Globe, Mic, Volume2, Edit3 } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useTheme } from '../ThemeContext';

// Initialize Gemini safely
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const MODEL_ROTATION = ["gemma-3-4b-it", "gemma-3-1b-it"];
let modelCursor = 0;

const getNextModel = () => {
  if (!MODEL_ROTATION.length) {
    return "gemma-3-4b-it";
  }
  const chosen = MODEL_ROTATION[modelCursor];
  modelCursor = (modelCursor + 1) % MODEL_ROTATION.length;
  return chosen;
};

// 1. Updated Categories (Travel Added)
const categories = [
  { id: 'social', title: 'Social', description: 'Everyday casual interactions' },
  { id: 'work', title: 'Work', description: 'Professional and business scenarios' },
  { id: 'travel', title: 'Travel', description: 'Navigating the world and transport' },
  { id: 'food', title: 'Food and Drinks', description: 'Dining out and ordering meals' },
  { id: 'friends', title: 'Friends', description: 'Casual chats with your circle' },
  { id: 'family', title: 'Family', description: 'Home and relative interactions' },
  { id: 'health', title: 'Health', description: 'Medical and wellness conversations' },
  { id: 'shopping', title: 'Shopping', description: 'Master retail talk and the art of bargaining' },
];

// 2. Comprehensive Sub-Topics (5-6 for each category)
const subTopics = [
  // --- SOCIAL ---
  { id: 1, category: 'social', title: 'Meeting a Neighbor', level: 'Beginner', duration: '5-7 min', description: 'Introduce yourself to someone living nearby' },
  { id: 2, category: 'social', title: 'The Busy Elevator', level: 'Intermediate', duration: '3-5 min', description: 'Practice quick, witty small talk with a stranger or colleague during a short elevator ride' },
  { id: 3, category: 'social', title: 'Small Talk at a Party', level: 'Intermediate', duration: '8-10 min', description: 'Mingle with strangers at a social event' },
  { id: 4, category: 'social', title: 'Returning an Item', level: 'Intermediate', duration: '6-8 min', description: 'Talk to a shop assistant about a return' },
  { id: 5, category: 'social', title: 'Weather Discussion', level: 'Beginner', duration: '3-5 min', description: 'The classic ice-breaker conversation' },
  { id: 6, category: 'social', title: 'Local Event Inquiry', level: 'Intermediate', duration: '7-9 min', description: 'Ask about upcoming festivals or markets' },

  // --- WORK ---
  { id: 7, category: 'work', title: 'Job Interview', level: 'Advanced', duration: '12-15 min', description: 'Practice answering tough behavioral and technical questions for a professional role' },
  { id: 8, category: 'work', title: 'Salary Negotiation', level: 'Advanced', duration: '10-12 min', description: 'Learn how to discuss compensation, benefits, and raises with HR or your manager' },
  { id: 9, category: 'work', title: 'Meeting', level: 'Intermediate', duration: '8-10 min', description: 'Participate in professional discussions and give clear updates on your project progress' },
  { id: 10, category: 'work', title: 'Job Search', level: 'Beginner', duration: '7-9 min', description: 'Explore how to find job openings, understand job descriptions, and talk about career goals' },
  { id: 11, category: 'work', title: 'Presentations', level: 'Advanced', duration: '15-20 min', description: 'Pitch new ideas or project results to a team or potential clients with confidence' },
  { id: 12, category: 'work', title: 'Sharing Appreciation', level: 'Beginner', duration: '4-5 min', description: 'Practice giving positive feedback and thanking colleagues for their hard work and support' },

  // --- TRAVEL (UPDATED DESCRIPTIONS - SINGLE LINE FORMAT) ---
  { id: 13, category: 'travel', title: 'Asking for directions', level: 'Beginner', duration: '6-8 min', description: 'Ask for help finding your way to landmarks, streets, or nearby stations' },
  { id: 14, category: 'travel', title: 'Negotiating', level: 'Intermediate', duration: '7-9 min', description: 'Practice bargaining for better prices at local markets or with taxi drivers' },
  { id: 15, category: 'travel', title: 'Lost Passport Help', level: 'Advanced', duration: '10-12 min', description: 'Explain your situation to the embassy or police to get emergency travel documents' },
  { id: 16, category: 'travel', title: 'Renting a Car', level: 'Intermediate', duration: '8-10 min', description: 'Discuss rental agreements, insurance, and car features at the rental desk' },
  { id: 17, category: 'travel', title: 'Buying Train Tickets', level: 'Beginner', duration: '4-6 min', description: 'Book your journey, ask about ticket types, and locate the correct platform' },
  { id: 18, category: 'travel', title: 'Sightseeing Tour', level: 'Beginner', duration: '7-9 min', description: 'Talk to a guide and ask interesting questions about historical monuments' },

  // --- FOOD AND DRINKS ---
  { id: 19, category: 'food', title: 'Coffee Shop Order', level: 'Beginner', duration: '3-5 min', description: 'Order your favorite brew and a pastry' },
  { id: 20, category: 'food', title: 'Restaurant Ordering', level: 'Beginner', duration: '5-6 min', description: 'Practice ordering your favorite dishes and drinks from a restaurant menu' },
  { id: 21, category: 'food', title: 'Complaining about Food', level: 'Intermediate', duration: '7-9 min', description: 'Politely tell the waiter your order is wrong' },
  { id: 22, category: 'food', title: 'Fine Dining Etiquette', level: 'Advanced', duration: '10-12 min', description: 'Discuss wine pairings and gourmet dishes' },
  { id: 23, category: 'food', title: 'Making Reservations', level: 'Beginner', duration: '4-6 min', description: 'Call a restaurant to book a table for a specific time and number of guests' },
  { id: 24, category: 'food', title: 'Payment', level: 'Intermediate', duration: '5-7 min', description: 'Handle the bill, ask about payment methods, and discuss splitting the cost' },

  // --- FRIENDS---
  { id: 25, category: 'friends', title: 'Gossiping', level: 'Intermediate', duration: '10-12 min', description: 'Chat about recent events, social rumors, and what is happening in your circle' },
  { id: 26, category: 'friends', title: 'Discussing a Movie', level: 'Beginner', duration: '6-8 min', description: 'Share your reviews, favorite scenes, and thoughts on the latest cinema releases' },
  { id: 27, category: 'friends', title: 'Advice & Support', level: 'Intermediate', duration: '8-10 min', description: 'Offer a listening ear and suggest solutions to help a friend through a personal problem' },
  { id: 28, category: 'friends', title: 'Catching Up', level: 'Beginner', duration: '7-9 min', description: 'Meet an old friend to talk about your recent life updates and what you have been up to' },
  { id: 29, category: 'friends', title: 'Sharing Stories', level: 'Beginner', duration: '5-7 min', description: 'Tell interesting personal stories or funny anecdotes from your past experiences' },
  { id: 30, category: 'friends', title: 'Borrowing Something', level: 'Beginner', duration: '4-6 min', description: 'Politely ask a friend to lend you an item like a book, tool, or some household supplies' },

  // --- FAMILY ---
  { id: 31, category: 'family', title: 'Family Dynamics', level: 'Intermediate', duration: '8-10 min', description: 'Discuss the roles, relationships, and daily routines within your household' },
  { id: 32, category: 'family', title: 'Family Arguments', level: 'Intermediate', duration: '6-8 min', description: 'Practice resolving a conflict or disagreement over household chores and responsibilities' },
  { id: 33, category: 'family', title: 'Asking for Permission', level: 'Beginner', duration: '5-7 min', description: 'Talk to your parents about staying out late or attending a special event' },
  { id: 34, category: 'family', title: 'Visiting Relatives', level: 'Beginner', duration: '7-9 min', description: 'Make polite conversation and catch up with extended family members or elders' },
  { id: 35, category: 'family', title: 'Planning a Reunion', level: 'Advanced', duration: '12-15 min', description: 'Coordinate logistics, guest lists, and activities for a large family gathering' },
  { id: 36, category: 'family', title: 'Childhood Development', level: 'Advanced', duration: '8-10 min', description: 'Discuss upbringing, milestones, and how children grow and learn within the family' },

  // --- HEALTH ---
  { id: 37, category: 'health', title: 'Doctor Appointment', level: 'Intermediate', duration: '10-12 min', description: 'Explain your symptoms, medical history, and concerns to a general practitioner' },
  { id: 38, category: 'health', title: 'At the Pharmacy', level: 'Beginner', duration: '5-7 min', description: 'Ask for specific medications, understand the dosage, and inquire about side effects' },
  { id: 39, category: 'health', title: 'Mental Therapy', level: 'Advanced', duration: '12-15 min', description: 'Engage in a deep conversation with a counselor about emotional well-being and stress management' },
  { id: 40, category: 'health', title: 'Fitness', level: 'Beginner', duration: '6-8 min', description: 'Talk about gym routines, exercise types, and setting personal physical health goals' },
  { id: 41, category: 'health', title: 'Meditation', level: 'Beginner', duration: '8-10 min', description: 'Discuss mindfulness techniques, breathing exercises, and ways to improve focus and calm' },
  { id: 42, category: 'health', title: 'Nutrition', level: 'Intermediate', duration: '10-12 min', description: 'Consult about balanced diets, healthy eating habits, and the nutritional value of different foods' },

  // --- SHOPPING ---
  // --- SHOPPING (FIXED CATEGORY MATCHING) ---
  { id: 43, category: 'shopping', title: 'Negotiating', level: 'Advanced', duration: '8-10 min', description: 'Practice the art of haggling at a local market to get the best price' },
  { id: 44, category: 'shopping', title: 'Size Fitting', level: 'Beginner', duration: '5-7 min', description: 'Interact with a sales assistant to find the right fit and ask for a different size' },
  { id: 45, category: 'shopping', title: 'Returns and Exchanges', level: 'Intermediate', duration: '6-8 min', description: 'Explain a defect in a product and negotiate for a full refund or exchange' },
  { id: 46, category: 'shopping', title: 'Groceries', level: 'Beginner', duration: '4-6 min', description: 'Ask the store clerk for fresh recommendations and find specific items' },
  { id: 47, category: 'shopping', title: 'Home Decor', level: 'Intermediate', duration: '7-9 min', description: 'Consult with an interior stylist about color themes and furniture styles' },
  { id: 48, category: 'shopping', title: 'Clothes', level: 'Beginner', duration: '6-8 min', description: 'Describe your personal style to a shop assistant and ask for recommendations' },];

// Enhanced Scenario Contexts with Specific Roles
const getScenarioContext = (topicId: number, dialect: 'uk' | 'us', level: string) => {
  const topic = subTopics.find(t => t.id === topicId);
  if (!topic) return { context: '', initialMessage: '', role: '' };

  const isUK = dialect === 'uk';
  const isBeginner = level === 'Beginner';
  const isAdvanced = level === 'Advanced';
  const scenarios: Record<number, { role: string; context: string; initialMessage: string }> = {
    // SOCIAL
    1: { // Meeting a Neighbor
      role: isUK ? 'a friendly British neighbour' : 'a friendly American neighbor',
      context: isUK ? "You just moved into a new flat. Be warm and curious about your new neighbour." : "You just moved into a new apartment. Be warm and curious about your new neighbor.",
      initialMessage: isUK ? "Oh hello! Are you new to the building?" : "Hey there! You just move in?"
    },
    2: { // The Busy Elevator
      role: isUK ? 'a colleague in a lift' : 'a coworker in an elevator',
      context: "You're in a brief elevator ride. Make quick, casual small talk.",
      initialMessage: isUK ? "Going up? Busy day, isn't it?" : "Heading up? Crazy day, huh?"
    },
    3: { // Small Talk at a Party
      role: 'a friendly party guest',
      context: "You're at a social gathering. Be casual and ask about their interests.",
      initialMessage: isUK ? "Hi there! How do you know the host?" : "Hey! So how do you know everyone here?"
    },
    4: { // Returning an Item
      role: 'a shop assistant',
      context: "You work at a retail store. Help the customer with their return politely.",
      initialMessage: isUK ? "Hello! How can I help you today?" : "Hi! What can I do for you?"
    },
    5: { // Weather Discussion
      role: 'a casual acquaintance',
      context: "You're making small talk about the weather. Keep it light and brief.",
      initialMessage: isUK ? "Lovely weather we're having, isn't it?" : "Nice weather today, right?"
    },
    6: { // Local Event Inquiry
      role: 'a local resident',
      context: "You know about local events. Share information enthusiastically but briefly.",
      initialMessage: isUK ? "Are you looking for something to do this weekend?" : "Looking for something fun to do?"
    },
    // WORK
    7: { // Job Interview
      role: isAdvanced ? 'a Senior V.P. of Engineering' : isBeginner ? 'a friendly HR Assistant' : 'a Department Manager',
      context: isAdvanced ? "You're a high-level executive. Be direct and start the interview 'in media res' with a technical challenge." : isBeginner ? "You're a welcoming assistant. Ask simple ice-breaker questions for a junior role." : "You're a manager. Conduct a standard professional interview.",
      initialMessage: isAdvanced ? "Looking at your architecture designs—not exactly industry standard. Why'd you pick React over Solid in that project?" : isBeginner ? "Hello! Thanks for coming. Are you ready for your first interview?" : "Thanks for coming in today. Tell me about yourself."
    },
    8: { // Salary Negotiation
      role: 'an HR manager',
      context: "You're discussing compensation. Be professional and open to discussion.",
      initialMessage: "So, let's talk about your salary expectations."
    },
    9: { // Meeting
      role: isAdvanced ? 'a Lead Project Architect' : isBeginner ? 'a friendly teammate' : 'a Project Manager',
      context: isAdvanced ? "A high-stakes project review. Start by asking for specific metrics or documents immediately." : isBeginner ? "A casual team check-in. Ask about very simple updates." : "A standard project meeting. Ask about progress.",
      initialMessage: isAdvanced ? "I just checked the latest commit—the build is failing. Walk me through your email first?" : isBeginner ? "Hi! Let's talk about our project reports today. What do you have?" : "Good morning! How's the project coming along?"
    },
    10: { // Job Search
      role: 'a career counselor',
      context: "You're helping someone with their job search. Offer brief, helpful advice.",
      initialMessage: "What kind of role are you looking for?"
    },
    11: { // Presentations
      role: 'an audience member',
      context: "You're listening to a presentation. Ask relevant questions.",
      initialMessage: "Interesting topic! What's the main goal here?"
    },
    12: { // Sharing Appreciation
      role: 'a colleague',
      context: "You're receiving thanks from a coworker. Respond warmly and briefly.",
      initialMessage: "Hey, I just wanted to say thanks for your help!"
    },
    // TRAVEL
    13: { // Asking for Directions
      role: 'a helpful local',
      context: "Someone is lost. Give clear, simple directions.",
      initialMessage: isUK ? "You look a bit lost. Can I help?" : "You need help finding something?"
    },
    14: { // Negotiating
      role: 'a market vendor',
      context: "You're selling goods at a market. Be friendly but firm on prices.",
      initialMessage: "Looking for something special today?"
    },
    15: { // Lost Passport Help
      role: 'an embassy official',
      context: "You're helping someone who lost their passport. Be professional and calm.",
      initialMessage: "I understand you've lost your passport. When did this happen?"
    },
    16: { // Renting a Car
      role: 'a car rental agent',
      context: "You're helping someone rent a car. Explain options briefly.",
      initialMessage: "Hi! What kind of vehicle are you looking for?"
    },
    17: { // Buying Train Tickets
      role: 'a ticket agent',
      context: "You're selling train tickets. Help them find the right option quickly.",
      initialMessage: isUK ? "Where are you headed today?" : "Where you going?"
    },
    18: { // Sightseeing Tour
      role: 'a tour guide',
      context: "You're leading a tour. Share interesting facts enthusiastically but briefly.",
      initialMessage: "Welcome! Ready to explore some amazing sights?"
    },
    // FOOD AND DRINKS
    19: { // Coffee Shop Order
      role: 'a barista',
      context: "You're taking a coffee order. Be friendly and efficient.",
      initialMessage: isUK ? "Hi! What can I get you?" : "Hey! What can I make for you?"
    },
    20: { // Restaurant Ordering
      role: 'a waiter',
      context: "You're serving at a restaurant. Take orders and make suggestions briefly.",
      initialMessage: "Good evening! Are you ready to order?"
    },
    21: { // Complaining about Food
      role: 'a waiter',
      context: "A customer has a complaint. Listen and offer to fix it politely.",
      initialMessage: "Is everything okay with your meal?"
    },
    22: { // Fine Dining Etiquette
      role: 'a sommelier',
      context: "You're at a fine dining restaurant. Suggest wine pairings elegantly but briefly.",
      initialMessage: "May I suggest a wine pairing for your meal?"
    },
    23: { // Making Reservations
      role: 'a restaurant host',
      context: "You're taking a reservation. Ask for necessary details efficiently.",
      initialMessage: isUK ? "Hello! Would you like to book a table?" : "Hi! Looking to make a reservation?"
    },
    24: { // Payment
      role: 'a waiter',
      context: "You're handling the bill. Be polite and clear about payment options.",
      initialMessage: "Here's your bill. How would you like to pay?"
    },
    // FRIENDS
    25: { // Gossiping
      role: 'a close friend',
      context: "You're chatting with a friend about recent events. Be casual and curious.",
      initialMessage: "OMG, did you hear about what happened?"
    },
    26: { // Discussing a Movie
      role: 'a friend',
      context: "You just watched a movie together. Share your thoughts casually.",
      initialMessage: "So, what did you think of the movie?"
    },
    27: { // Advice & Support
      role: 'a supportive friend',
      context: "Your friend needs advice. Listen and offer brief, caring suggestions.",
      initialMessage: "Hey, you seem down. What's going on?"
    },
    28: { // Catching Up
      role: 'an old friend',
      context: "You haven't seen each other in a while. Be warm and curious about their life.",
      initialMessage: "Hey! It's been forever! How have you been?"
    },
    29: { // Sharing Stories
      role: 'a friend',
      context: "You're hanging out and sharing stories. Be engaging and ask follow-up questions.",
      initialMessage: "You won't believe what happened to me yesterday!"
    },
    30: { // Borrowing Something
      role: 'a friend',
      context: "Your friend wants to borrow something. Respond naturally and helpfully.",
      initialMessage: "Hey, can I ask you a favor?"
    },
    // FAMILY
    31: { // Family Dynamics
      role: 'a family member',
      context: "You're discussing family life. Be warm and understanding.",
      initialMessage: "How's everyone at home doing?"
    },
    32: { // Family Arguments
      role: 'a family member',
      context: "There's a disagreement about chores. Express your view calmly.",
      initialMessage: "We need to talk about the household chores."
    },
    33: { // Asking for Permission
      role: 'a parent',
      context: "Your child wants permission for something. Ask questions before deciding.",
      initialMessage: "What did you want to ask me about?"
    },
    34: { // Visiting Relatives
      role: 'a relative',
      context: "You're visiting family. Be warm and make polite conversation.",
      initialMessage: "So good to see you! How have you been?"
    },
    35: { // Planning a Reunion
      role: 'a family member',
      context: "You're organizing a family gathering. Discuss plans briefly.",
      initialMessage: "Should we start planning the family reunion?"
    },
    36: { // Childhood Development
      role: 'a parent',
      context: "You're discussing child development. Share thoughts and ask questions.",
      initialMessage: "How's your little one doing with school?"
    },
    // HEALTH
    37: { // Doctor Appointment
      role: 'a doctor',
      context: "You're examining a patient. Ask about symptoms professionally but warmly.",
      initialMessage: "Hello! What brings you in today?"
    },
    38: { // At the Pharmacy
      role: 'a pharmacist',
      context: "You're helping someone get medication. Explain dosage clearly and briefly.",
      initialMessage: "Hi! Do you have a prescription?"
    },
    39: { // Mental Therapy
      role: 'a therapist',
      context: "You're in a therapy session. Listen empathetically and ask gentle questions.",
      initialMessage: "How have you been feeling this week?"
    },
    40: { // Fitness
      role: 'a personal trainer',
      context: "You're discussing fitness goals. Be encouraging and practical.",
      initialMessage: "What are your fitness goals?"
    },
    41: { // Meditation
      role: 'a meditation instructor',
      context: "You're teaching meditation. Speak calmly and give simple guidance.",
      initialMessage: "Have you tried meditation before?"
    },
    42: { // Nutrition
      role: 'a nutritionist',
      context: "You're giving diet advice. Be helpful and specific but brief.",
      initialMessage: "Tell me about your current eating habits."
    },
    // SHOPPING
    43: { // Negotiating
      role: 'a market seller',
      context: "You're selling at a market. Be friendly but defend your prices.",
      initialMessage: "Interested in this? It's great quality!"
    },
    44: { // Size Fitting
      role: 'a sales assistant',
      context: "You're helping someone find the right size. Be helpful and quick.",
      initialMessage: "How does that fit? Need a different size?"
    },
    45: { // Returns and Exchanges
      role: 'a customer service rep',
      context: "You're handling a return. Be understanding and professional.",
      initialMessage: "What seems to be the problem with the item?"
    },
    46: { // Groceries
      role: 'a store clerk',
      context: "You're helping someone find groceries. Be helpful and friendly.",
      initialMessage: "Looking for something specific?"
    },
    47: { // Home Decor
      role: 'an interior designer',
      context: "You're advising on home decor. Share ideas enthusiastically but briefly.",
      initialMessage: "What style are you going for?"
    },
    48: { // Clothes
      role: 'a fashion consultant',
      context: "You're helping someone pick clothes. Give style advice briefly.",
      initialMessage: "What's your style? Casual or formal?"
    }
  };

  return scenarios[topicId] || {
    role: 'a conversation partner',
    context: topic.description,
    initialMessage: isUK ? "Hello! Ready to chat?" : "Hey! Let's talk!"
  };
};

interface UserMessage {
  role: 'user';
  text: string;
  timestamp: Date;
  correction?: {
    ideal: string;
    feedback: string;
  };
}

interface AiMessage {
  role: 'ai';
  reply: string;
  hint: string;
  translation: string;
  timestamp: Date;
}

type ChatMessage = UserMessage | AiMessage;

type Dialect = 'uk' | 'us';
type Level = 'Beginner' | 'Intermediate' | 'Advanced';
type Gender = 'Male' | 'Female';

interface Setup {
  dialect: Dialect;
  level: Level;
  gender: Gender;
}

// Guidance snippets help the AI lean into level-specific openings
const levelToneGuidance: Record<Level, string> = {
  Beginner: "Keep sentences very simple. Reference obvious tasks or needs so the learner can reply easily.",
  Intermediate: "Assume the learner can discuss work in short detail. Nudge them to explain next steps or share short updates.",
  Advanced: "Dive straight into urgent or nuanced issues. Reference specific artefacts or follow ups the learner should know about."
};

const scenarioLevelGuidance: Record<number, Partial<Record<Level, string>>> = {
  7: {
    Beginner: "Start with a warm greeting and a basic interview question about themselves.",
    Intermediate: "Ask the candidate to summarise a recent project or challenge.",
    Advanced: "Challenge the candidate on a technical decision they made last quarter."
  },
  9: {
    Beginner: "Invite them to focus on simple project reports first, like status or blockers.",
    Intermediate: "Prompt for a concise progress update on active tasks.",
    Advanced: "Ask them to check email or metrics that just surfaced, keeping the urgency high."
  },
  19: {
    Beginner: "Offer a friendly greeting and ask for a straightforward order.",
    Intermediate: "Suggest a drink based on yesterday's order or their usual preference.",
    Advanced: "Reference a custom order detail and confirm timing or temperature."
  }
};

const buildLevelDirective = (topicId: number | null, level: Level): string => {
  const base = levelToneGuidance[level];
  const specific = topicId ? scenarioLevelGuidance[topicId]?.[level] : undefined;
  return [base, specific].filter(Boolean).join(' ');
};

export const ConversationLessons: React.FC = () => {
  const { darkMode } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubTopic, setSelectedSubTopic] = useState<number | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [tempDialect, setTempDialect] = useState<Dialect>('us');
  const [tempLevel, setTempLevel] = useState<Level>('Intermediate');
  const [tempGender, setTempGender] = useState<Gender>('Male');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [bridgeMode, setBridgeMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const setupRef = useRef<Setup | null>(null);

  const speak = (text: string, index: number) => {
    if (!setup) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Get all available voices
    const voices = window.speechSynthesis.getVoices();

    // Log all available voices for debugging
    console.log('All voices:', voices.map(v => `${v.name} (${v.lang})`));

    const langCode = setup.dialect === 'uk' ? 'en-GB' : 'en-US';

    // **FORCE MALE VOICE LOGIC** - Explicitly find male voices by name
    let targetVoice = null;

    if (setup.gender === 'Male') {
      // Try to find explicit male voices first
      const maleKeywords = ['male', 'man', 'david', 'mark', 'george', 'daniel', 'richard',
        'simon', 'paul', 'michael', 'john', 'thomas', 'steven', 'eric',
        'alex', 'peter', 'robert', 'william', 'james', 'charles'];

      if (setup.dialect === 'uk') {
        // UK Male voices search
        targetVoice = voices.find(v => {
          const name = v.name.toLowerCase();
          const isUK = v.lang.includes('en-GB') || v.lang.includes('en_GB') ||
            name.includes('british') || name.includes('uk') ||
            name.includes('united kingdom') || name.includes('english (uk)');

          // Check if voice name contains male keywords
          const isMale = maleKeywords.some(keyword => name.includes(keyword));

          // Also exclude female voices explicitly
          const notFemale = !name.includes('female') && !name.includes('woman') &&
            !name.includes('girl') && !name.includes('lady') &&
            !name.includes('hazel') && !name.includes('susan') &&
            !name.includes('karen') && !name.includes('serena') &&
            !name.includes('alice') && !name.includes('emma') &&
            !name.includes('olivia') && !name.includes('sophia') &&
            !name.includes('zira') && !name.includes('samantha') &&
            !name.includes('victoria') && !name.includes('allison');

          return isUK && (isMale || notFemale);
        });

        // If no voice found with male keywords, try any UK voice that's not explicitly female
        if (!targetVoice) {
          targetVoice = voices.find(v => {
            const name = v.name.toLowerCase();
            const isUK = v.lang.includes('en-GB') || v.lang.includes('en_GB');
            const notFemale = !name.includes('female') && !name.includes('hazel') &&
              !name.includes('susan') && !name.includes('zira');
            return isUK && notFemale;
          });
        }
      } else {
        // US Male voices search
        targetVoice = voices.find(v => {
          const name = v.name.toLowerCase();
          const isUS = v.lang.includes('en-US') || v.lang.includes('en_US') ||
            name.includes('american') || name.includes('us') ||
            name.includes('united states') || name.includes('english (us)');

          // Check if voice name contains male keywords
          const isMale = maleKeywords.some(keyword => name.includes(keyword));

          // Exclude female voices
          const notFemale = !name.includes('female') && !name.includes('woman') &&
            !name.includes('girl') && !name.includes('lady') &&
            !name.includes('zira') && !name.includes('samantha') &&
            !name.includes('karen') && !name.includes('melina') &&
            !name.includes('ava') && !name.includes('victoria') &&
            !name.includes('allison') && !name.includes('susan');

          return isUS && (isMale || notFemale);
        });
      }
    } else {
      // Female voice selection
      const femaleKeywords = ['female', 'woman', 'girl', 'lady', 'hazel', 'susan',
        'karen', 'serena', 'alice', 'emma', 'olivia', 'sophia',
        'zira', 'samantha', 'victoria', 'allison'];

      if (setup.dialect === 'uk') {
        targetVoice = voices.find(v => {
          const name = v.name.toLowerCase();
          const isUK = v.lang.includes('en-GB') || v.lang.includes('en_GB');
          const isFemale = femaleKeywords.some(keyword => name.includes(keyword));
          return isUK && isFemale;
        });
      } else {
        targetVoice = voices.find(v => {
          const name = v.name.toLowerCase();
          const isUS = v.lang.includes('en-US') || v.lang.includes('en_US');
          const isFemale = femaleKeywords.some(keyword => name.includes(keyword));
          return isUS && isFemale;
        });
      }
    }

    // **CRITICAL FALLBACK** - If still no voice found
    if (!targetVoice) {
      console.log('No specific voice found, trying language match...');
      // Try to get any voice in the correct language
      const langVoices = voices.filter(v => v.lang.includes(langCode));

      if (langVoices.length > 0) {
        if (setup.gender === 'Male') {
          // For male: pick first voice that doesn't sound female
          targetVoice = langVoices.find(v => {
            const name = v.name.toLowerCase();
            return !name.includes('female') && !name.includes('woman') &&
              !name.includes('girl') && !name.includes('lady');
          }) || langVoices[0];
        } else {
          // For female: pick first voice
          targetVoice = langVoices[0];
        }
      } else {
        // Last resort: any English voice
        const englishVoices = voices.filter(v => v.lang.includes('en-'));
        if (englishVoices.length > 0) {
          targetVoice = englishVoices[0];
        } else {
          targetVoice = voices[0];
        }
      }
    }

    // Apply voice settings
    if (targetVoice) {
      utterance.voice = targetVoice;
      console.log('Selected voice:', targetVoice.name, 'Language:', targetVoice.lang, 'Gender:', setup.gender);

      // **FORCE MALE CHARACTERISTICS** with pitch and rate
      if (setup.gender === 'Male') {
        utterance.pitch = 0.5; // Very low pitch for male (range: 0-2, default: 1)
        utterance.rate = 0.95; // Slightly slower
      } else {
        utterance.pitch = 1.3; // Higher pitch for female
        utterance.rate = 1.0; // Normal speed
      }
    } else {
      console.warn('No voice found at all, using default settings');
      // Apply pitch anyway even without voice selection
      utterance.pitch = setup.gender === 'Male' ? 0.7 : 1.3;
    }

    utterance.lang = langCode;

    utterance.onstart = () => setIsPlaying(index);
    utterance.onend = () => setIsPlaying(null);
    utterance.onerror = () => setIsPlaying(null);

    window.speechSynthesis.speak(utterance);
  };
  useEffect(() => {
    const loadAndLogVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log('=== AVAILABLE VOICES ===');
      voices.forEach(voice => {
        console.log(`Name: ${voice.name}, Lang: ${voice.lang}, Default: ${voice.default}`);
      });
      console.log('=== END VOICES LIST ===');
    };

    // Load voices immediately
    loadAndLogVoices();

    // Some browsers load voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadAndLogVoices;
    }

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setupRef.current = setup;
  }, [setup]);

  useEffect(() => {
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceSupported(false);
      return;
    }

    const recognition: any = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.shouldRestart = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (recognition.shouldRestart) {
        recognition.shouldRestart = false;
        const currentSetup = setupRef.current;
        if (!currentSetup) {
          return;
        }
        try {
          recognition.lang = currentSetup.dialect === 'uk' ? 'en-GB' : 'en-US';
          recognition.start();
        } catch (error) {
          console.error('Unable to restart speech recognition:', error);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event);
      setIsRecording(false);
    };

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result[0]?.transcript) {
          transcript += result[0].transcript;
        }
      }

      const normalized = transcript.trim();
      if (normalized) {
        setInputText(normalized);
      }

    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      try {
        recognition.stop();
      } catch {
        // No active recording to stop
      }
      recognitionRef.current = null;
    };
  }, []);

  const toggleVoiceInput = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      console.warn('Voice input is unavailable right now. Please try again in a moment.');
      return;
    }

    if (isRecording) {
      recognition.shouldRestart = false;
      recognition.stop();
      return;
    }

    try {
      if (!setup) {
        console.warn('Complete setup before using voice input.');
        return;
      }
      recognition.shouldRestart = false;
      const language = setup.dialect === 'uk' ? 'en-GB' : 'en-US';
      recognition.lang = language;
      recognition.start();
    } catch (error) {
      console.error('Unable to start speech recognition:', error);
      setIsRecording(false);
    }
  };

  const retryVoiceInput = () => {
    if (!setup) {
      console.warn('Complete setup before retrying voice input.');
      return;
    }

    const recognition = recognitionRef.current;
    if (!recognition) {
      console.warn('Voice input is unavailable right now. Please try again in a moment.');
      return;
    }

    setInputText('');

    try {
      recognition.lang = setup.dialect === 'uk' ? 'en-GB' : 'en-US';
    } catch {
      // Safe to ignore language assignment failures
    }

    if (isRecording) {
      recognition.shouldRestart = true;
      try {
        recognition.stop();
      } catch (error) {
        console.error('Unable to stop speech recognition for retry:', error);
        recognition.shouldRestart = false;
      }
      return;
    }

    try {
      recognition.shouldRestart = false;
      recognition.start();
    } catch (error) {
      console.error('Unable to start speech recognition for retry:', error);
      setIsRecording(false);
    }
  };

  const clearVoiceInput = () => {
    setInputText('');
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }
    recognition.shouldRestart = false;
    if (isRecording) {
      try {
        recognition.stop();
      } catch {
        // Recognition already stopped
      }
    }
  };

  const startEditing = (index: number, currentText: string) => {
    setEditingIndex(index);
    setEditingText(currentText);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingText('');
  };

  const saveEditing = async () => {
    if (editingIndex === null || !setup) return;

    const savedEditingIndex = editingIndex;
    const savedEditingText = editingText;

    // Close editing UI immediately
    setEditingIndex(null);
    setEditingText('');

    // Calculate nextMessages synchronously first!
    const updated = messages.map((msg, i) => {
      if (i !== savedEditingIndex || msg.role !== 'user') return msg;
      return { ...msg, text: savedEditingText, correction: undefined } as UserMessage;
    });

    // TRUNCATE or DROP logic
    let nextMessages: ChatMessage[] = [];
    if (updated[savedEditingIndex + 1] && updated[savedEditingIndex + 1].role === 'ai') {
      nextMessages = [...updated.slice(0, savedEditingIndex + 1), ...updated.slice(savedEditingIndex + 2)];
    } else {
      nextMessages = updated;
    }

    // Now update state and show loading
    setMessages(nextMessages);
    setIsLoading(true);

    // Re-generate AI reply based on the edited user message
    if (!nextMessages.length) {
      setIsLoading(false);
      return;
    }
    const scenario = getScenario();
    if (!scenario) {
      setIsLoading(false);
      return;
    }
    try {
      const history = nextMessages.slice(0, -1).slice(-5);
      const historyText = history.map(msg =>
        msg.role === 'user' ? `User: ${msg.text}` : `AI: ${msg.reply}`
      ).join('\n');

      const levelDirective = buildLevelDirective(selectedSubTopic, setup.level);
      const scenarioTitle = subTopics.find(s => s.id === selectedSubTopic)?.title || 'Scenario';

      const prompt = `You are ${scenario.role} in this scenario: ${scenario.context}

      CRITICAL RULES:
      1. Character: You are a ${setup.gender} person. Stay in character!
      2. Length: VERY SHORT (max 15-20 words).
      3. Naturalness: Use conversational fillers (um, well, oh). 
      4. Dialect: Use ${setup.dialect === 'uk' ? 'British' : 'American'} English.
      5. Level: Match the ${setup.level} level tone exactly.
      6. REGENERATION: The user just EDITED their previous message. You MUST generate a FRESH, DYNAMIC response to this NEW text.
      7. CORRECTION: Analyze ONLY this new text: "${savedEditingText}". Provide an accurate correction and feedback.

      SCENARIO TITLE: ${scenarioTitle}
      LEVEL DIRECTIVE: ${levelDirective}
      Apply the directive so the regeneration feels tailored to the learner's level and this scenario.

      Recent Conversation:
      ${historyText}

      User just said (NEW VERSION): "${savedEditingText}"

      Respond with JSON ONLY:
      {"reply": "your fresh response", "hint": "suggested reply", "translation": "Urdu translation", "correction": {"ideal": "ideal version", "feedback": "feedback note"}}`;

      const modelName = getNextModel();
      console.log('Regeneration using model:', modelName);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { maxOutputTokens: 200, temperature: 1.0 }
      });

      const result = await model.generateContent(prompt);
      let responseText = result.response.text();
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      let jsonData: any;
      try {
        jsonData = JSON.parse(responseText);
      } catch {
        const match = responseText.match(/\{[\s\S]*?\}/);
        if (match) {
          try { jsonData = JSON.parse(match[0]); } catch { jsonData = null; }
        }
      }

      if (jsonData && jsonData.reply) {
        setMessages(prev => {
          const newMessages = [...prev];

          if (savedEditingIndex < newMessages.length && newMessages[savedEditingIndex]?.role === 'user' && jsonData.correction) {
            if (typeof jsonData.correction === 'object') {
              (newMessages[savedEditingIndex] as UserMessage).correction = {
                ideal: jsonData.correction.ideal || '',
                feedback: jsonData.correction.feedback || ''
              };
            } else if (typeof jsonData.correction === 'string' && jsonData.correction.trim() !== '') {
              (newMessages[savedEditingIndex] as UserMessage).correction = {
                ideal: jsonData.correction.trim(),
                feedback: ''
              };
            }
          }

          newMessages.push({
            role: 'ai',
            reply: jsonData.reply,
            hint: jsonData.hint || "",
            translation: jsonData.translation || "",
            timestamp: new Date(),
          });
          return newMessages;
        });
      } else {
        setMessages(prev => ([
          ...prev,
          {
            role: 'ai',
            reply: "Thanks for updating that! Let's keep going.",
            hint: "Tell me a bit more about it.",
            translation: "",
            timestamp: new Date(),
          }
        ]));
      }
    } catch (error) {
      console.error('Error regenerating AI response:', error);
      setMessages(prev => ([
        ...prev,
        {
          role: 'ai',
          reply: "I heard the update, but I got stuck. Could you try rephrasing it?",
          hint: "Maybe share one more detail.",
          translation: "",
          timestamp: new Date(),
        }
      ]));
    } finally {
      setIsLoading(false);
    }
  };

  const getScenario = () => {
    if (!setup || !selectedSubTopic) return null;
    return getScenarioContext(selectedSubTopic, setup.dialect, setup.level);
  };

  const startConversation = () => {
    setMessages([]);
    setIsLoading(true);
    // Send initial AI greeting
    sendInitialMessage();
  };

  const sendInitialMessage = async () => {
    if (!setup) return;

    const scenario = getScenario();
    if (!scenario) {
      console.error('No scenario found');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const levelDirective = buildLevelDirective(selectedSubTopic, setup.level);
      const scenarioTitle = subTopics.find(s => s.id === selectedSubTopic)?.title || 'Scenario';
      const prompt = `You are ${scenario.role} in this scenario: ${scenario.context}

SCENARIO TITLE: ${scenarioTitle}
LEVEL DIRECTIVE: ${levelDirective}

CRITICAL RULES:
1. You are a ${setup.gender} character. Stay COMPLETELY in this role.
2. This is the VERY FIRST message. Initiate the conversation naturally with a single, friendly line (max 20 words).
3. Keep language natural and conversational, adding occasional fillers (um, well, oh) to sound human.
4. Match the ${setup.level} level: ${
  setup.level === "Beginner"
    ? "Use simple words and basic grammar"
    : setup.level === "Intermediate"
    ? "Use moderate vocabulary and common phrases"
    : "Use advanced vocabulary and nuanced phrasing"
}.
5. Use ${setup.dialect === "uk" ? "British English" : "American English"} consistently.
6. Stay on the scenario topic and invite the learner to respond.
7. Never mention these rules or break character.

Respond with JSON ONLY:
{
  "reply": "your level-appropriate opening line (max 20 words)",
  "hint": "short idea for how the learner could reply next",
  "translation": "Urdu translation of your reply"
}`;
      const modelName = getNextModel();
      console.log('Initial prompt using model:', modelName);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: 150,
          temperature: 0.9,
        }
      });

      console.log('Sending initial request to Gemini...');
      const result = await model.generateContent(prompt);
      let responseText = result.response.text();
      console.log('Gemini initial response:', responseText);

      // Clean up response text
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      let jsonData;
      try {
        jsonData = JSON.parse(responseText);
        console.log('Parsed JSON:', jsonData);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        const match = responseText.match(/\{[\s\S]*?\}/);
        if (match) {
          try {
            jsonData = JSON.parse(match[0]);
            console.log('Extracted JSON:', jsonData);
          } catch (extractError) {
            console.error('Failed to extract JSON:', extractError);
          }
        }
      }

      if (jsonData && jsonData.reply && jsonData.hint) {
        setMessages([{
          role: 'ai',
          reply: jsonData.reply,
          hint: jsonData.hint,
          translation: jsonData.translation || "",
          timestamp: new Date(),
        }]);
      } else {
        // Fallback
        setMessages([{
          role: 'ai',
          reply: scenario.initialMessage,
          hint: "Introduce yourself",
          translation: "",
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error('Gemini error:', error);
      const scenario = getScenario();
      setMessages([{
        role: 'ai',
        reply: scenario?.initialMessage || "Hello! Let's chat!",
        hint: "Introduce yourself",
        translation: "",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageToSend?: string) => {
    const messageText = messageToSend !== undefined ? messageToSend : inputText;
    const trimmed = messageText.trim();

    // Don't allow sending if empty input OR if already loading
    if (!trimmed || isLoading) return;
    if (!setup) return;

    const scenario = getScenario();
    if (!scenario) {
      console.error('No scenario found');
      return;
    }

    // Add user message
    const userMessage: UserMessage = {
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    setIsLoading(true);

    try {
      // Get last 6 messages for context (3 exchanges)
      const history = messages.slice(-6);
      const historyText = history.map(msg =>
        msg.role === 'user' ? `User: ${msg.text}` : `AI: ${msg.reply}`
      ).join('\n');

      const levelDirective = buildLevelDirective(selectedSubTopic, setup.level);
      const scenarioTitle = subTopics.find(s => s.id === selectedSubTopic)?.title || 'Scenario';

      const prompt = `You are ${scenario.role} in this scenario: ${scenario.context}

SCENARIO TITLE: ${scenarioTitle}
LEVEL DIRECTIVE: ${levelDirective}
Use the directive to keep each response aligned with the learner's level while staying in character.

CRITICAL RULES:
1. You are a ${setup.gender} character. Stay COMPLETELY in this role.
2. Keep responses VERY SHORT: Maximum 1-2 sentences (15-20 words max).
3. Use natural, conversational language - like real people talk.
4. Add conversational fillers occasionally (um, well, oh, hmm) for naturalness.
5. Ask follow-up questions to keep conversation flowing.
6. Match ${setup.level} level: ${setup.level === 'Beginner' ? 'Use simple words and basic grammar' : setup.level === 'Intermediate' ? 'Use moderate vocabulary and common phrases' : 'Use advanced vocabulary and complex structures'}.
7. Use ${setup.dialect === 'uk' ? 'British English (e.g., flat, lift, brilliant, mate)' : 'American English (e.g., apartment, elevator, awesome, buddy)'}.
8. React naturally to what the user says - don't give lectures.
9. Gently correct grammar ONLY if there are clear mistakes.

Conversation so far:
${historyText}

User just said: "${trimmed}"

Respond with JSON ONLY (no markdown, no code blocks):
{"reply": "your brief in-character response (max 20 words)", 
"hint": "suggested next thing user could say", 
"translation": "Urdu translation of your reply", 
"correction": {"ideal": "the ideal/perfect grammar version of 
what user just said", "feedback": "analyze ONLY mistakes actually present in user message and give brief correction without assuming errors'."}}`;

      const modelName = getNextModel();
      console.log('Primary chat using model:', modelName);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.9,
        }
      });

      console.log('Sending request to Gemini...');
      const result = await model.generateContent(prompt);
      let responseText = result.response.text();
      console.log('Gemini response:', responseText);

      // Clean up response text
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      let jsonData;
      try {
        jsonData = JSON.parse(responseText);
        console.log('Parsed JSON:', jsonData);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        const match = responseText.match(/\{[\s\S]*?\}/);
        if (match) {
          try {
            jsonData = JSON.parse(match[0]);
            console.log('Extracted JSON:', jsonData);
          } catch (extractError) {
            console.error('Failed to extract JSON:', extractError);
          }
        }
      }

      if (jsonData && jsonData.reply) {
        setMessages(prev => {
          const newMessages = [...prev];
          // Add correction to the last user message if there is one
          if (jsonData.correction) {
            const lastUserMsgIndex = newMessages.length - 1;
            if (newMessages[lastUserMsgIndex] && newMessages[lastUserMsgIndex].role === 'user') {
              if (typeof jsonData.correction === 'object' && jsonData.correction.ideal) {
                (newMessages[lastUserMsgIndex] as UserMessage).correction = {
                  ideal: jsonData.correction.ideal,
                  feedback: jsonData.correction.feedback || ""
                };
              } else if (typeof jsonData.correction === 'string' && jsonData.correction.trim() !== "") {
                (newMessages[lastUserMsgIndex] as UserMessage).correction = {
                  ideal: jsonData.correction,
                  feedback: ""
                };
              }
            }
          }
          // Add AI response
          newMessages.push({
            role: 'ai',
            reply: jsonData.reply,
            hint: jsonData.hint || "",
            translation: jsonData.translation || "",
            timestamp: new Date(),
          });
          return newMessages;
        });
      } else {
        console.warn('Invalid JSON structure, using fallback');
        setMessages(prev => [...prev, {
          role: 'ai',
          reply: "That's interesting! Tell me more.",
          hint: "Could you explain that?",
          translation: "",
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error('Gemini error:', error);
      setMessages(prev => [...prev, {
        role: 'ai',
        reply: "That's great. Let's keep going!",
        hint: "Tell me more about it",
        translation: "",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    setMessages([]);
    startConversation();
  };

  const getFeedback = () => {
    setShowFeedback(true);
    setIsLoading(true);
    setTimeout(() => {
      const scenario = subTopics.find(s => s.id === selectedSubTopic);
      const userMessageCount = messages.filter(m => m.role === 'user').length;
      const feedbackText = `Great conversation practice! 
      
🎯 Scenario: ${scenario?.title}
💬 Your messages: ${userMessageCount}
📈 Level: ${setup?.level}
⏱️ Target duration: ${scenario?.duration}
🌍 Dialect: ${setup?.dialect === 'uk' ? 'British 🇬🇧' : 'American 🇺🇸'}

Keep practicing to improve your English skills!`;
      setFeedback(feedbackText);
      setIsLoading(false);
    }, 1000);
  };

  const goBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedSubTopic(null);
    setSetup(null);
    setMessages([]);
    setShowFeedback(false);
    setFeedback('');
  };

  const goBackToSubTopics = () => {
    setSelectedSubTopic(null);
    setSetup(null);
    setMessages([]);
    setShowFeedback(false);
    setFeedback('');
  };

  const goBackToSetup = () => {
    setSetup(null);
    setMessages([]);
    setShowFeedback(false);
    setFeedback('');
  };

  const completeSetup = () => {
    setSetup({
      dialect: tempDialect,
      level: tempLevel,
      gender: tempGender,
    });
  };

  // Start conversation when setup is complete
  useEffect(() => {
    if (setup && messages.length === 0) {
      startConversation();
    }
  }, [setup]);

  if (selectedCategory === null) {
    return (
      <div className={`p-4 pb-20 min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
        <div className="mb-8 text-center pt-8">
          <div className="flex justify-center mb-4">
            <Globe size={48} className="text-purple-600" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Choose Category</h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Select a category to explore sub-topics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-2xl p-8 shadow-sm transition-all duration-300 transform hover:scale-105 border-2 ${darkMode ? 'bg-[#1e293b] border-gray-700 hover:border-purple-500' : 'bg-white border-transparent hover:border-purple-500 hover:shadow-lg'}`}
            >
              <div className="text-center">
                <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{cat.title}</h2>
                <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{cat.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (selectedSubTopic === null) {
    const currentCategory = categories.find(c => c.id === selectedCategory);
    const filteredSubTopics = subTopics.filter(s => s.category === selectedCategory);

    return (
      <div className={`p-4 pb-20 min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-8 pt-4">
          <div className="flex items-center">
            <button
              onClick={goBackToCategories}
              className={`p-2 rounded-full mr-3 transition-colors ${darkMode ? 'bg-[#1e293b] text-white hover:bg-gray-700' : 'bg-white shadow-sm text-gray-600 hover:bg-gray-100'}`}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{currentCategory?.title}</h1>
              <p className={darkMode ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>Choose a sub-topic</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
          {filteredSubTopics.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubTopic(sub.id)}
              className={`w-full rounded-2xl p-6 shadow-sm transition-all duration-200 transform hover:scale-[1.01] text-left border ${darkMode ? 'bg-[#1e293b] border-gray-700 hover:bg-[#2d3a4f] hover:border-purple-500/50' : 'bg-white border-transparent hover:shadow-md hover:border-purple-300'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>{sub.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${sub.level === 'Beginner'
                  ? (darkMode ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700')
                  : sub.level === 'Advanced'
                    ? (darkMode ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-700')
                    : (darkMode ? 'bg-yellow-900/40 text-yellow-400' : 'bg-yellow-100 text-yellow-700')
                  }`}>
                  {sub.level}
                </span>
              </div>
              <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600 text-sm'}`}>{sub.description}</p>
              <div className={`flex items-center text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <MessageCircle size={14} className="mr-1" />
                <span>{sub.duration}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (setup === null) {
    return (
      <div className={`p-4 pb-20 min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-8 pt-4">
          <div className="flex items-center">
            <button
              onClick={goBackToSubTopics}
              className={`p-2 rounded-full mr-3 transition-colors ${darkMode ? 'bg-[#1e293b] text-white hover:bg-gray-700' : 'bg-white shadow-sm text-gray-600 hover:bg-gray-100'}`}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Setup</h1>
              <p className={darkMode ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>Configure your chat preferences</p>
            </div>
          </div>
        </div>

        <div className="space-y-8 max-w-4xl mx-auto">
          <div>
            <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Dialect</h2>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setTempDialect('us')} className={`p-4 rounded-xl ${tempDialect === 'us' ? 'bg-purple-600 text-white' : darkMode ? 'bg-[#1e293b] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>🇺🇸 US</button>
              <button onClick={() => setTempDialect('uk')} className={`p-4 rounded-xl ${tempDialect === 'uk' ? 'bg-purple-600 text-white' : darkMode ? 'bg-[#1e293b] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>🇬🇧 UK</button>
            </div>
          </div>

          <div>
            <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Level</h2>
            <div className="grid grid-cols-3 gap-4">
              <button onClick={() => setTempLevel('Beginner')} className={`p-4 rounded-xl ${tempLevel === 'Beginner' ? 'bg-purple-600 text-white' : darkMode ? 'bg-[#1e293b] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>Beginner</button>
              <button onClick={() => setTempLevel('Intermediate')} className={`p-4 rounded-xl ${tempLevel === 'Intermediate' ? 'bg-purple-600 text-white' : darkMode ? 'bg-[#1e293b] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>Intermediate</button>
              <button onClick={() => setTempLevel('Advanced')} className={`p-4 rounded-xl ${tempLevel === 'Advanced' ? 'bg-purple-600 text-white' : darkMode ? 'bg-[#1e293b] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>Advanced</button>
            </div>
          </div>

          <div>
            <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Character Voice & Gender</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setTempGender('Male');
                  // Trigger a short preview with a mock index to show playback
                  const previewText = tempDialect === 'uk' ? "Hello! This is my British voice." : "Hello! This is my American voice.";
                  speak(previewText, -1);
                }}
                className={`p-4 rounded-xl flex items-center justify-center gap-2 group transition-all ${tempGender === 'Male' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : darkMode ? 'bg-[#1e293b] text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <User size={18} className={tempGender === 'Male' ? 'text-white' : 'text-gray-400 group-hover:text-purple-400'} />
                <span>Male</span>
                {tempGender === 'Male' && <Volume2 size={14} className="animate-pulse" />}
              </button>
              <button
                onClick={() => {
                  setTempGender('Female');
                  const previewText = tempDialect === 'uk' ? "Hello! This is my British voice." : "Hello! This is my American voice.";
                  speak(previewText, -2);
                }}
                className={`p-4 rounded-xl flex items-center justify-center gap-2 group transition-all ${tempGender === 'Female' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : darkMode ? 'bg-[#1e293b] text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <User size={18} className={tempGender === 'Female' ? 'text-white' : 'text-gray-400 group-hover:text-purple-400'} />
                <span>Female</span>
                {tempGender === 'Female' && <Volume2 size={14} className="animate-pulse" />}
              </button>
            </div>
          </div>

          <button onClick={completeSetup} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-600 transition-all active:scale-95">Start Chat</button>
        </div>
      </div>
    );
  }

  const subTopic = subTopics.find(s => s.id === selectedSubTopic);
  const countryFlag = setup?.dialect === 'uk' ? '🇬🇧' : '🇺🇸';

  return (
    <div className={`p-4 pb-20 min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
      <div className={`sticky top-0 z-10 ${darkMode ? 'bg-[#0f172a]' : 'bg-gray-50'} pb-4`}>
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center">
            <button onClick={goBackToSetup} className={`p-2 rounded-full mr-3 transition-colors ${darkMode ? 'bg-[#1e293b] text-white hover:bg-gray-700' : 'bg-white shadow-sm text-gray-600 hover:bg-gray-100'}`}><ArrowLeft size={20} /></button>
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{countryFlag} {subTopic?.title}</h1>
              <p className={darkMode ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>{subTopic?.level} • {subTopic?.duration}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setBridgeMode(!bridgeMode)} className={`p-2 rounded-full ${bridgeMode ? 'bg-purple-600 text-white' : darkMode ? 'bg-[#1e293b] text-gray-400' : 'bg-white text-gray-600'}`}><Globe size={20} /></button>
            <button onClick={getFeedback} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-200 dark:shadow-none hover:bg-purple-700 transition-all active:scale-95">Get Feedback</button>
          </div>
        </div>
      </div>

      <div className={`rounded-[32px] shadow-xl mb-4 overflow-hidden border ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className={`p-4 border-b ${darkMode ? 'border-gray-800 bg-gray-900/20' : 'border-gray-50 bg-gray-50/30'}`}>
          <p className={`text-sm italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>"{subTopic?.description}"</p>
        </div>

        <div className="p-6 space-y-6 h-[400px] overflow-y-auto">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${message.role === 'user' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{message.role === 'user' ? <User size={18} /> : <Bot size={18} />}</div>
                <div>
                  <div className={`p-4 rounded-2xl shadow-sm relative group ${message.role === 'user' ? 'bg-purple-600 text-white rounded-tr-none' : darkMode ? 'bg-gray-800 border border-gray-700 text-white rounded-tl-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>
                    {message.role === 'user' && editingIndex === index ? (
                      <>
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className={`w-full text-sm leading-relaxed rounded-lg p-2 focus:outline-none ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
                          rows={2}
                        />
                        <div className="flex gap-2 mt-2">
                          <button onClick={saveEditing} className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95">Save</button>
                          <button onClick={cancelEditing} className={`px-3 py-1 text-xs font-bold rounded-lg ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} active:scale-95`}>Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm leading-relaxed pr-10">{message.role === 'user' ? message.text : message.reply}</p>
                        {message.role === 'user' && (
                          <button
                            onClick={() => startEditing(index, message.text)}
                            className={`absolute right-8 top-2 p-1 rounded-full transition-all ${message.role === 'user'
                              ? 'text-purple-300 hover:text-white opacity-0 group-hover:opacity-100'
                              : 'text-gray-400 hover:text-purple-500 opacity-0 group-hover:opacity-100'
                              }`}
                            title="Edit message"
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => speak(message.role === 'user' ? message.text : message.reply, index)}
                          className={`absolute right-2 top-2 p-1 rounded-full transition-all ${isPlaying === index
                            ? 'text-emerald-400 scale-110'
                            : message.role === 'user'
                              ? 'text-purple-300 hover:text-white opacity-0 group-hover:opacity-100'
                              : 'text-gray-400 hover:text-purple-500 opacity-0 group-hover:opacity-100'
                            }`}
                          title="Listen to message"
                        >
                          <Volume2 size={14} className={isPlaying === index ? 'animate-pulse' : ''} />
                        </button>
                      </>
                    )}
                  </div>
                  {message.role === 'user' && message.correction && (
                    <div className={`mt-2 p-3 rounded-lg border text-sm ${darkMode ? 'border-emerald-500/40 bg-emerald-900/20' : 'border-emerald-200 bg-emerald-50'}`}>
                      <div className="flex items-center gap-2 font-semibold text-emerald-500 mb-2">
                        <span>✓</span>
                        <span>Correct Answer</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className={`font-bold pr-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Ideal:</span>
                          <span className={`leading-relaxed ${darkMode ? 'text-emerald-100' : 'text-emerald-800'}`}>{message.correction.ideal}</span>
                        </div>
                        {message.correction.feedback && (
                          <div>
                            <span className={`font-bold pr-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Feedback:</span>
                            <span className={`leading-relaxed ${darkMode ? 'text-emerald-100' : 'text-emerald-800'}`}>{message.correction.feedback}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {message.role === 'ai' && bridgeMode && message.translation && <div className={`mt-2 text-sm italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>🌍 Urdu: {message.translation}</div>}
                  {message.role === 'ai' && message.hint && (
                    <div className={`mt-4 p-4 border border-dashed rounded-lg ${darkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-300 bg-gray-50'}`}>
                      <h4 className={`font-bold mb-2 text-xs uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>💡 Try Saying:</h4>
                      <p className={`mb-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>"{message.hint}"</p>
                      <button onClick={() => sendMessage(message.hint)} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-all active:scale-95">Use This Reply</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && <div className="flex justify-start"><div className={`flex items-center space-x-3 p-4 rounded-2xl ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}><Loader className="animate-spin" size={16} /><span className="text-sm font-medium">Thinking...</span></div></div>}
          <div ref={messagesEndRef} />
        </div>

        <div className={`p-6 border-t ${darkMode ? 'border-gray-800 bg-gray-900/20' : 'border-gray-50'}`}>
          <div className="flex flex-col items-center space-y-4">
            {voiceSupported ? (
              <>
                <div className="w-full max-w-md flex items-center gap-2">
                  <button
                    onClick={retryVoiceInput}
                    className={`h-16 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    <RefreshCcw size={18} />
                    <span>Retry</span>
                  </button>
                  <button
                    onClick={toggleVoiceInput}
                    className={`flex-1 h-16 flex items-center justify-center text-white rounded-2xl transition-all shadow-lg shadow-emerald-100 dark:shadow-none active:scale-95 text-lg font-bold ${isRecording ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isRecording ? (
                      <Loader size={24} className="mr-2 animate-spin" />
                    ) : (
                      <Mic size={24} className="mr-2" />
                    )}
                    {isRecording ? 'Listening...' : 'Speak to Type'}
                  </button>
                  <button
                    onClick={clearVoiceInput}
                    className={`h-16 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={!inputText.trim()}
                  >
                    <Trash size={18} />
                    <span>Clear</span>
                  </button>
                </div>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Voice captures fill the text box so you can review before sending.
                </span>
              </>
            ) : (
              <button
                onClick={toggleVoiceInput}
                disabled
                className={`w-full max-w-md h-16 flex items-center justify-center text-white rounded-2xl transition-all shadow-lg shadow-emerald-100 dark:shadow-none text-lg font-bold bg-gray-500/60 cursor-not-allowed`}
              >
                <Mic size={24} className="mr-2" />
                Voice input unavailable
              </button>
            )}
            <div className="flex items-center w-full max-w-md space-x-3">
              <button onClick={resetConversation} className={`p-2.5 rounded-full transition-colors flex items-center justify-center ${darkMode ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}><RotateCcw size={20} /></button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && inputText.trim() && !isLoading) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your response..."
                className={`flex-1 px-5 py-3.5 rounded-2xl border-none outline-none text-sm transition-all focus:ring-2 focus:ring-purple-500/20 ${darkMode ? 'bg-gray-800 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-800 placeholder-gray-400'}`}
                disabled={isLoading}
              />
              <button
                className={`p-2.5 rounded-full transition-colors flex items-center justify-center ${darkMode ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-purple-600 text-white hover:bg-purple-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={() => sendMessage()}
                disabled={isLoading || !inputText.trim()}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showFeedback && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className={`rounded-[32px] p-8 max-w-md w-full shadow-2xl border ${darkMode ? 'bg-[#1e293b] text-white border-gray-700' : 'bg-white text-gray-800 border-gray-100'}`}>
            <h2 className="text-2xl font-black mb-6 flex items-center uppercase tracking-tight">📊 Feedback</h2>
            {isLoading ? <div className="flex flex-col items-center justify-center py-12"><Loader className="animate-spin text-purple-600 mb-4" size={40} /><p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Analyzing Practice...</p></div> : <div className={`whitespace-pre-wrap text-sm leading-relaxed mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{feedback}</div>}
            <button onClick={() => setShowFeedback(false)} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-purple-100 dark:shadow-none hover:bg-purple-700 transition-all active:scale-95">Got it!</button>
          </div>
        </div>
      )}
    </div>
  );
};
