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
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
    const rows = json.table.rows;

    let lastNonEmpty = { date: null, match: null, matchResult: null, prediction: null, predictionResult: null, odds: null, parlayOdds: null, parlayResult: null, bank: null };
    rawData = rows.map(r => {
      const obj = {
        date: r.c[0]?.v ?? lastNonEmpty.date,
        match: r.c[1]?.v ?? lastNonEmpty.match,
        matchResult: r.c[2]?.v ?? lastNonEmpty.matchResult,
        prediction: r.c[3]?.v ?? lastNonEmpty.prediction,
        predictionResult: r.c[4]?.v ?? lastNonEmpty.predictionResult,
        odds: r.c[5]?.v ?? lastNonEmpty.odds,
        parlayOdds: r.c[6]?.v ?? lastNonEmpty.parlayOdds,
        parlayResult: r.c[7]?.v ?? lastNonEmpty.parlayResult,
        bank: r.c[8]?.v ?? lastNonEmpty.bank
      };
      Object.keys(obj).forEach(k => {
        if (obj[k] !== null && obj[k] !== undefined) lastNonEmpty[k] = obj[k];
      });
      return obj;
    }).filter(r => r.date && r.match && r.prediction && r.odds);

    populateSeasonAndMonths();
    
  } catch (err) {
    console.error("Error fetching data", err);
    // Update UI to show error if elements exist
    const seasonBank = document.getElementById("seasonBank");
    const seasonWins = document.getElementById("seasonWins");
    const seasonLosses = document.getElementById("seasonLosses");
    
    if (seasonBank) seasonBank.innerText = "Bank: Error loading";
    if (seasonWins) seasonWins.innerText = "Wins: Error loading";
    if (seasonLosses) seasonLosses.innerText = "Losses: Error loading";
  }
}

function getParlayStats(parlays) {
  let wins = 0, losses = 0;
  let currentBank = START_BANK;
  
  Object.values(parlays).forEach(parlay => {
    const result = (parlay[0].parlayResult || "").toLowerCase();
    if (result === "won") wins++;
    else if (result === "lost") losses++;
    
    // Get the bank change from the parlay
    const bankChange = Number(parlay[0].bank) || 0;
    if (bankChange !== 0) {
      currentBank = START_BANK; // Reset and use the bank value from sheet
      // Find the latest bank value in chronological order
      const latestBankValue = Math.max(...Object.values(parlays)
        .map(p => Number(p[0].bank) || START_BANK));
      currentBank = latestBankValue;
    }
  });
  
  const profit = currentBank - START_BANK;
  return { wins, losses, profit, bank: currentBank };
}

