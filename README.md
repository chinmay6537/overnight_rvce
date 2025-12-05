ProctorSense

Security Without Surveillance.

A privacy-first, behavioral biometric proctoring system for online assessments. ProctorSense ensures academic integrity without invasive webcams or screen recording by analyzing user interaction patterns.

📖 Project Overview

The Problem:
Traditional online proctoring equates "surveillance" with "security." It relies on invasive webcams and eye-tracking, which:

Causes high anxiety for honest students.

Violates privacy regulations (GDPR/FERPA) by recording home environments.

Fails to detect modern cheating methods like GenAI (ChatGPT) copy-pasting.

Requires high bandwidth, excluding students with poor internet connections.

Explanation:
https://www.youtube.com/watch?v=DGWupjbOxfg

The Solution:

ProctorSense shifts from watching the student to analyzing the interaction. It uses a lightweight JavaScript SDK to monitor telemetry metadata—keystroke dynamics, mouse patterns, navigation events, and focus states. This data feeds into a real-time risk engine that calculates an "Integrity Risk Score," flagging suspicious behavior instantly while respecting user privacy.

✨ Key Features

🚫 Non-Intrusive Monitoring: No cameras, no microphones (unless specific audio monitoring is enabled for volume levels only), and no screen recording. 100% Privacy Preserved.

🤖 Bot & Script Detection: Analyzes Typing Speed (WPM) and keystroke flight time. If a user types at superhuman speeds (>300 WPM) or pastes large chunks of text instantly, it's flagged as a bot or script.

📉 Dynamic Risk Decay: The system is "forgiving." If a student makes a minor mistake (like looking away briefly) but returns to focus, their risk score heals (decreases) over time. This drastically reduces false positives compared to rigid rule-based systems.

🍯 The "Honeypot" Trap: Invisible text is embedded within exam questions. If a student tries to "Select All" and copy-paste the question into an AI tool, they accidentally copy the tracking code, triggering an immediate alert.

🔒 State-Based Monitoring: Continuous penalties for staying out of Full Screen or losing window focus. The longer a student is "away," the higher the risk score climbs.

⚡ Real-Time Dashboard: A live "Command Center" for proctors that auto-sorts students by risk level, providing detailed violation logs (e.g., "Tab Switch at 10:45 AM").

⚙️ System Architecture

The Spy (Client SDK):

A lightweight proctor-sdk.js file runs on the student's browser.

Listens for DOM events: visibilitychange, blur, paste, keydown, fullscreenchange.

Bundles telemetry data and sends it to the server every 3 seconds.

The Brain (Node.js Server):

Receives JSON payloads.

Applies heuristic logic:

Is WPM > 300? -> Critical Risk (+50)

Is Full Screen Active? -> No? (+5 points/3sec)

Is Honeypot Triggered? -> Critical Risk (+60)

Calculates the dynamic Risk Score (0-100) and handles the "Healing" logic.

The View (Proctor Dashboard):

Fetches real-time status from the server.

Visualizes high-risk students with a "Cyber-Security HUD" aesthetic.

Allows exporting forensic reports via CSV.

🛠️ Tech Stack

Frontend: HTML5, CSS3 (Custom Cyber-Security HUD Theme), Vanilla JavaScript.

Backend: Node.js, Express.js (REST API).

Analysis Logic: Custom Heuristic Algorithms (State-based penalties & Dynamic Decay).

Tools: VS Code, Git/GitHub.

🚀 Getting Started

Prerequisites

Node.js installed on your machine.

Installation

Clone the Repository:

git clone [https://github.com/chinmay6537/overnight_rvce.git](https://github.com/chinmay6537/overnight_rvce.git)
cd overnight_rvce


Install Dependencies:
Navigate to the server directory (if applicable, or root if package.json is there):

# If there is a server folder:
cd server
npm install
# Or if package.json is in the root:
npm install


Run the Server:

node server.js


You should see: ProctorSense Brain Active on Port 3000

Launch the Application:

Open login.html in your browser.

Student Login: Use any USN (e.g., 1RV23CS001) and password 123.

Proctor Login: Use username p and password 123.

🧪 How to Test (Demo Scenarios)

Login: Start at login.html and log in as a student.

Start Exam: Click "Begin Assessment" on the exam page. The browser will force Full Screen.

Trigger Violations:

Tab Switch: Alt+Tab to another window. Watch the risk score rise.

Exit Full Screen: Press Esc. A warning modal will block your view.

Bot Detection: Copy a large block of text and paste it into the answer box. Immediate high-risk flag.

Check Dashboard: Open login.html in a new tab/window, log in as Proctor, and view the live updates. Try the "Download Report (.CSV)" button.

🔮 Future Scope

LMS Integration: Plugins for Canvas, Moodle, and Blackboard.

Mouse Heatmaps: Visualizing "robotic" vs. "human" mouse paths to detect automated clickers.

Offline Mode: Storing violation logs locally for students with unstable internet connections and syncing upon reconnection.

Blockchain Logging: Storing exam integrity logs on an immutable ledger for dispute resolution.

<p align="center">
Built with ❤️ at the 8th Mile X Overnight Hackathon
</p>
