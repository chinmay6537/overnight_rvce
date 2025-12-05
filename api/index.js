const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Store candidates in memory (Note: In Vercel serverless, this memory resets 
// when the function goes cold. For production, you'd use a database like Redis/Mongo.
// For a hackathon demo, this works as long as the tab stays active.)
let candidates = {};

// Reset Endpoint
app.post('/api/reset', (req, res) => {
    candidates = {};
    console.log("--- SYSTEM RESET ---");
    res.json({ success: true });
});

app.post('/api/track', (req, res) => {
    const { candidateId, events, metrics, status } = req.body;

    if (!candidateId) return res.status(400).send("No ID");

    if (!candidates[candidateId]) {
        candidates[candidateId] = { 
            riskScore: 0, 
            events: [], 
            level: "Low", 
            startTime: Date.now(),
            badStateDuration: 0,
            device: req.body.deviceInfo // Capture device info if sent
        };
    }

    let student = candidates[candidateId];
    let currentRisk = student.riskScore;
    let newEvents = [];
    let violationDetected = false;

    // --- EVENT PENALTIES (Instant Actions) ---
    // These still add points instantly because they are deliberate actions
    if (events && Array.isArray(events)) {
        events.forEach(event => {
            if (event.type === "TAB_SWITCH_OUT") { currentRisk += 5; violationDetected = true; }
            if (event.type === "FULL_SCREEN_EXIT") { currentRisk += 5; violationDetected = true; } 
            if (event.type === "FOCUS_LOST") { currentRisk += 2; violationDetected = true; } 
            
            if (event.type === "PASTE") {
                const riskAdd = event.length > 50 ? 10 : 2; 
                currentRisk += riskAdd;
                violationDetected = true;
            }
            
            if (event.type === "HONEYPOT_TRIGGER") { currentRisk += 30; violationDetected = true; }
            if (event.type === "IMPOSSIBLE_TYPING") { currentRisk += 30; violationDetected = true; }
            
            // REMOVED: AUDIO_ANOMALY check (feature removed)
            
            newEvents.push(event);
        });
    }

    if (metrics && metrics.wpm > 300) {
        currentRisk += 20;
        newEvents.push({ type: "SUPERHUMAN_SPEED", message: `Speed: ${metrics.wpm}`, timestamp: Date.now() });
        violationDetected = true;
    }

    // --- STATE PENALTIES (Continuous with Grace Period) ---
    if (status) {
        if (!status.isFullScreen || !status.isFocused) {
            student.badStateDuration += 3; // Add 3 seconds (since interval is 3s)
        } else {
            student.badStateDuration = 0; // Reset
        }

        // Only punish if bad state lasts > 6 seconds (Grace Period)
        if (student.badStateDuration > 6) {
            currentRisk += 1; // SLOW PENALTY: Add only 1 point every 3 seconds
            violationDetected = true;
        }
    }

    // --- HEALING ---
    if (!violationDetected) {
        currentRisk -= 2; // Heals 2 points every 3 seconds (Faster than punishment)
    }

    currentRisk = Math.max(0, Math.min(100, currentRisk));
    let level = "Low";
    if (currentRisk > 30) level = "Medium";
    if (currentRisk > 70) level = "Critical";

    student.riskScore = Math.floor(currentRisk);
    student.level = level;
    // Limit event history to avoid memory bloat
    if (newEvents.length > 0) {
        student.events.push(...newEvents);
        if (student.events.length > 50) student.events = student.events.slice(-50);
    }
    student.lastUpdate = Date.now();

    res.json({ success: true, riskScore: student.riskScore, violation: violationDetected });
});

app.get('/api/status', (req, res) => {
    const data = Object.keys(candidates).map(id => ({ id, ...candidates[id] }));
    res.json(data);
});

// IMPORTANT FOR VERCEL: Export the app, do NOT listen
module.exports = app;