function populateSeasonAndMonths() {
  const parlaysByMonth = {};
  const monthDates = {};

  // Group data by month, date, parlayOdds
  rawData.forEach(item => {
    const jsDate = parseDate(item.date);
    if (!jsDate) return;
    const month = jsDate.toLocaleString('default', { month: 'long' });
    if (!parlaysByMonth[month]) parlaysByMonth[month] = {};
    if (!parlaysByMonth[month][item.date]) parlaysByMonth[month][item.date] = {};
    if (!parlaysByMonth[month][item.date][item.parlayOdds]) parlaysByMonth[month][item.date][item.parlayOdds] = [];
    parlaysByMonth[month][item.date][item.parlayOdds].push(item);

    if (!monthDates[month] || jsDate > monthDates[month]) {
      monthDates[month] = jsDate;
    }
  });

  // 🔹 Calculate Season totals using the latest bank value
  let allParlays = {};
  Object.values(parlaysByMonth).forEach(monthGroup => {
    Object.values(monthGroup).forEach(dateGroup => {
      Object.values(dateGroup).forEach(parlayArr => {
        const key = parlayArr[0].date + "_" + parlayArr[0].parlayOdds;
        allParlays[key] = parlayArr;
      });
    });
  });

  // Get the latest bank value from all parlays
  let latestBank = START_BANK;
  let latestDate = null;
  
  Object.values(allParlays).forEach(parlay => {
    const parlayDate = parseDate(parlay[0].date);
    const bankValue = Number(parlay[0].bank);
    
    if (bankValue && (!latestDate || parlayDate > latestDate)) {
      latestDate = parlayDate;
      latestBank = bankValue;
    }
  });

  const seasonStats = getParlayStats(allParlays);
  const currentBank = latestBank;
  const totalProfit = currentBank - START_BANK;

  // Count actual wins/losses
  let seasonWins = 0, seasonLosses = 0;
  Object.values(allParlays).forEach(parlay => {
    const result = (parlay[0].parlayResult || "").toLowerCase();
    if (result === "won") seasonWins++;
    else if (result === "lost") seasonLosses++;
  });

  // Update season button stats
  const bankColor = currentBank > START_BANK ? "limegreen" : (currentBank < START_BANK ? "red" : "gold");
  const seasonBank = document.getElementById("seasonBank");
  const seasonWins = document.getElementById("seasonWins");
  const seasonLosses = document.getElementById("seasonLosses");
  
  if (seasonBank) seasonBank.innerHTML = `Bank: <span style="color:${bankColor}">${currentBank.toFixed(2)}</span>`;
  if (seasonWins) seasonWins.innerText = `Wins: ${seasonWins}`;
  if (seasonLosses) seasonLosses.innerText = `Losses: ${seasonLosses}`;

  // 🔹 Calculate monthly stats with proper bank tracking
  const sortedMonths = Object.keys(parlaysByMonth).sort((a, b) => monthDates[a] - monthDates[b]);
  const monthStatsMap = {};
  
  sortedMonths.forEach(month => {
    let monthParlays = {};
    Object.values(parlaysByMonth[month]).forEach(dateGroup => {
      Object.values(dateGroup).forEach(parlayArr => {
        const key = parlayArr[0].date + "_" + parlayArr[0].parlayOdds;
        monthParlays[key] = parlayArr;
      });
    });
    
    let monthWins = 0, monthLosses = 0;
    let monthEndBank = START_BANK;
    
    // Get the latest bank value for this month
    let latestMonthDate = null;
    Object.values(monthParlays).forEach(parlay => {
      const result = (parlay[0].parlayResult || "").toLowerCase();
      if (result === "won") monthWins++;
      else if (result === "lost") monthLosses++;
      
      const parlayDate = parseDate(parlay[0].date);
      const bankValue = Number(parlay[0].bank);
      
      if (bankValue && (!latestMonthDate || parlayDate >= latestMonthDate)) {
        latestMonthDate = parlayDate;
        monthEndBank = bankValue;
      }
    });
    
    const monthProfit = monthEndBank - START_BANK;
    monthStatsMap[month] = { wins: monthWins, losses: monthLosses, profit: monthProfit, bank: monthEndBank };
  });

  // 🔹 Populate Season Dropdown with Monthly Summaries
  const seasonDropdown = document.getElementById("seasonDropdown");
  if (seasonDropdown) {
    seasonDropdown.innerHTML = "";
    
    // Show months in chronological order (oldest first) in the dropdown
    sortedMonths.forEach(month => {
      const stats = monthStatsMap[month];
      const bankColor = stats.bank > START_BANK ? "limegreen" : (stats.bank < START_BANK ? "red" : "gold");
      
      const monthSummary = document.createElement("div");
      monthSummary.className = "month-summary";
      monthSummary.innerHTML = `
        <span class="month-summary-name">${month}</span>
        <span class="month-summary-stats">
          W: ${stats.wins} | L: ${stats.losses} | 
          Bank: <span style="color:${bankColor}">${stats.bank.toFixed(2)}</span>
        </span>
      `;
      seasonDropdown.appendChild(monthSummary);
    });
  }

  // 🔹 Season Button Click Event (remove existing event listeners first)
  const seasonButton = document.getElementById("seasonButton");
  if (seasonButton) {
    // Clone the button to remove all existing event listeners
    const newSeasonButton = seasonButton.cloneNode(true);
    seasonButton.parentNode.replaceChild(newSeasonButton, seasonButton);
    
    // Add the click event listener
    newSeasonButton.addEventListener("click", () => {
      // Close all month dropdowns first
      document.querySelectorAll('.parlays-dropdown').forEach(el => {
        if (el.id !== 'seasonDropdown') el.style.display = "none";
      });
      // Toggle season dropdown
      const dropdown = document.getElementById("seasonDropdown");
      if (dropdown) {
        dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
      }
    });
  }

  // 🔹 Month Buttons
  const container = document.getElementById("monthButtons");
  if (container) {
    container.innerHTML = "";

    // Newest month first για εμφάνιση
    [...sortedMonths].sort((a, b) => monthDates[b] - monthDates[a]).forEach(month => {
      const stats = monthStatsMap[month];
      const bankColor = stats.bank > START_BANK ? "limegreen" : (stats.bank < START_BANK ? "red" : "gold");

      const btn = document.createElement("button");
      btn.className = "month-toggle-btn";
      btn.innerHTML = `
        <span class="month-name">${month}</span>
        <span class="month-stats">
          Wins: ${stats.wins} | 
          Losses: ${stats.losses} | 
          Bank: <span style="color:${bankColor}">${stats.bank.toFixed(2)}</span>
        </span>
      `;

      const parlaysContainer = document.createElement("div");
      parlaysContainer.className = "parlays-dropdown";
      parlaysContainer.style.display = "none";
      parlaysContainer.style.marginTop = "5px";
      renderParlaysForMonth(parlaysByMonth[month], parlaysContainer);

      btn.addEventListener("click", () => {
        // Close season dropdown when opening month
        const seasonDropdown = document.getElementById("seasonDropdown");
        if (seasonDropdown) seasonDropdown.style.display = "none";
        
        document.querySelectorAll('.parlays-dropdown').forEach(el => {
          if (el !== parlaysContainer && el.id !== 'seasonDropdown') el.style.display = "none";
        });
        parlaysContainer.style.display = parlaysContainer.style.display === "none" ? "block" : "none";
      });

      container.appendChild(btn);
      container.appendChild(parlaysContainer);
    });
  }
}

