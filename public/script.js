// Updated script.js for Cohere integration
let userPoints = 0;
let taskCounter = 0;
let userName = '';

// DOM Elements
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const todoList = document.getElementById('todoList');
const pointsDisplay = document.getElementById('points');
const onboardingOverlay = document.getElementById('onboardingOverlay');
const nameInput = document.getElementById('nameInput');
const startButton = document.getElementById('startButton');

// API endpoint - change this to your actual server address when deployed
const API_URL = 'http://localhost:3000/api/generate-tasks';

// Show onboarding overlay every time the page loads
function showOnboarding() {
    onboardingOverlay.classList.add('active');
    nameInput.focus();
    
    // If we have a saved name, pre-fill the input
    const savedName = localStorage.getItem('userName');
    if (savedName) {
        nameInput.value = savedName;
        startButton.disabled = false;
    }
}

// Update welcome message with user's name
function updateWelcomeMessage() {
    const welcomeMessage = document.querySelector('.ai-message');
    welcomeMessage.textContent = `Hello ${userName}! I'm here to help you break down tasks. What would you like help with today?`;
}

// Add a message to the chat container
function addMessage(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'user-message' : 'ai-message';
    messageDiv.textContent = message;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
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

// Handle sending a message
async function handleSendMessage() {
    const message = userInput.value.trim();
    if (message === '') return;
    
    // Add user message to chat
    addMessage(message, true);
    userInput.value = '';
    
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

// Initialize the app
function init() {
    // Show onboarding overlay every time
    showOnboarding();
    
    // Enable/disable start button based on input
    nameInput.addEventListener('input', function() {
        startButton.disabled = nameInput.value.trim() === '';
    });
    
    // Handle start button click
    startButton.addEventListener('click', function() {
        if (nameInput.value.trim() !== '') {
            userName = nameInput.value.trim();
            localStorage.setItem('userName', userName);
            onboardingOverlay.classList.remove('active');
            updateWelcomeMessage();
        }
    });
    
    // Allow pressing Enter in the name input
    nameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && nameInput.value.trim() !== '') {
            startButton.click();
        }
    });
    
    // Handle send button click
    sendButton.addEventListener('click', handleSendMessage);
    
    // Allow pressing Enter in the message input
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });
}

// Call init when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);