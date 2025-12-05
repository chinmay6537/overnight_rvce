(function() {
    console.log("ProctorSense SDK Loaded");

    let eventLog = [];
    let keyTimestamps = [];
    let isMonitoring = false; 
    let activeCandidateId = null;
    
    const SEND_INTERVAL = 3000; 

    const startBtn = document.getElementById("startMonitoringBtn");
    
    function enterFullScreen() {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => console.log(err));
        } else if (elem.webkitRequestFullscreen) { 
            elem.webkitRequestFullscreen();
        }
    }

    if (startBtn) {
        startBtn.addEventListener("click", () => {
            const idInput = document.getElementById("candidateId");
            const val = idInput.value.trim();
            if (val.length < 3) {
                // Try getting from localStorage if empty
                const stored = localStorage.getItem("proctor_candidate_id");
                if(stored) activeCandidateId = stored;
                else {
                    alert("Please enter a valid Candidate ID.");
                    return;
                }
            } else {
                activeCandidateId = val;
            }

            isMonitoring = true;
            startBtn.disabled = true;
            startBtn.innerText = "EXAM IN PROGRESS";
            
            const statusText = document.getElementById("examStatus");
            if(statusText) {
                statusText.innerText = "✅ MONITORING ACTIVE";
                statusText.style.color = "#10b981";
            }

            enterFullScreen();
            document.addEventListener("contextmenu", event => event.preventDefault());
        });
    }

    // --- WARNING SYSTEM ---
    function triggerWarning(riskScore, isViolation, customMessage = null) {
        if (!isMonitoring) return;

        const body = document.body;
        let warningBox = document.getElementById("ps-warning-modal");

        if (!warningBox) {
            warningBox = document.createElement("div");
            warningBox.id = "ps-warning-modal";
            // Non-intrusive Top Right Notification
            warningBox.style.cssText = `
                display: none; position: fixed; top: 20px; right: 20px; width: 320px;
                z-index: 10000; font-family: sans-serif;
            `;
            document.body.appendChild(warningBox);
        }

        let contentHTML = "";
        
        if (customMessage) {
             contentHTML = `
                <div style="background:#1e293b; padding:20px; border-radius:8px; border-left: 5px solid #ef4444; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <h3 style="color:#ef4444; margin:0 0 10px 0; font-size:1.1rem;">⚠️ VIOLATION</h3>
                    <p style="font-size:0.9rem; color:#cbd5e1; margin:0 0 15px 0;">${customMessage}</p>
                    <button id="returnFSBtn" style="width:100%; padding:8px; cursor:pointer; background:#ef4444; color:white; border:none; border-radius:4px;">FIX NOW</button>
                </div>
            `;
        } else if (riskScore > 50) {
             contentHTML = `
                <div style="background:#1e293b; padding:20px; border-radius:8px; border-left: 5px solid #f59e0b; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <h3 style="color:#f59e0b; margin:0 0 10px 0; font-size:1.1rem;">⚠️ RISK LEVEL: ${riskScore}%</h3>
                    <p style="font-size:0.9rem; color:#cbd5e1; margin:0;">Suspicious activity detected.</p>
                </div>
            `;
        }

        if (contentHTML) {
            warningBox.innerHTML = contentHTML;
            warningBox.style.display = "block";
            const btn = document.getElementById("returnFSBtn");
            if (btn) btn.onclick = enterFullScreen;
        } else if (riskScore < 20) {
            warningBox.style.display = "none";
        }
    }

    // --- SENSORS ---

    document.addEventListener("fullscreenchange", () => {
        if (!isMonitoring) return;
        if (!document.fullscreenElement) {
            logEvent("FULL_SCREEN_EXIT", "Exited full screen");
            triggerWarning(null, true, "Full Screen Required.");
        } else {
            const box = document.getElementById("ps-warning-modal");
            if(box) box.style.display = "none";
        }
    });

    document.addEventListener("visibilitychange", () => {
        if (!isMonitoring) return;
        if (document.hidden) {
            logEvent("TAB_SWITCH_OUT", "Switched tab");
        }
    });

    window.addEventListener("blur", () => {
        if (!isMonitoring) return;
        logEvent("FOCUS_LOST", "User clicked outside browser");
    });

    document.addEventListener("paste", (e) => {
        if (!isMonitoring) return;
        let data = (e.clipboardData || window.clipboardData).getData('text');
        
        if (data.includes("[TRACKING_ID")) {
            logEvent("HONEYPOT_TRIGGER", "Copied hidden question code");
        }
        logEvent("PASTE", `Pasted ${data.length} chars`, data.length);
    });

    document.addEventListener("keydown", (e) => {
        if (!isMonitoring) return;
        
        // FIX: Ignore holding down a key (repeating)
        if (e.repeat) return; 

        const now = Date.now();
        keyTimestamps.push(now);
        keyTimestamps = keyTimestamps.filter(t => now - t < 60000);
        
        const recent = keyTimestamps.slice(-5);
        if (recent.length === 5 && (recent[4] - recent[0] < 50)) {
            logEvent("IMPOSSIBLE_TYPING", "Bot detected");
            keyTimestamps = [];
        }
    });

    function getWPM() { return Math.round((keyTimestamps.length / 5)); }

    function getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            screenRes: `${window.screen.width}x${window.screen.height}`,
            platform: navigator.platform
        };
    }

    function logEvent(type, message, length = 0) {
        if (!isMonitoring) return;
        eventLog.push({ type, message, length, timestamp: Date.now() });
    }

    // --- LOOP ---
    setInterval(() => {
        if (!isMonitoring || !activeCandidateId) return;

        const isFullScreen = !!document.fullscreenElement;
        const isFocused = document.hasFocus();

        if (!isFullScreen) {
            triggerWarning(null, true, "Full Screen Required.");
        } else if (!isFocused) {
            triggerWarning(null, true, "Click inside the exam window!");
        }

        const payload = {
            candidateId: activeCandidateId,
            events: eventLog,
            metrics: { wpm: getWPM() },
            deviceInfo: getDeviceInfo(),
            status: {
                isFullScreen: isFullScreen,
                isFocused: isFocused
            }
        };

        fetch('http://localhost:3000/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (isFullScreen && isFocused) {
                triggerWarning(data.riskScore, data.violation);
            }
            eventLog = []; 
        })
        .catch(err => console.log("Offline"));

    }, SEND_INTERVAL);

})();