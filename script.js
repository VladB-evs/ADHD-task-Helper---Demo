// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const corsOptions = {
    origin: ['https://adhd-task-helper-demo.vercel.app', 'http://adhd-task-helper-demo.vercel.app', 'http://localhost:3000'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.static('public'));

// Cohere API endpoint
app.post('/api/generate-tasks', async (req, res) => {
    try {
        const { message } = req.body;
        
        // Call Cohere API
        const response = await axios.post(
            'https://api.cohere.ai/v1/chat',
            {
                message: `I need help breaking down this task into small, manageable steps for someone with ADHD: "${message}". 
                          Please provide a list of 5-10 specific, actionable steps that are easy to follow. 
                          Format your response as a JSON array of strings, each representing one small step.`,
                model: 'command',
                temperature: 0.7,
                max_tokens: 300
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        // Extract tasks from Cohere response
        // This is a simplified approach - in a real app you'd want to parse the JSON from the text response
        const cohereText = response.data.text || "";
        
        // Very basic JSON extraction - in production you'd want more robust parsing
        let tasks = [];
        try {
            // Try to find a JSON array in the response - using non-greedy match to avoid capturing too much
            const jsonMatch = cohereText.match(/\[.*?\]/s);
            if (jsonMatch && jsonMatch[0]) {
                try {
                    tasks = JSON.parse(jsonMatch[0]);
                } catch (jsonError) {
                    console.log('JSON parsing failed, falling back to text processing');
                    throw jsonError; // Trigger the fallback
                }
            } else {
                // Fallback: split by newlines and clean up
                tasks = cohereText
                    .split('\n')
                    .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
                    .map(line => line.replace(/^-|\d+\.\s*/, '').trim());
            }
        } catch (parseError) {
            console.error('Error parsing tasks:', parseError);
            tasks = ['Start with a small piece of the task', 'Work for just 5 minutes', 'Take a break if needed'];
        }
        
        res.json({ tasks });
    } catch (error) {
        console.error('Error calling Cohere API:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to generate tasks',
            message: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});