// server/server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// DATABASE MOCK
let candidates = {};

app.post('/api/track', (req, res) => {
    const { candidateId, events, metrics } = req.body; // metrics includes typing speed

    if (!candidateId) return res.status(400).send("No ID");

    // Initialize New Candidate
    if (!candidates[candidateId]) {
        candidates[candidateId] = { 
            riskScore: 0, 
            events: [], 
            level: "Low", 
            focusTime: 100, // Starts at 100% focus
            startTime: Date.now()
        };
    }

    let student = candidates[candidateId];
    let currentRisk = student.riskScore;
    let newEvents = [];
    let violationDetected = false;

    // --- 1. ANALYZE EVENTS ---
    events.forEach(event => {
        // TAB SWITCHING
        if (event.type === "TAB_SWITCH_OUT") {
            currentRisk += 15;
            newEvents.push(event);
            violationDetected = true;
        }
        
        // PASTE (Smart Check: Is it a short paste or a whole essay?)
        if (event.type === "PASTE") {
            const riskAdd = event.length > 50 ? 20 : 5; // Higher risk for long pastes
            currentRisk += riskAdd;
            newEvents.push({ ...event, message: `Pasted ${event.length} chars (Risk +${riskAdd})` });
            violationDetected = true;
        }

        // IMPOSSIBLE TYPING (Bot Check)
        if (event.type === "IMPOSSIBLE_TYPING") {
            currentRisk += 50; // Critical hit
            newEvents.push(event);
            violationDetected = true;
        }
    });

    // --- 2. ANALYZE METRICS (Typing Speed) ---
    // If typing speed > 300 WPM, it's likely a script or hidden paste
    if (metrics && metrics.wpm > 300) {
        currentRisk += 40;
        newEvents.push({ 
            type: "SUPERHUMAN_SPEED", 
            message: `Typing speed ${metrics.wpm} WPM detected (Bot threshold is 300)` 
        });
        violationDetected = true;
    }

    // --- 3. DYNAMIC DECAY (Healing) ---
    // If no violations, risk drops slowly (rewarding good behavior)
    if (!violationDetected) {
        currentRisk -= 2; 
    }

    // Clamping
    currentRisk = Math.max(0, Math.min(100, currentRisk));

    // Determine Status
    let level = "Low";
    if (currentRisk > 40) level = "Medium";
    if (currentRisk > 75) level = "Critical";

    // Update Database
    student.riskScore = Math.floor(currentRisk);
    student.level = level;
    student.events.push(...newEvents);
    student.lastUpdate = Date.now();

    console.log(`User: ${candidateId} | Risk: ${student.riskScore} | WPM: ${metrics?.wpm || 0}`);

    // Response to SDK (Triggers the popup)
    res.json({ 
        success: true, 
        riskScore: student.riskScore,
        violation: violationDetected // Tell SDK to flash red immediately
    });
});

app.get('/api/status', (req, res) => {
    const data = Object.keys(candidates).map(id => ({ id, ...candidates[id] }));
    res.json(data);
});

app.listen(3000, () => console.log("ProctorSense Brain Active on Port 3000"));