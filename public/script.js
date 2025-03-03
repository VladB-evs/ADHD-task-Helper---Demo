// Global variables
let userName = '';
let userPoints = 0;
let todoList;
let chatContainer;
let userInput;
let sendButton;
let pointsDisplay;
let batteryLevel;
let sentimentText;
let onboardingOverlay;
let nameInput;
let startButton;

// API endpoint for task generation
const API_URL = 'http://localhost:3000/api/generate-tasks';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    todoList = document.getElementById('todoList');
    chatContainer = document.getElementById('chatContainer');
    userInput = document.getElementById('userInput');
    sendButton = document.getElementById('sendButton');
    pointsDisplay = document.getElementById('points');
    batteryLevel = document.getElementById('batteryLevel');
    sentimentText = document.getElementById('sentimentText');
    onboardingOverlay = document.getElementById('onboardingOverlay');
    nameInput = document.getElementById('nameInput');
    startButton = document.getElementById('startButton');
    
    // Check if user has already completed onboarding
    if (localStorage.getItem('userName')) {
        userName = localStorage.getItem('userName');
        onboardingOverlay.style.display = 'none';
        updateWelcomeMessage();
    }
    
    // Event listeners
    nameInput.addEventListener('input', validateNameInput);
    startButton.addEventListener('click', completeOnboarding);
    sendButton.addEventListener('click', handleSendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });
    
    // Initialize sentiment display
    updateSentimentDisplay(0.5); // Default neutral sentiment
});

// Update welcome message with user's name
function updateWelcomeMessage() {
    const welcomeMessage = document.querySelector('.ai-message');
    welcomeMessage.textContent = `Hello ${userName}! I'm here to help you break down tasks. What would you like help with today?`;
}

// Validate name input for onboarding
function validateNameInput() {
    if (nameInput.value.trim() !== '') {
        startButton.disabled = false;
    } else {
        startButton.disabled = true;
    }
}

// Complete onboarding process
function completeOnboarding() {
    userName = nameInput.value.trim();
    localStorage.setItem('userName', userName);
    
    // Add fade-out animation to onboarding overlay
    onboardingOverlay.classList.add('animate__animated', 'animate__fadeOut');
    
    // Remove overlay after animation completes
    setTimeout(() => {
        onboardingOverlay.style.display = 'none';
        updateWelcomeMessage();
    }, 500);
}

// Add a task to the todo list
function addTask(taskText) {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    
    const taskTextSpan = document.createElement('span');
    taskTextSpan.className = 'task-text';
    taskTextSpan.textContent = taskText;
    
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            taskTextSpan.classList.add('task-complete');
            userPoints += 10;
            pointsDisplay.textContent = userPoints;
            // Add animation to points display
            pointsDisplay.classList.add('animate__animated', 'animate__bounce');
            setTimeout(() => {
                pointsDisplay.classList.remove('animate__animated', 'animate__bounce');
            }, 1000);
        } else {
            taskTextSpan.classList.remove('task-complete');
            userPoints = Math.max(0, userPoints - 10);
            pointsDisplay.textContent = userPoints;
        }
    });
    
    taskItem.appendChild(checkbox);
    taskItem.appendChild(taskTextSpan);
    todoList.appendChild(taskItem);
}

// Add a message to the chat container
function addMessage(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'user-message' : 'ai-message';
    messageDiv.textContent = message;
    
    // Add animation class
    messageDiv.classList.add('animate__animated', 'animate__fadeInUp');
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Analyze sentiment of user input (simple implementation)
function analyzeSentiment(text) {
    const positiveWords = [
        'happy', 'good', 'great', 'excellent', 'amazing', 'love', 'enjoy', 'excited',
        'wonderful', 'fantastic', 'brilliant', 'awesome', 'delighted', 'pleased',
        'confident', 'motivated', 'energetic', 'positive', 'accomplished', 'proud',
        'calm', 'relaxed', 'peaceful', 'determined', 'focused'
    ];
    const negativeWords = [
        'sad', 'bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'upset',
        'difficult', 'hard', 'struggle', 'worried', 'anxious', 'stressed',
        'overwhelmed', 'frustrated', 'confused', 'tired', 'exhausted', 'depressed',
        'scared', 'afraid', 'nervous', 'stuck', 'hopeless'
    ];
    
    let score = 0.5; // Neutral starting point
    const words = text.toLowerCase().split(/\s+/);
    
    // Count word occurrences for more accurate sentiment
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
        if (positiveWords.includes(word)) positiveCount++;
        if (negativeWords.includes(word)) negativeCount++;
    });
    
    // Calculate sentiment based on relative frequency
    if (positiveCount + negativeCount > 0) {
        score = 0.5 + (0.5 * (positiveCount - negativeCount) / (positiveCount + negativeCount));
    }
    
    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, score));
}

function updateSentimentDisplay(sentiment) {
    // Update battery level width based on sentiment (0-100%)
    batteryLevel.style.width = `${sentiment * 100}%`;
    
    // Update sentiment text and add emoji indicators
    if (sentiment < 0.3) {
        sentimentText.innerHTML = '😔 Feeling Down';
    } else if (sentiment < 0.7) {
        sentimentText.innerHTML = '😊 Feeling Okay';
    } else {
        sentimentText.innerHTML = '🌟 Feeling Great';
    }
    
    // Update battery level color based on sentiment
    const hue = Math.floor(120 * sentiment); // 0 is red, 120 is green
    batteryLevel.style.background = `hsl(${hue}, 70%, 50%)`;
}

// Handle sending a message
async function handleSendMessage() {
    const message = userInput.value.trim();
    if (message === '') return;
    
    // Add user message to chat
    addMessage(message, true);
    userInput.value = '';
    
    // Analyze and update sentiment
    const sentiment = analyzeSentiment(message);
    updateSentimentDisplay(sentiment);
    
    try {
        // Show loading message
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'ai-message';
        loadingMessage.textContent = 'Breaking down your task...';
        chatContainer.appendChild(loadingMessage);
        
        // Call API to generate tasks
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        // Remove loading message
        chatContainer.removeChild(loadingMessage);
        
        // Add AI response
        addMessage('Here are your broken-down tasks:');
        
        // Clear previous tasks
        todoList.innerHTML = '';
        
        // Add new tasks
        data.tasks.forEach(task => {
            addTask(task);
        });
        
    } catch (error) {
        console.error('Error:', error);
        addMessage('Sorry, I had trouble breaking down that task. Please try again.');
    }
}