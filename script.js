// === CONFIG ===
const sheetID = "1hqgI3ZtPxQfSTA9y5w3jBmedTZP7sqlMGIVqm4mqZB8";  
const SHEET_NAME = "season 2025/2026";
const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

let csvData = "";

// Debug helper
function debug(msg) {
  const consoleDiv = document.getElementById("debugConsole");
  if (consoleDiv) {
    consoleDiv.style.display = "block";
    consoleDiv.textContent += msg + "\n";
  }
  console.log(msg);
}

// Fetch CSV από Google Sheets
async function fetchData() {
  try {
    debug("Fetching CSV...");
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    csvData = text;
    loadData();
  } catch (err) {
    debug("Fetch error: " + err.message);
  }
}

// Parse CSV σε array
function parseCSV(str) {
  const rows = str.trim().split("\n").map(r => r.split(","));
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ? row[i].trim() : "";
    });
    return obj;
  });
}

// === LOAD DATA ===
function loadData() {
  if (!csvData) return;

  const data = parseCSV(csvData);

  const seasonStats = { wins: 0, losses: 0, bank: 0 };
  const months = {};

  data.forEach(row => {
    const date = row.Date || "";
    const result = row.Result || "";
    const profit = parseFloat(row.Profit || "0") || 0;

    // Στατιστικά Season
    if (result.toLowerCase() === "won") seasonStats.wins++;
    if (result.toLowerCase() === "lost") seasonStats.losses++;
    seasonStats.bank += profit;

    // Group ανά μήνα
    const [d, m, y] = date.split("/"); // Format dd/mm/yyyy
    const monthKey = `${y}-${m}`;
    if (!months[monthKey]) {
      months[monthKey] = { parlays: [], wins: 0, losses: 0, bank: 0 };
    }
    months[monthKey].parlays.push(row);
    if (result.toLowerCase() === "won") months[monthKey].wins++;
    if (result.toLowerCase() === "lost") months[monthKey].losses++;
    months[monthKey].bank += profit;
  });

  // Ενημέρωση Season Button
  document.getElementById("seasonWins").textContent = `Wins: ${seasonStats.wins}`;
  document.getElementById("seasonLosses").textContent = `Losses: ${seasonStats.losses}`;
  document.getElementById("seasonBank").textContent = `Bank: ${seasonStats.bank.toFixed(2)}`;

  // Εμφάνιση μηνιαίων στα Season Dropdown
  const dropdown = document.getElementById("seasonDropdown");
  dropdown.innerHTML = "";
  Object.keys(months).forEach(mKey => {
    const m = months[mKey];
    const div = document.createElement("div");
    div.className = "month-summary";
    div.innerHTML = `
      <span class="month-summary-name">${mKey}</span>
      <span class="month-summary-stats">Wins: ${m.wins} | Losses: ${m.losses} | Bank: ${m.bank.toFixed(2)}</span>
    `;
    dropdown.appendChild(div);
  });

  // Εμφάνιση κουμπιών μηνών
  const monthButtons = document.getElementById("monthButtons");
  monthButtons.innerHTML = "";
  Object.keys(months).forEach(mKey => {
    const btn = document.createElement("button");
    btn.className = "month-toggle-btn";
    btn.innerHTML = `
      <span class="month-name">${mKey}</span>
      <span class="month-stats">Wins: ${months[mKey].wins} | Losses: ${months[mKey].losses} | Bank: ${months[mKey].bank.toFixed(2)}</span>
    `;
    btn.addEventListener("click", () => toggleMonth(mKey, months[mKey].parlays));
    monthButtons.appendChild(btn);
  });
}

// Εμφάνιση Parlays ενός μήνα
function toggleMonth(monthKey, parlays) {
  const container = document.getElementById("parlaysContainer");
  container.innerHTML = `<div class="date-divider">${monthKey}</div>`;
  parlays.forEach(p => {
    const div = document.createElement("div");
    div.className = `parlay ${p.Result.toLowerCase()}`;
    div.innerHTML = `
      <div class="parlay-meta">
        <span class="parlay-date">${p.Date}</span>
        <span class="total-odds">Odds: ${p.Odds}</span>
        <span class="parlay-result">${p.Result}</span>
      </div>
      <div class="match">
        <div class="match-info">
          <div class="match-name">${p.Match}</div>
          <div class="match-details">
            <span class="prediction">${p.Prediction}</span>
            <span class="match-result">${p.Result}</span>
            <span class="prediction-result ${p.Result.toLowerCase()}">${p.Result}</span>
            <span class="odds">${p.Odds}</span>
          </div>
        </div>
      </div>
    `;
    div.classList.add("show");
    container.appendChild(div);
  });
}

// Toggle season dropdown
document.getElementById("seasonButton").addEventListener("click", () => {
  const dropdown = document.getElementById("seasonDropdown");
  dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
});

// Start
fetchData();
setInterval(fetchData, 60000); // Refresh κάθε 1 λεπτό
