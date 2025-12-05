(function() {
    console.log("ProctorSense SDK Loaded");

    // DATA STORES
    let eventLog = [];
    let keyTimestamps = [];
    let isMonitoring = false; 
    let activeCandidateId = null;
    
    const SEND_INTERVAL = 3000; 
    const INTERNAL_SIG = ":::INTERNAL_SAFE:::"; // The secret "watermark"

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
            // GET ID FROM HIDDEN INPUT
            const idInput = document.getElementById("candidateId");
            const val = idInput.value || localStorage.getItem("proctor_candidate_id");
            
            if (!val) {
                alert("Session Error: ID not found. Please re-login.");
                window.location.href = "login.html";
                return;
            }

            activeCandidateId = val;
            isMonitoring = true;
            
            // Update UI
            startBtn.disabled = true;
            startBtn.innerText = "MONITORING ACTIVE";
            startBtn.style.borderColor = "#10b981";
            startBtn.style.color = "#10b981";
            
            const statusText = document.getElementById("examStatus");
            if(statusText) {
                statusText.innerText = "✅ LIVE";
                statusText.style.color = "#10b981";
            }

            enterFullScreen();
            document.addEventListener("contextmenu", event => event.preventDefault());
        });
    }

    // --- WARNING SYSTEM (UNCHANGED) ---
    function triggerWarning(riskScore, isViolation, customMessage = null) {
        if (!isMonitoring) return;

        const body = document.body;
        let warningBox = document.getElementById("ps-warning-modal");

        if (!warningBox) {
            warningBox = document.createElement("div");
            warningBox.id = "ps-warning-modal";
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
                    <h3 style="color:#ef4444; margin:0 0 10px 0; font-size:1.1rem;">⚠️ VIOLATION DETECTED</h3>
                    <p style="font-size:0.9rem; color:#cbd5e1; margin:0 0 15px 0;">${customMessage}</p>
                    <button id="returnFSBtn" style="width:100%; padding:8px; cursor:pointer; background:#ef4444; color:white; border:none; border-radius:4px; font-weight:bold;">FIX NOW</button>
                </div>
            `;
        } else if (riskScore > 50) {
             contentHTML = `
                <div style="background:#1e293b; padding:20px; border-radius:8px; border-left: 5px solid #f59e0b; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <h3 style="color:#f59e0b; margin:0 0 10px 0; font-size:1.1rem;">⚠️ HIGH RISK: ${riskScore}%</h3>
                    <p style="font-size:0.9rem; color:#cbd5e1; margin:0;">Suspicious behavior patterns detected.</p>
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
            triggerWarning(null, true, "Full Screen is required.");
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

    // --- NEW: SMART COPY/PASTE HANDLERS ---

    // 1. Intercept COPY to add Watermark
    document.addEventListener("copy", (e) => {
        if (!isMonitoring) return;
        
        // Determine what text was selected
        const target = e.target;
        let selectedText = "";

        // Get selection from Textarea/Input OR standard text
        if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") {
            selectedText = target.value.substring(target.selectionStart, target.selectionEnd);
        } else {
            selectedText = document.getSelection().toString();
        }

        if (selectedText) {
            // Append our invisible secret signature
            e.clipboardData.setData('text/plain', selectedText + INTERNAL_SIG);
            e.preventDefault(); // Prevent default to ensure our modified data is used
        }
    });

    // 2. Intercept PASTE to check for Watermark
    document.addEventListener("paste", (e) => {
        if (!isMonitoring) return;
        
        let data = (e.clipboardData || window.clipboardData).getData('text');
        
        // CHECK 1: Is this an internal copy?
        if (data.includes(INTERNAL_SIG)) {
            // YES: It has our watermark. It is safe.
            e.preventDefault(); // Prevent default paste (which would include the watermark)
            
            // Strip the watermark
            const cleanData = data.replace(INTERNAL_SIG, "");
            
            // Manually insert clean text into the cursor position
            const target = e.target;
            if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") {
                const start = target.selectionStart;
                const end = target.selectionEnd;
                target.value = target.value.substring(0, start) + cleanData + target.value.substring(end);
                // Restore cursor position
                target.selectionStart = target.selectionEnd = start + cleanData.length;
            }
            
            // Log it as safe (or don't log at all)
            console.log("Internal paste allowed."); 
            // We do NOT call logEvent here, so it won't show up as a violation.
            return;
        }

        // CHECK 2: If we are here, it is an EXTERNAL paste (No watermark)
        
        // Honeypot Check (Hidden question text)
        if (data.includes("[TRACKING_ID")) {
            logEvent("HONEYPOT_TRIGGER", "Copied hidden question code");
        }
        
        // General External Paste Flag
        logEvent("EXTERNAL_PASTE", `Pasted ${data.length} chars from external source`, data.length);
    });

    // --- TYPING BIOMETRICS ---
    document.addEventListener("keydown", (e) => {
        if (!isMonitoring) return;
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

    // --- SYNC LOOP ---
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

        fetch('/api/track', {
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
