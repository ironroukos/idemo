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

  // Group ανά μήνα και parlay
  data.forEach(row => {
    const date = row["Date"] || "";
    const result = row["Parlay Result"] || "";
    const bank = parseFloat(row["Bank"] || "0") || 0;

    // Season stats
    if (result.toLowerCase() === "won") seasonStats.wins++;
    if (result.toLowerCase() === "lost") seasonStats.losses++;
    seasonStats.bank = bank; // πάντα κρατάει το τελευταίο bank

    // Μήνας (date format dd/mm/yyyy)
    const [d, m, y] = date.split("/");
    const monthKey = `${y}-${m}`;
    if (!months[monthKey]) months[monthKey] = [];
    months[monthKey].push(row);
  });

  // Update season button
  document.getElementById("seasonWins").textContent = `Wins: ${seasonStats.wins}`;
  document.getElementById("seasonLosses").textContent = `Losses: ${seasonStats.losses}`;
  document.getElementById("seasonBank").textContent = `Bank: ${seasonStats.bank}`;

  // Season dropdown με summary ανά μήνα
  const dropdown = document.getElementById("seasonDropdown");
  dropdown.innerHTML = "";
  Object.keys(months).forEach(mKey => {
    const parlays = groupByParlay(months[mKey]);
    const wins = parlays.filter(p => p.parlayResult === "won").length;
    const losses = parlays.filter(p => p.parlayResult === "lost").length;
    const lastBank = parlays.length ? parlays[parlays.length - 1].bank : "-";

    const div = document.createElement("div");
    div.className = "month-summary";
    div.innerHTML = `
      <span class="month-summary-name">${mKey}</span>
      <span class="month-summary-stats">W: ${wins} | L: ${losses} | Bank: ${lastBank}</span>
    `;
    dropdown.appendChild(div);
  });

  // Month buttons
  const monthButtons = document.getElementById("monthButtons");
  monthButtons.innerHTML = "";
  Object.keys(months).forEach(mKey => {
    const parlays = groupByParlay(months[mKey]);
    const btn = document.createElement("button");
    btn.className = "month-toggle-btn";
    btn.innerHTML = `
      <span class="month-name">${mKey}</span>
      <span class="month-stats">Parlays: ${parlays.length}</span>
    `;
    btn.addEventListener("click", () => renderParlays(parlays, mKey));
    monthButtons.appendChild(btn);
  });
}

// Ομαδοποίηση γραμμών σε parlays (ανά ημερομηνία)
function groupByParlay(rows) {
  const parlays = {};
  rows.forEach(r => {
    const key = r["Date"];
    if (!parlays[key]) {
      parlays[key] = {
        date: r["Date"],
        matches: [],
        parlayOdds: r["Parlay Odds"],
        parlayResult: r["Parlay Result"]?.toLowerCase(),
        bank: r["Bank"]
      };
    }
    parlays[key].matches.push({
      match: r["Match"],
      matchResult: r["Match Result"],
      pick: r["Pick"],
      pickResult: r["Pick Result"],
      odds: r["Odds"]
    });
  });
  return Object.values(parlays);
}

// Εμφάνιση parlays ενός μήνα
function renderParlays(parlays, monthKey) {
  const container = document.getElementById("parlaysContainer");
  container.innerHTML = `<div class="date-divider">${monthKey}</div>`;

  parlays.forEach(p => {
    const div = document.createElement("div");
    div.className = `parlay ${p.parlayResult}`;
    div.innerHTML = `
      <div class="parlay-meta">
        <span class="parlay-date">${p.date}</span>
        <span class="total-odds">Total Odds: ${p.parlayOdds}</span>
        <span class="parlay-result">${p.parlayResult}</span>
      </div>
      ${p.matches.map(m => `
        <div class="match">
          <div class="match-info">
            <div class="match-name">${m.match}</div>
            <div class="match-details">
              <span class="match-result">${m.matchResult}</span>
              <span class="prediction">Pick: ${m.pick}</span>
              <span class="prediction-result ${m.pickResult.toLowerCase()}">${m.pickResult}</span>
              <span class="odds">${m.odds}</span>
            </div>
          </div>
        </div>
      `).join("")}
    `;
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
