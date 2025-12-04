// server/server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// IN-MEMORY DATABASE
// Structure: { "Student-1": { riskScore: 0, events: [], level: "Low" } }
let candidates = {};

// --- RECEIVE DATA FROM SDK ---
app.post('/api/track', (req, res) => {
    const { candidateId, events, mouseActivity } = req.body;

    if (!candidateId) return res.status(400).send("No ID");

    // Initialize candidate if new
    if (!candidates[candidateId]) {
        candidates[candidateId] = { riskScore: 0, events: [], level: "Low" };
    }

    let currentRisk = candidates[candidateId].riskScore;
    let newEvents = [];
    let hasBadBehavior = false;

    // --- 1. RISK CALCULATION ENGINE ---
    events.forEach(event => {
        newEvents.push(event);
        hasBadBehavior = true;
        
        // SCORING RULES
        if (event.type === "TAB_SWITCH_OUT") currentRisk += 20; // High Penalty
        if (event.type === "PASTE") currentRisk += 10;          // Medium Penalty
        if (event.type === "COPY") currentRisk += 5;            // Low Penalty
        if (event.type === "IMPOSSIBLE_TYPING") currentRisk += 50; // CRITICAL (Bot detected)
    });

    // Check for "Bot-like" stillness (Mouse moved less than 3 times in 3 seconds)
    if (mouseActivity < 3) {
        // Only penalize if they are also NOT typing (to avoid flagging thinkers)
        // For simplicity in hackathon, we add a small risk
        currentRisk += 2;
    }

    // --- 2. DYNAMIC DECAY (The Fairness Logic) ---
    // If no bad events occurred in this packet, heal the score
    if (!hasBadBehavior) {
        currentRisk -= 5; // Decay by 5 points every 3 seconds
    }

    // Clamp scores (0 to 100)
    if (currentRisk < 0) currentRisk = 0;
    if (currentRisk > 100) currentRisk = 100;

    // Determine Level
    let level = "Low";
    if (currentRisk > 30) level = "Medium";
    if (currentRisk > 70) level = "High";

    // Update Memory
    candidates[candidateId].riskScore = currentRisk;
    candidates[candidateId].level = level;
    candidates[candidateId].events.push(...newEvents);
    candidates[candidateId].lastUpdate = new Date();

    console.log(`Updated ${candidateId}: Risk ${currentRisk} (${level})`);

    // --- 3. SEND INTERVENTION SIGNAL BACK TO SDK ---
    res.json({ 
        success: true, 
        riskScore: currentRisk,
        intervention: currentRisk > 70 ? "WARN" : "NONE" 
    });
});

// --- SEND DATA TO DASHBOARD ---
app.get('/api/status', (req, res) => {
    const dashboardData = Object.keys(candidates).map(id => ({
        id: id,
        ...candidates[id]
    }));
    res.json(dashboardData);
});

app.listen(3000, () => console.log("ProctorSense Brain is running on port 3000..."));