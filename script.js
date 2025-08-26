// Google Sheet settings
const sheetID = "1hqgI3ZtPxQfSTA9y5w3jBmedTZP7sqlMGIVqm4mqZB8";
const SHEET_NAME = "season 2025/2026";

let rawData = [];
const START_BANK = 0;
const SEASON_START_YEAR = 2025;

// Parse date dd/mm → Date object
function parseDate(ddmm) {
  if (!ddmm) return null;
  const [day, month] = ddmm.split('/');
  const y = parseInt(month) >= 8 ? SEASON_START_YEAR : SEASON_START_YEAR + 1;
  return new Date(`${y}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`);
}

async function fetchData() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?sheet=${encodeURIComponent(SHEET_NAME)}&tqx=out:json`;
    const res = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
    const rows = json.table.rows;

    let lastNonEmpty = {};
    rawData = rows.map(r => {
      const obj = {
        date: r.c[0]?.v ?? lastNonEmpty.date,
        match: r.c[1]?.v ?? lastNonEmpty.match,
        matchResult: r.c[2]?.v ?? lastNonEmpty.matchResult,
        pick: r.c[3]?.v ?? lastNonEmpty.pick,
        pickResult: r.c[4]?.v ?? lastNonEmpty.pickResult,
        odds: r.c[5]?.v ?? lastNonEmpty.odds,
        parlayOdds: r.c[6]?.v ?? lastNonEmpty.parlayOdds,
        parlayResult: r.c[7]?.v ?? lastNonEmpty.parlayResult,
        bank: r.c[8]?.v ?? lastNonEmpty.bank
      };
      Object.keys(obj).forEach(k => { if (obj[k]) lastNonEmpty[k] = obj[k]; });
      return obj;
    }).filter(r => r.date && r.match && r.pick && r.odds);

    populateSeasonAndMonths();
  } catch (err) {
    console.error("Error fetching data", err);
    document.getElementById("seasonBank").innerText = "Bank: Error";
    document.getElementById("seasonParlayStats").innerText = "Parlay: Error";
    document.getElementById("seasonPickStats").innerText = "Picks: Error";
  }
}

// === Stats Calculation ===
function getParlayStats(parlays) {
  let parlayWins=0, parlayLosses=0, pickWins=0, pickLosses=0, finalBank=START_BANK;
  Object.values(parlays).forEach(parlay => {
    if ((parlay[0].parlayResult||"").toLowerCase()==="won") parlayWins++;
    else if ((parlay[0].parlayResult||"").toLowerCase()==="lost") parlayLosses++;
    parlay.forEach(pick=>{
      if ((pick.pickResult||"").toLowerCase()==="won") pickWins++;
      else if ((pick.pickResult||"").toLowerCase()==="lost") pickLosses++;
    });
    const bankValue = Number(parlay[parlay.length-1].bank);
    if (!isNaN(bankValue)) finalBank=bankValue;
  });
  return {parlayWins,parlayLosses,pickWins,pickLosses,bank:finalBank};
}

// === Render Season + Months ===
function populateSeasonAndMonths() {
  const seasonButton = document.getElementById("seasonButton");
  const seasonDropdown = document.getElementById("seasonDropdown");
  const monthButtonsDiv = document.getElementById("monthButtons");
  const parlaysContainer = document.getElementById("parlaysContainer");

  seasonButton.onclick = () => {
    seasonDropdown.style.display = seasonDropdown.style.display === "none" ? "block" : "none";
  };

  // Group picks by date + parlay
  let parlaysByDate = {};
  rawData.forEach(r => {
    const d = parseDate(r.date);
    if (!d) return;
    const dateKey = d.toISOString().split('T')[0];
    if (!parlaysByDate[dateKey]) parlaysByDate[dateKey] = {};
    if (!parlaysByDate[dateKey][r.parlayOdds]) parlaysByDate[dateKey][r.parlayOdds] = [];
    parlaysByDate[dateKey][r.parlayOdds].push(r);
  });

  // Group by month
  let parlaysByMonth = {};
  Object.keys(parlaysByDate).forEach(dateKey => {
    const d = new Date(dateKey);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if (!parlaysByMonth[monthKey]) parlaysByMonth[monthKey] = {};
    Object.entries(parlaysByDate[dateKey]).forEach(([odds, picks]) => {
      if (!parlaysByMonth[monthKey][odds]) parlaysByMonth[monthKey][odds] = [];
      parlaysByMonth[monthKey][odds].push(...picks);
    });
  });

  // Fill season stats
  const seasonStats = getParlayStats(Object.values(parlaysByDate).flatMap(Object.values));
  document.getElementById("seasonParlayStats").innerText = `Parlay: ${seasonStats.parlayWins}W-${seasonStats.parlayLosses}L`;
  document.getElementById("seasonPickStats").innerText = `Picks: ${seasonStats.pickWins}W-${seasonStats.pickLosses}L`;
  document.getElementById("seasonBank").innerText = `Bank: ${seasonStats.bank.toFixed(2)}`;

  // Fill dropdown summary
  seasonDropdown.innerHTML = "";
  Object.keys(parlaysByMonth).sort().forEach(monthKey => {
    const stats = getParlayStats(Object.values(parlaysByMonth[monthKey]));
    const div = document.createElement("div");
    div.className = "month-summary";
    div.innerHTML = `
      <div class="month-summary-name">${monthKey}</div>
      <div class="month-summary-stats">
        Parlay: ${stats.parlayWins}W-${stats.parlayLosses}L | 
        Picks: ${stats.pickWins}W-${stats.pickLosses}L | 
        Bank: ${stats.bank.toFixed(2)}
      </div>`;
    div.onclick = () => renderParlaysForMonth(monthKey, parlaysByMonth[monthKey]);
    seasonDropdown.appendChild(div);
  });

  // Default: show latest month
  const latestMonth = Object.keys(parlaysByMonth).sort().pop();
  if (latestMonth) renderParlaysForMonth(latestMonth, parlaysByMonth[latestMonth]);
}

function renderParlaysForMonth(monthKey, parlays) {
  const parlaysContainer = document.getElementById("parlaysContainer");
  parlaysContainer.innerHTML = "";

  // Group again by date
  let parlaysByDate = {};
  Object.values(parlays).forEach(picks => {
    picks.forEach(r => {
      const d = parseDate(r.date);
      if (!d) return;
      const dateKey = d.toISOString().split('T')[0];
      if (!parlaysByDate[dateKey]) parlaysByDate[dateKey] = {};
      if (!parlaysByDate[dateKey][r.parlayOdds]) parlaysByDate[dateKey][r.parlayOdds] = [];
      parlaysByDate[dateKey][r.parlayOdds].push(r);
    });
  });

  Object.keys(parlaysByDate).sort().forEach(dateKey => {
    const dateDiv = document.createElement("div");
    dateDiv.className = "date-divider";
    dateDiv.innerText = dateKey;
    parlaysContainer.appendChild(dateDiv);

    Object.values(parlaysByDate[dateKey]).forEach(picks => {
      const parlayDiv = document.createElement("div");
      parlayDiv.className = "parlay show";
      if ((picks[0].parlayResult||"").toLowerCase() === "won") parlayDiv.classList.add("won");
      else if ((picks[0].parlayResult||"").toLowerCase() === "lost") parlayDiv.classList.add("lost");

      const body = document.createElement("div");
      body.className = "parlay-body";
      picks.forEach(p => {
        const matchDiv = document.createElement("div");
        matchDiv.className = "match";
        if ((p.pickResult||"").toLowerCase() === "won") matchDiv.classList.add("won");
        else if ((p.pickResult||"").toLowerCase() === "lost") matchDiv.classList.add("lost");
        matchDiv.innerHTML = `
          <div class="match-info">
