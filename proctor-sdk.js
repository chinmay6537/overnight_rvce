// proctor-sdk.js
(function() {
    console.log("ProctorSense SDK Active");

    let eventLog = [];
    let mouseMovements = 0;
    let keyTimes = []; // For Keystroke Dynamics
    
    function getCandidateId() {
        const input = document.getElementById("candidateId");
        return input ? input.value : null;
    }

    // --- 1. TRACKING TAB SWITCHING ---
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            logEvent("TAB_SWITCH_OUT", "User switched tabs/windows");
        } else {
            logEvent("TAB_SWITCH_IN", "User returned to exam");
        }
    });

    // --- 2. TRACKING CLIPBOARD ---
    document.addEventListener("copy", () => logEvent("COPY", "Copied content"));
    document.addEventListener("paste", () => logEvent("PASTE", "Pasted content"));
    document.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        logEvent("RIGHT_CLICK", "Attempted right-click menu");
    });

    // --- 3. TRACKING MOUSE & KEYSTROKE DYNAMICS ---
    document.addEventListener("mousemove", () => {
        mouseMovements++;
    });

    document.addEventListener("keydown", (e) => {
        // Record timestamp
        const now = Date.now();
        keyTimes.push(now);
        
        // Keep only last 10 presses
        if (keyTimes.length > 10) keyTimes.shift();

        // CHECK: Is it humanly possible?
        // If 5 keys were pressed in less than 50ms, it's a script/bot
        if (keyTimes.length >= 5) {
            const duration = keyTimes[keyTimes.length - 1] - keyTimes[0];
            if (duration < 50) {
                logEvent("IMPOSSIBLE_TYPING", "Typing speed >1000 WPM (Bot Detected)");
                keyTimes = []; // Reset to avoid spamming the log
            }
        }
    });

    function logEvent(type, message) {
        if (!getCandidateId()) return;
        eventLog.push({
            type: type,
            message: message,
            timestamp: new Date().toISOString()
        });
    }

    // --- 4. DATA SYNC & INTERVENTION LOOP (Every 3s) ---
    setInterval(() => {
        const candidateId = getCandidateId();
        
        if (candidateId) {
            const payload = {
                candidateId: candidateId,
                events: eventLog,
                mouseActivity: mouseMovements
            };

            fetch('http://localhost:3000/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                // --- AUTOMATED INTERVENTION ---
                if (data.intervention === "WARN") {
                    // Turn screen red and show alert
                    document.body.style.backgroundColor = "#fff0f0";
                    document.body.style.border = "5px solid red";
                    // Only alert if we haven't alerted recently to avoid spam
                    if (mouseMovements > 0) { // simple check to ensure user is there
                       console.warn("HIGH RISK DETECTED");
                    }
                } else {
                    // Reset to normal
                    document.body.style.backgroundColor = ""; 
                    document.body.style.border = "none";
                }

                // Reset Local Logs
                eventLog = []; 
                mouseMovements = 0; 
            })
            .catch(err => console.error("Server disconnected", err));
        }
    }, 3000);

})();