function renderParlaysForMonth(monthData, container) {
  Object.keys(monthData)
    .sort((a, b) => parseDate(b) - parseDate(a)) // νεότερες ημερομηνίες πρώτα
    .forEach(date => {
      const jsDate = parseDate(date);
      const dateStr = jsDate ? jsDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) : "??/??";

      // 🔹 Δημιουργούμε ένα date header πριν τις κάρτες της μέρας
      const dateHeader = document.createElement("div");
      dateHeader.className = "date-divider";
      dateHeader.innerText = dateStr;
      container.appendChild(dateHeader);

      const dateGroup = monthData[date];
      Object.keys(dateGroup).forEach(parlayOdds => {
        const parlay = dateGroup[parlayOdds];
        const result = (parlay[0].parlayResult || "").toLowerCase();

        const parlayDiv = document.createElement("div");
        parlayDiv.classList.add("parlay");
        parlayDiv.classList.add(result === "won" ? "won" : "lost");

        // Show match result in addition to prediction
        parlayDiv.innerHTML = `
          <div class="parlay-meta">
            <span class="total-odds">Total Odds: ${parlayOdds || "N/A"}</span>
            <span class="parlay-result">Result: ${parlay[0].parlayResult || "N/A"}</span>
          </div>
          ${parlay.map(m => `
            <div class="match">
              <div class="match-info">
                <div class="match-name">${m.match}</div>
                <div class="match-details">
                  <span class="prediction">${m.prediction}</span>
                  <span class="match-result">(${m.matchResult || "N/A"})</span>
                  <span class="prediction-result ${(m.predictionResult || "").toLowerCase()}">${m.predictionResult || "N/A"}</span>
                </div>
              </div>
              <span class="odds">${m.odds}</span>
            </div>
          `).join('')}
        `;

        container.appendChild(parlayDiv);
        setTimeout(() => parlayDiv.classList.add("show"), 50);
      });
    });
}

// ==========================
//  Auto-refresh every 60s
// ==========================
fetchData();
setInterval(fetchData, 60000);
