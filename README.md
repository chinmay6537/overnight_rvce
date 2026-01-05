# 🚨 ProctorSense: Security Without Surveillance. 👁️‍🗨️
### The Ultimate Privacy-First, Behavioral Biometric Proctoring System.

***

## 🛑 The Surveillance Crisis
Traditional online proctoring is a flawed security relic. It equates **security with surveillance**, demanding invasive webcams, screen recording, and eye-tracking that actively harm the learning experience.

* **🚫 Privacy Nightmare:** It records students' private homes, violating critical regulations like **GDPR/FERPA** and causing extreme anxiety for honest users.
* **🐢 Legacy Tech:** High bandwidth requirements **exclude** students with poor internet connections.
* **🤖 Cheaters Win:** These systems are easily bypassed and **fail to detect modern cheating** methods, such as students seamlessly copy-pasting from Generative AI tools (like ChatGPT).<br>
<br>
[VERCEL APP](https://final-sandy-ten-54.vercel.app/)<br><br>
[DEMO OF THE PRODUCT](https://youtu.be/xQcMhTcj7Kw) <br> <br>
[Explanation of the problem](https://www.youtube.com/watch?v=DGWupjbOxfg) <br> <br>
[Full Project Details (PDF/PPT)](https://drive.google.com/file/d/16z3H8QLCtSx3DB5VZa19uETmWrvrmgL7/view?usp=sharing)

***

## ✨ The ProctorSense Revolution
We don't watch the student; **we analyze the interaction**. ProctorSense shifts the focus from invasive filming to **behavioral biometrics**. A lightweight **JavaScript SDK** silently monitors telemetry metadata—keystroke rhythm, mouse patterns, navigation events, and window focus states.

This data feeds a real-time risk engine that instantly calculates an **"Integrity Risk Score,"** flagging suspicious activity *without* ever compromising user privacy.

***

## 🔎 Key Features: The Next-Gen Security Arsenal

### 🛡️ 100% Privacy Preserved
* **ZERO Intrusiveness:** **No cameras, no screen recording, no microphones** (unless a feature is specifically enabled just to measure volume levels). We monitor behavior, not bodies.

### 🤖 Instant Bot & Script Detection
* Our system analyzes **Typing Speed (WPM)** and keystroke flight time. If a user types at a **superhuman speed (WPM > 300)** or instantly pastes large chunks of text, it’s flagged as a bot, script, or immediate breach.

### 📉 Dynamic Risk Decay: The Forgiving Engine
* Unlike rigid, rule-based systems that trigger false alarms, ProctorSense is **"forgiving."** If a student briefly makes a minor mistake (like looking away) but quickly returns to focus, their risk score automatically **"heals" (decreases)** over time. This drastically reduces false positives.

### 🍯 The "Honeypot" Trap
* We embed **invisible tracking text** within the exam questions. If a student tries to "Select All" and copy-paste the question into an external AI tool, they unknowingly copy the hidden code, triggering an **immediate critical alert**.

### 🔒 State-Based Monitoring
* Risk is cumulative. We apply **continuous penalties** for exiting Full Screen mode or losing window focus. The longer a student is "away" or out of compliance, the higher their risk score climbs.

### ⚡ Real-Time "Command Center" Dashboard
* Proctors get a live dashboard that auto-sorts students by their **Risk Level (0-100)**. It provides forensic, time-stamped logs (e.g., **"Tab Switch at 10:45 AM"**) and allows easy export of forensic reports via CSV.

***

## ⚙️ The Blueprint: System Architecture

| Component | Role | Mechanics |
| :--- | :--- | :--- |
| **The Spy** (Client SDK) | The browser-side listener. | A lightweight `proctor-sdk.js` file monitors DOM events: `visibilitychange`, `blur`, `paste`, `keydown`, `fullscreenchange`. It bundles telemetry and sends a JSON payload to the server every **3 seconds**. |
| **The Brain** (Node.js Server) | The real-time risk evaluator. | Receives payloads and applies **custom heuristic logic**: Checks if WPM > 300 (Critical Risk: +50), checks Full Screen state (+5 points/3sec penalty), and checks for Honeypot activation (Critical Risk: +60). It calculates the dynamic Risk Score and handles the **"Healing" logic**. |
| **The View** (Proctor Dashboard) | The visualization hub. | Fetches live status from the server and visualizes high-risk students with a **"Cyber-Security HUD" aesthetic**. |

### 🛠️ Tech Stack
* **Frontend:** HTML5, CSS3 (**Custom Cyber-Security HUD Theme**), **Vanilla JavaScript**.
* **Backend:** **Node.js, Express.js** (REST API).
* **Analysis Logic:** Custom Heuristic Algorithms (State-based penalties & Dynamic Decay).
* **Tools:** VS Code, Git/GitHub.

***

## 🚀 Mission Control: Getting Started & Demo

### Prerequisites
* Node.js installed on your machine.

### Installation & Launch
1.  **Clone the Repository:** `git clone https://github.com/chinmay6537/overnight_rvce.git`
2.  **Install Dependencies:** `cd overnight_rvce` (or `cd overnight_rvce/server` if a server folder exists) then run `npm install`.
3.  **Run the Server:** `node server.js`
    * *You should see:* **ProctorSense Brain Active on Port 3000**
4.  **Launch:** Open `index.html` in your browser.

### 🧪 Demo Scenarios (Trigger the Violations)
Use the following credentials to test:
* **Student Login:** Any USN (e.g., `1RV23CS001`) / Password: `123`
* **Proctor Login:** Username: `p` / Password: `123`

1.  **Start Exam:** Log in as the student and click "Begin Assessment." The browser will **force Full Screen**.
2.  **Trigger Tab Switch:** Press **Alt+Tab** to leave the window. Watch the risk score **climb**.
3.  **Trigger Exit Full Screen:** Press **Esc**. A warning modal will block the view.
4.  **Trigger Bot Detection:** Copy a large block of text and **paste** it into the answer box. An **immediate high-risk flag** will be generated.
5.  **Check Dashboard:** Log in as the Proctor in a separate tab/window to view the **live updates** and test the **"Download Report (.CSV)"** button.

***

## 🔮 Future Warfare: The Road Ahead
* **LMS Integration:** Developing official plugins for major platforms like **Canvas, Moodle, and Blackboard**.
* **Mouse Heatmaps:** Visualizing "robotic" vs. "human" mouse paths to detect automated clicker scripts.
* **Offline Mode:** Storing violation logs locally for students with unstable internet connections, with a sync upon reconnection.
* **Blockchain Logging:** Storing exam integrity logs on an **immutable ledger** for indisputable audit trails and dispute resolution.

***
A project by <br>
Chinmay S <br>
Koushaik Sannapanneni <br>
Chalasani Chandra Sriyanth <br>

Built with ❤️ at the 8th Mile X Overnight Hackathon.
***
