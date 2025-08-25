// 🔹 Google Sheet ID (ένα μόνο φύλλο: season 2025/2026)
const sheetID = "1hqgI3ZtPxQfSTA9y5w3jBmedTZP7sqlMGIVqm4mqZB8";
const SHEET_NAME = "season 2025/2026";

// 🔹 Array to store all data from the sheet
let rawData = [];

// 🔹 Starting bank
const START_BANK = 500;

// 🔹 Start year of season
const SEASON_START_YEAR = 2025;

// Parse date dd/mm → Date object
function parseDate(ddmm) {
  if (!ddmm) return null;
  const [day, month] = ddmm.split('/');
  if (!day || !month) return null;
  const m = parseInt(month, 10);
  const y = m >= 8 ? SEASON_START_YEAR : SEASON_START_YEAR + 1; // Aug–Dec = 2025, Jan–Jul = 2026
  return new Date(`${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
}

async function fetchData() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?sheet=${encodeURIComponent(SHEET_NAME)}&tqx=out:json`;
    const res = await fetch(url);
    
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
    const rows = json.table.rows;

    let lastNonEmpty = { date: null, match: null, prediction: null, odds: null, parlayOdds: null, result: null, profit: null };
    rawData = rows.map(r => {
      const obj = {
        date: r.c[0]?.v ?? lastNonEmpty.date,
        match: r.c[1]?.v ?? lastNonEmpty.match,
        prediction: r.c[2]?.v ?? lastNonEmpty.prediction,
        odds: r.c[3]?.v ?? lastNonEmpty.odds,
        parlayOdds: r.c[4]?.v ?? lastNonEmpty.parlayOdds,
        result: r.c[5]?.v ?? lastNonEmpty.result,
        profit: r.c[6]?.v ?? lastNonEmpty.profit
      };
      Object.keys(obj).forEach(k => {
        if (obj[k] !== null && obj[k] !== undefined) lastNonEmpty[k] = obj[k];
      });
      return obj;
    }).filter(r => r.date && r.match && r.prediction && r.odds);

    populateSeasonAndMonths();
    
  } catch (err) {
    console.error("Error fetching data", err);
    const seasonBank = document.getElementById("seasonBank");
    const seasonWins = document.getElementById("seasonWins");
    const seasonLosses = document.getElementById("seasonLosses");
    
    if (seasonBank) seasonBank.innerText = "Bank: Error loading";
    if (seasonWins) seasonWins.innerText = "Wins: Error loading";
    if (seasonLosses) seasonLosses.innerText = "Losses: Error loading";
  }
}

// ==========================
// Stats Calculation
// ==========================
function getPickStats(data) {
  let wins = 0, losses = 0;
  data.forEach(p => {
    const r = (p.result || "").toLowerCase();
    if (r === "profit") wins++;
    else if (r === "loss") losses++;
  });
  return { wins, losses };
}

function getParlayStats(parlays) {
  let wins = 0, losses = 0, profit = 0;
  Object.values(parlays).forEach(parlay => {
    const r = (parlay[0].result || "").toLowerCase();
    if (r === "profit") wins++;
    else if (r === "loss") losses++;
    profit += Number(parlay[0].profit) || 0;
  });
  return { wins, losses, profit };
}

