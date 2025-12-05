// dashboard.js
const tableBody = document.querySelector("#candidateTable tbody");
const candidateDetails = document.getElementById("candidateDetails");
const exportBtn = document.getElementById("exportBtn");

let currentData = []; // Store data globally for export

function updateDashboard() {
    fetch('http://localhost:3000/api/status')
        .then(res => res.json())
        .then(data => {
            currentData = data; // Save for export
            renderTable(data);
        })
        .catch(err => console.log("Waiting for data stream..."));
}

function renderTable(candidates) {
    // Sort: Critical Risk at the top
    candidates.sort((a, b) => b.riskScore - a.riskScore);
    tableBody.innerHTML = ""; 

    candidates.forEach(student => {
        const row = document.createElement("tr");
        
        // CSS Classes for the badges
        let badgeClass = "risk-low";
        let rowClass = "";
        
        if (student.riskScore > 40) badgeClass = "risk-med";
        if (student.riskScore > 75) { 
            badgeClass = "risk-high";
            rowClass = "animate-pulse"; 
        }

        row.className = rowClass;

        row.innerHTML = `
            <td style="font-family: var(--font-code); color: #fff; letter-spacing:1px;">${student.id}</td>
            <td>
                <span class="risk-badge ${badgeClass}">
                    RISK: ${student.riskScore}%
                </span>
            </td>
            <td style="font-family: var(--font-code); color: var(--text-dim);">${student.level}</td>
            <td style="font-family: var(--font-code); font-size: 0.9rem; color: var(--text-dim);">
                ${new Date(student.lastUpdate).toLocaleTimeString()}
            </td>
        `;

        row.style.cursor = "pointer";
        row.addEventListener("click", () => showDetails(student));
        tableBody.appendChild(row);
    });
}

function showDetails(student) {
    const alerts = student.events.filter(e => e.type !== "TAB_SWITCH_IN").slice().reverse().slice(0, 8);

    let logsHtml = alerts.length === 0 
        ? `<div style="color: var(--neon-green); font-family: var(--font-code);">>> NO ANOMALIES DETECTED</div>`
        : alerts.map(e => `
            <div style="border-left: 2px solid var(--neon-red); padding-left: 10px; margin-bottom: 12px; background: rgba(255,0,0,0.05);">
                <div style="color: #fff; font-weight: 700; font-family: var(--font-code);">${e.type}</div>
                <div style="color: var(--text-dim); font-size: 0.9rem;">${e.message}</div>
                <div style="color: var(--text-dim); font-size: 0.8rem; font-family: var(--font-code); margin-top: 4px;">
                    ${new Date(e.timestamp).toLocaleTimeString()}
                </div>
            </div>
          `).join('');

    candidateDetails.innerHTML = `
        <div style="border-bottom: 1px solid var(--border-dim); padding-bottom: 15px; margin-bottom: 15px;">
            <h2 style="margin:0; font-family: var(--font-code); color: var(--neon-cyan);">${student.id}</h2>
            <div style="font-size: 0.8rem; color: var(--text-dim); font-family: var(--font-code);">DEVICE: ${student.device?.platform || "Unknown"}</div>
        </div>
        
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:20px;">
            <div style="background: rgba(0,0,0,0.3); padding:15px; text-align:center; border:1px solid var(--border-dim);">
                <div style="font-size:2rem; font-weight:700; color:${student.riskScore > 50 ? 'var(--neon-red)' : 'var(--neon-green)'}">
                    ${student.riskScore}
                </div>
                <div style="color:var(--text-dim); font-size:0.8rem; font-family: var(--font-code);">RISK INDEX</div>
            </div>
            <div style="background: rgba(0,0,0,0.3); padding:15px; text-align:center; border:1px solid var(--border-dim);">
                <div style="font-size:1.2rem; font-weight:700; color: #fff; line-height: 2rem;">
                    ${student.level}
                </div>
                <div style="color:var(--text-dim); font-size:0.8rem; font-family: var(--font-code);">STATUS</div>
            </div>
        </div>

        <h3 style="color: var(--neon-cyan); font-size: 1rem; margin-bottom: 15px;">TELEMETRY LOG</h3>
        <div style="max-height:300px; overflow-y:auto; padding-right: 5px;">
            ${logsHtml}
        </div>
    `;
}

// --- NEW: EXPORT TO CSV (EXCEL) ---
if (exportBtn) {
    exportBtn.addEventListener("click", () => {
        if (currentData.length === 0) {
            alert("No data available to export.");
            return;
        }

        // 1. Create CSV Headers
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Candidate ID,Risk Score,Level,Device Info,Last Update,Total Violations\n";

        // 2. Loop through data and format rows
        currentData.forEach(student => {
            // Count bad events
            const violations = student.events.filter(e => e.type !== "TAB_SWITCH_IN").length;
            const device = student.device ? student.device.platform : "Unknown";
            const time = new Date(student.lastUpdate).toLocaleString();
            
            // Add row
            csvContent += `${student.id},${student.riskScore},${student.level},${device},"${time}",${violations}\n`;
        });

        // 3. Trigger Download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "proctor_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

const resetBtn = document.getElementById("resetBtn");

if (resetBtn) {
    resetBtn.addEventListener("click", () => {
        if(confirm("⚠️ ARE YOU SURE? \nThis will wipe all student data and risk scores.")) {
            fetch('http://localhost:3000/api/reset', { method: 'POST' })
            .then(res => res.json())
            .then(() => {
                alert("System Reset Complete.");
                // Clear local table
                tableBody.innerHTML = "";
                candidateDetails.innerHTML = "<p style='color:var(--text-dim)'>Waiting for data...</p>";
                globalCandidateData = [];
            });
        }
    });
}

// Auto-refresh loop
setInterval(updateDashboard, 1000);