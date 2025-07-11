"use strict";
// --- Real-time polling for new suspicious login alerts ---
let lastAlertTimestamps = {};
setInterval(async () => {
    try {
        const response = await fetch('http://localhost:8000/alerts/suspicious-logins');
        const alerts = await response.json();
        for (const a of alerts) {
            // Only notify if this alert is new (not seen before)
            if (!lastAlertTimestamps[a.email] || lastAlertTimestamps[a.email] !== a.timestamp) {
                // Here, send the alert to the analyst (console, chat, etc.)
                console.log(`REAL-TIME ALERT: Suspicious login attempt detected: 5 failed logins for ${a.email}\nRisk Level: ${a.risk_level}\nAction: Suggest Black IP notify-admin`);
                // Update last seen timestamp for this user
                lastAlertTimestamps[a.email] = a.timestamp;
                // You can also send this via a chat API (Telegram, Slack, etc.)
            }
        }
    }
    catch (err) {
        // Optionally log errors
    }
}, 10000); // Check every 10 seconds
// Use require for node-fetch to avoid ESM/TS import issues
// @ts-ignore
const fetch = require('node-fetch');
const express = require('express');
const app = express();
const PORT = 3001; // Or any port you want for your chatbot
// Simulate a chatbot endpoint
app.get('/chatbot', async (req, res) => {
    // Simulate the analyst's question
    const question = req.query.q || '';
    if (typeof question === 'string' && question.toLowerCase().includes('suspicious login')) {
        // Call your FastAPI backend for suspicious logins
        try {
            const response = await fetch('http://localhost:8000/alerts/suspicious-logins');
            const alerts = await response.json();
            if (!alerts || alerts.length === 0) {
                return res.send('No suspicious login attempts detected today.');
            }
            // Format the response like your diagram
            const messages = alerts.map((a) => `Suspicious login attempt detected: 5 failed logins for ${a.email}\nRisk Level: ${a.risk_level}\nAction: Suggest Black IP notify-admin`);
            return res.send(messages.join('\n\n'));
        }
        catch (err) {
            return res.status(500).send('Error fetching alerts from backend.');
        }
    }
    res.send('Ask me about suspicious login attempts!');
});
app.listen(PORT, () => {
    console.log(`Chatbot running on http://localhost:${PORT}/chatbot?q=Any%20suspicious%20login%20attempts%20today`);
});