// ==========================
// Populate Season & Months
// ==========================
function populateSeasonAndMonths() {
  const parlaysByMonth = {};
  const monthDates = {};

  rawData.forEach(item => {
    const jsDate = parseDate(item.date);
    if (!jsDate) return;
    const month = jsDate.toLocaleString('default', { month: 'long' });
    if (!parlaysByMonth[month]) parlaysByMonth[month] = {};
    if (!parlaysByMonth[month][item.date]) parlaysByMonth[month][item.date] = {};
    if (!parlaysByMonth[month][item.date][item.parlayOdds]) parlaysByMonth[month][item.date][item.parlayOdds] = [];
    parlaysByMonth[month][item.date][item.parlayOdds].push(item);

    if (!monthDates[month] || jsDate > monthDates[month]) monthDates[month] = jsDate;
  });

  // 🔹 Season totals
  let allParlays = {};
  rawData.forEach(item => {
    const key = item.date + "_" + item.parlayOdds;
    if (!allParlays[key]) allParlays[key] = [];
    allParlays[key].push(item);
  });

  const seasonParlayStats = getParlayStats(allParlays);
  const seasonPickStats = getPickStats(rawData);
  const currentBank = START_BANK + seasonParlayStats.profit;

  // Update season stats
  const bankColor = currentBank > START_BANK ? "limegreen" : (currentBank < START_BANK ? "red" : "gold");
  const seasonBank = document.getElementById("seasonBank");
  const seasonWins = document.getElementById("seasonWins");
  const seasonLosses = document.getElementById("seasonLosses");
  
  if (seasonBank) seasonBank.innerHTML = `Bank: <span style="color:${bankColor}">${currentBank.toFixed(2)}</span>`;
  if (seasonWins) seasonWins.innerHTML = `Parlays Wins: ${seasonParlayStats.wins} | Picks Wins: ${seasonPickStats.wins}`;
  if (seasonLosses) seasonLosses.innerHTML = `Parlays Losses: ${seasonParlayStats.losses} | Picks Losses: ${seasonPickStats.losses}`;

  // 🔹 Bank carry-over per month
  let runningBank = START_BANK;
  const sortedMonths = Object.keys(parlaysByMonth).sort((a,b)=> monthDates[a]-monthDates[b]);
  const monthStatsMap = {};
  sortedMonths.forEach(month => {
    let monthParlays = {};
    Object.values(parlaysByMonth[month]).forEach(dateGroup => {
      Object.values(dateGroup).forEach(parlayArr => {
        const key = parlayArr[0].date + "_" + parlayArr[0].parlayOdds;
        monthParlays[key] = parlayArr;
      });
    });
    const stats = getParlayStats(monthParlays);
    runningBank += stats.profit;
    monthStatsMap[month] = { ...stats, bank: runningBank };
  });

  // 🔹 Populate Month Buttons & Dropdowns
  const container = document.getElementById("monthButtons");
  if (container) {
    container.innerHTML = "";
    [...sortedMonths].sort((a,b)=> monthDates[b]-monthDates[a]).forEach(month=>{
      const stats = monthStatsMap[month];
      const bankColor = stats.bank>START_BANK?"limegreen":(stats.bank<START_BANK?"red":"gold");
      const btn = document.createElement("button");
      btn.className = "month-toggle-btn";
      btn.innerHTML = `
        <span class="month-name">${month}</span>
        <span class="month-stats">
          Wins: ${stats.wins} | Losses: ${stats.losses} | 
          Bank: <span style="color:${bankColor}">${stats.bank.toFixed(2)}</span>
        </span>
      `;
      const parlaysContainer = document.createElement("div");
      parlaysContainer.className = "parlays-dropdown";
      parlaysContainer.style.display="none";
      parlaysContainer.style.marginTop="5px";

      renderParlaysForMonth(parlaysByMonth[month], parlaysContainer);

      btn.addEventListener("click", ()=>{
        document.querySelectorAll('.parlays-dropdown').forEach(el=>{if(el!==parlaysContainer)el.style.display="none";});
        parlaysContainer.style.display = parlaysContainer.style.display==="none"?"block":"none";
      });

      container.appendChild(btn);
      container.appendChild(parlaysContainer);
    });
  }
}

// ==========================
// Render Parlays
// ==========================
function renderParlaysForMonth(monthData, container) {
  Object.keys(monthData)
    .sort((a,b)=> parseDate(b)-parseDate(a)) // newest dates first
    .forEach(date=>{
      const dateDivider = document.createElement("div");
      dateDivider.className="date-divider";
      dateDivider.innerText = date;
      container.appendChild(dateDivider);

      const dateGroup = monthData[date];
      Object.keys(dateGroup).forEach(parlayOdds=>{
        const parlay = dateGroup[parlayOdds];
        const parlayDiv = document.createElement("div");
        parlayDiv.className="parlay-card";
        const totalOdds = parlayOdds || "N/A";
        const resultClass = (parlay[0].result||"").toLowerCase() === "profit"?"won":"lost";

        parlayDiv.innerHTML = parlay.map(match=>{
          const matchResult = match.matchResult || "?";
          return `
            <div class="match ${((match.result||"").toLowerCase()==="profit")?"won":"lost"}">
              <div>${match.match} (${matchResult})</div>
              <div>Prediction: ${match.prediction} (${match.odds})</div>
              <div>Result: ${match.result || "?"}</div>
            </div>
          `;
        }).join('') + `
          <div class="parlay-summary ${resultClass}">
            <span>Total Odds: ${totalOdds}</span>
            <span>Result: ${parlay[0].result || "?"}</span>
          </div>
        `;

        container.appendChild(parlayDiv);
        setTimeout(()=>parlayDiv.classList.add("show"),50);
      });
    });
}

// ==========================
// Auto-refresh every 60s
// ==========================
fetchData();
setInterval(fetchData,60000);
