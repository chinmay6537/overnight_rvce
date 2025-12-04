// proctor-sdk.js
(function() {
    console.log("ProctorSense SDK Loaded");

    let eventLog = [];
    let keyTimestamps = [];
    let isMonitoring = false;
    let activeCandidateId = null;
    
    // CONFIG
    const SEND_INTERVAL = 3000; 

    // --- 1. START & DEVICE FINGERPRINT ---
    const startBtn = document.getElementById("startMonitoringBtn");
    const idInput = document.getElementById("candidateId");
    const statusText = document.getElementById("examStatus");

    function getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            screenRes: `${window.screen.width}x${window.screen.height}`,
            platform: navigator.platform
        };
    }

    if (startBtn) {
        startBtn.addEventListener("click", () => {
            const val = idInput.value.trim();
            if (val.length < 3) {
                alert("Please enter a valid Candidate ID.");
                return;
            }
            activeCandidateId = val;
            isMonitoring = true;
            idInput.disabled = true;
            startBtn.disabled = true;
            startBtn.innerText = "EXAM IN PROGRESS";
            
            statusText.innerText = "✅ MONITORING ACTIVE";
            statusText.style.color = "var(--neon-green)";
            
            // --- NEW: TRIGGER FULL SCREEN ---
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(err => {
                    console.log("Full screen denied:", err.message);
                });
            }

            // Disable Right Click
            document.addEventListener("contextmenu", event => event.preventDefault());
        });
    }

    // --- 2. VISUAL WARNING SYSTEM ---
    function triggerWarning(riskScore, isViolation) {
        if (!isMonitoring) return;
        const body = document.body;
        let warningBox = document.getElementById("ps-warning-modal");

        if (!warningBox) {
            warningBox = document.createElement("div");
            warningBox.id = "ps-warning-modal";
            // FUTURISTIC STYLE
            warningBox.style.cssText = `
                display: none; position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                background: #000; padding: 20px 30px; 
                border: 1px solid #ff2a2a; border-left: 5px solid #ff2a2a;
                box-shadow: 0 0 20px rgba(255, 42, 42, 0.4); 
                z-index: 9999; font-family: 'Share Tech Mono', monospace; color: #fff;
                text-align: center;
            `;
            document.body.appendChild(warningBox);
        }

        if (isViolation || riskScore > 50) {
            body.style.transition = "background-color 0.2s";
            body.style.backgroundColor = "rgba(255, 0, 0, 0.1)"; 
            setTimeout(() => body.style.backgroundColor = "", 500); 

            warningBox.style.display = "block";
            warningBox.innerHTML = `
                <h3 style="margin:0; color:#ff2a2a;">⚠️ INTEGRITY ALERT</h3>
                <p style="margin:5px 0;">Suspicious behavior detected. Risk: <b>${riskScore}%</b></p>
                <small>RETURN TO FOCUS IMMEDIATELY</small>
            `;
        } else if (riskScore < 20) {
            warningBox.style.display = "none";
        }
    }

    // --- 3. SENSORS ---

    // A. Tab Switch
    document.addEventListener("visibilitychange", () => {
        if (!isMonitoring) return;
        if (document.hidden) logEvent("TAB_SWITCH_OUT", "User left window");
        else logEvent("TAB_SWITCH_IN", "User returned");
    });

    // B. Copy/Paste
    document.addEventListener("paste", (e) => {
        if (!isMonitoring) return;
        let pasteData = (e.clipboardData || window.clipboardData).getData('text');
        logEvent("PASTE", `Pasted ${pasteData.length} chars`, pasteData.length);
    });

    // C. Right Click Blocker
    document.addEventListener("contextmenu", (e) => {
        if (!isMonitoring) return;
        e.preventDefault(); 
        logEvent("RIGHT_CLICK_ATTEMPT", "User tried to right-click");
    });

    // D. WPM & Bot Detection
    document.addEventListener("keydown", (e) => {
        if (!isMonitoring) return;
        const now = Date.now();
        keyTimestamps.push(now);
        keyTimestamps = keyTimestamps.filter(t => now - t < 60000);
        
        const recentKeys = keyTimestamps.slice(-5);
        if (recentKeys.length === 5 && (recentKeys[4] - recentKeys[0] < 50)) {
            logEvent("IMPOSSIBLE_TYPING", "Bot speed detected");
            keyTimestamps = []; 
        }
    });

    function getWPM() { return Math.round((keyTimestamps.length / 5)); }

    function logEvent(type, message, length = 0) {
        if (!isMonitoring) return;
        eventLog.push({ type, message, length, timestamp: Date.now() });
    }

    // --- 4. SYNC LOOP ---
    setInterval(() => {
        if (!isMonitoring || !activeCandidateId) return;

        // Offline Support
        const offlineData = JSON.parse(localStorage.getItem("offlineEvents") || "[]");
        const allEvents = [...offlineData, ...eventLog];
        
        // Don't send empty packets if WPM is 0
        if (allEvents.length === 0 && getWPM() === 0) return; 

        const payload = {
            candidateId: activeCandidateId,
            events: allEvents,
            metrics: { wpm: getWPM() },
            deviceInfo: getDeviceInfo()
        };

        fetch('http://localhost:3000/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            triggerWarning(data.riskScore, data.violation);
            eventLog = [];
            localStorage.removeItem("offlineEvents");
        })
        .catch(err => {
            console.warn("Offline! Saving events locally...");
            const existing = JSON.parse(localStorage.getItem("offlineEvents") || "[]");
            localStorage.setItem("offlineEvents", JSON.stringify([...existing, ...eventLog]));
            eventLog = []; 
        });

    }, SEND_INTERVAL);

})();