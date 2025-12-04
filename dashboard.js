// dashboard.js
const tableBody = document.querySelector("#candidateTable tbody");
const selectedText = document.getElementById("selectedCandidate");
const candidateDetails = document.getElementById("candidateDetails");

function updateDashboard() {
    fetch('http://localhost:3000/api/status')
        .then(response => response.json())
        .then(data => {
            renderTable(data);
        })
        .catch(err => console.error("Dashboard offline"));
}

function renderTable(candidates) {
    // Sort high risk to the top
    candidates.sort((a, b) => b.riskScore - a.riskScore);

    tableBody.innerHTML = ""; 

    candidates.forEach(student => {
        const row = document.createElement("tr");
        
        let riskColor = "white"; 
        let rowBg = "";

        if(student.level === "Medium") {
            riskColor = "orange";
        }
        if(student.level === "High") {
            riskColor = "#ff4444";
            rowBg = "rgba(255, 0, 0, 0.1)"; // Highlight high risk rows
        }

        row.style.backgroundColor = rowBg;
        
        row.innerHTML = `
            <td>${student.id}</td>
            <td style="color: ${riskColor}; font-weight: bold; font-size: 1.1em;">${student.riskScore}%</td>
            <td>${student.level}</td>
            <td>${new Date(student.lastUpdate).toLocaleTimeString()}</td>
        `;

        row.addEventListener("click", () => showDetails(student));
        tableBody.appendChild(row);
    });
}

function showDetails(student) {
    selectedText.innerHTML = `Analyzing: <span style="color:#2563eb">${student.id}</span>`;
    
    // Reverse events to show newest first
    const recentEvents = student.events.slice().reverse().slice(0, 8); 

    let eventHtml = recentEvents.map(e => {
        let color = "#9ca3af";
        if(e.type.includes("TAB")) color = "orange";
        if(e.type.includes("IMPOSSIBLE")) color = "red";
        
        return `<li style="color:${color}; margin-bottom:5px;">
            <small>[${new Date(e.timestamp).toLocaleTimeString()}]</small><br>
            <strong>${e.type}</strong>: ${e.message}
        </li>`;
    }).join('');

    candidateDetails.innerHTML = `
        <div style="background:#1e293b; padding:15px; border-radius:8px;">
            <h3>Risk Score: ${student.riskScore} / 100</h3>
            <p>Risk Level: <strong>${student.level}</strong></p>
            <hr style="border-color:#334155">
            <h4>Live Event Log:</h4>
            <ul style="list-style:none; padding:0;">
                ${eventHtml || "<li>No suspicious events yet.</li>"}
            </ul>
        </div>
    `;
}

// Refresh every 1 second for "Real-Time" feel
setInterval(updateDashboard, 1000);
updateDashboard();