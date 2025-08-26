// 🔹 Google Sheet ID (ένα μόνο φύλλο: season 2025/2026)
const sheetID = "1hqgI3ZtPxQfSTA9y5w3jBmedTZP7sqlMGIVqm4mqZB8";
const SHEET_NAME = "season 2025/2026";

// 🔹 Array to store all data from the sheet
let rawData = [];

// 🔹 Starting bank (set to 0 for pure profit/loss tracking)
const START_BANK = 0;

// 🔹 Start year of season
const SEASON_START_YEAR = 2025;

// Parse date dd/mm → Date object
function parseDate(ddmm) {
  if (!ddmm || typeof ddmm !== 'string') return null;
  const parts = ddmm.split('/');
  if (parts.length !== 2) return null;
  const [day, month] = parts;
  if (!day || !month) return null;
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (isNaN(m) || isNaN(d)) return null;
  const y = m >= 8 ? SEASON_START_YEAR : SEASON_START_YEAR + 1; // Aug–Dec = 2025, Jan–Jul = 2026
  return new Date(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
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

    // Updated data structure to match CSV: Date, Match, Match Result, Pick, Pick Result, Odds, Parlay Odds, Parlay Result, Bank
    let lastNonEmpty = { 
      date: null, 
      match: null, 
      matchResult: null,
      pick: null, 
      pickResult: null,
      odds: null, 
      parlayOdds: null, 
      parlayResult: null,
      bank: null 
    };

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

      // Update lastNonEmpty with non-null values
      Object.keys(obj).forEach(k => {
        if (obj[k] !== null && obj[k] !== undefined && obj[k] !== '') {
          lastNonEmpty[k] = obj[k];
        }
      });

      return obj;
    }).filter(r => r.date && r.match && r.pick && r.odds);

    populateSeasonAndMonths();
    
  } catch (err) {
    console.error("Error fetching data", err);
    // Update UI to show error if elements exist
    const seasonBank = document.getElementById("seasonBank");
    const seasonParlayStats = document.getElementById("seasonParlayStats");
    const seasonPickStats = document.getElementById("seasonPickStats");
    
    if (seasonBank) seasonBank.innerText = "Bank: Error loading";
    if (seasonParlayStats) seasonParlayStats.innerText = "Parlay: Error";
    if (seasonPickStats) seasonPickStats.innerText = "Picks: Error";
  }
}

function getParlayStats(parlays) {
  let parlayWins = 0, parlayLosses = 0;
  let pickWins = 0, pickLosses = 0;
  let finalBank = START_BANK;

  // Sort parlays by date to get the chronologically last bank value
  const sortedParlays = Object.entries(parlays).sort(([keyA, parlayA], [keyB, parlayB]) => {
    const dateA = parseDate(parlayA[0].date);
    const dateB = parseDate(parlayB[0].date);
    return dateA - dateB;
  });

  sortedParlays.forEach(([key, parlay]) => {
    // Check parlay result for parlay stats
    const parlayResult = (parlay[0].parlayResult || "").toLowerCase();
    if (parlayResult === "won") parlayWins++;
    else if (parlayResult === "lost") parlayLosses++;

    // Check individual pick results for pick stats
    parlay.forEach(pick => {
      const pickResult = (pick.pickResult || "").toLowerCase();
      if (pickResult === "won") pickWins++;
      else if (pickResult === "lost") pickLosses++;
    });

    // Update final bank with the last entry of this parlay (chronologically last)
    const bankValue = Number(parlay[parlay.length - 1].bank);
    if (!isNaN(bankValue)) {
      finalBank = bankValue;
    }
  });

  return { 
    parlayWins, 
    parlayLosses, 
    pickWins, 
    pickLosses, 
    bank: finalBank 
  };
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

  // 🔹 Calculate Season totals
  let allParlays = {};
  Object.values(parlaysByMonth).forEach(monthGroup => {
    Object.values(monthGroup).forEach(dateGroup => {
      Object.values(dateGroup).forEach(parlayArr => {
        const key = parlayArr[0].date + "_" + parlayArr[0].parlayOdds;
        allParlays[key] = parlayArr;
      });
    });
  });
  
  const seasonStats = getParlayStats(allParlays);
  const currentBank = seasonStats.bank;

  // Update season button stats with new compact structure
  const bankColor = currentBank > START_BANK ? "limegreen" : (currentBank < START_BANK ? "red" : "gold");
  const seasonBank = document.getElementById("seasonBank");
  const seasonParlayStats = document.getElementById("seasonParlayStats");
  const seasonPickStats = document.getElementById("seasonPickStats");
  
  if (seasonBank) seasonBank.innerHTML = `Bank: <span style="color:${bankColor}">${currentBank.toFixed(2)}</span>`;
  if (seasonParlayStats) seasonParlayStats.innerText = `Parlay: ${seasonStats.parlayWins}W ${seasonStats.parlayLosses}L`;
  if (seasonPickStats) seasonPickStats.innerText = `Picks: ${seasonStats.pickWins}W ${seasonStats.pickLosses}L`;

  // 🔹 Calculate monthly stats with cumulative bank tracking
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
    
    // Get month's individual parlay/pick stats
    let parlayWins = 0, parlayLosses = 0;
    let pickWins = 0, pickLosses = 0;
    
    Object.values(monthParlays).forEach(parlay => {
      // Check parlay result for parlay stats
      const parlayResult = (parlay[0].parlayResult || "").toLowerCase();
      if (parlayResult === "won") parlayWins++;
      else if (parlayResult === "lost") parlayLosses++;

      // Check individual pick results for pick stats
      parlay.forEach(pick => {
        const pickResult = (pick.pickResult || "").toLowerCase();
        if (pickResult === "won") pickWins++;
        else if (pickResult === "lost") pickLosses++;
      });
    });
    
    // Find the final bank value for this month
    let finalBankForMonth = START_BANK;
    const monthDatesArray = Object.keys(parlaysByMonth[month]).sort((a, b) => parseDate(b) - parseDate(a));
    if (monthDatesArray.length > 0) {
      const latestDate = monthDatesArray[0];
      const latestDateParlays = Object.values(parlaysByMonth[month][latestDate]);
      if (latestDateParlays.length > 0) {
        const lastParlay = latestDateParlays[latestDateParlays.length - 1];
        const bankValue = Number(lastParlay[lastParlay.length - 1].bank);
        if (!isNaN(bankValue)) {
          finalBankForMonth = bankValue;
        }
      }
    }
    
    monthStatsMap[month] = {
      parlayWins,
      parlayLosses,
      pickWins,
      pickLosses,
      bank: finalBankForMonth
    };
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
        <div class="month-summary-stats">
          <span>Parlay: ${stats.parlayWins}W ${stats.parlayLosses}L</span> | 
          <span>Picks: ${stats.pickWins}W ${stats.pickLosses}L</span>
        </div>
        <div class="bank-display" style="color:${bankColor}">Bank: ${stats.bank.toFixed(2)}</div>
      `;
      seasonDropdown.appendChild(monthSummary);
    });
  }

  // 🔹 Season Button Click Event
  const seasonButton = document.getElementById("seasonButton");
  if (seasonButton) {
    const newSeasonButton = seasonButton.cloneNode(true);
    seasonButton.parentNode.replaceChild(newSeasonButton, seasonButton);
    
    newSeasonButton.addEventListener("click", () => {
      document.querySelectorAll('.parlays-dropdown').forEach(el => {
        if (el.id !== 'seasonDropdown') el.style.display = "none";
      });
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

    // Newest month first for display
    [...sortedMonths].sort((a, b) => monthDates[b] - monthDates[a]).forEach(month => {
      const stats = monthStatsMap[month];
      const bankColor = stats.bank > START_BANK ? "limegreen" : (stats.bank < START_BANK ? "red" : "gold");

      const btn = document.createElement("button");
      btn.className = "month-toggle-btn";
      btn.innerHTML = `
        <span class="month-name">${month}</span>
        <div>
          <span class="month-stats">
            <span>Parlay: ${stats.parlayWins}W ${stats.parlayLosses}L</span> | 
            <span>Picks: ${stats.pickWins}W ${stats.pickLosses}L</span>
          </span>
          <div class="bank-display" style="color:${bankColor}">Bank: ${stats.bank.toFixed(2)}</div>
        </div>
      `;

      const parlaysContainer = document.createElement("div");
      parlaysContainer.className = "parlays-dropdown";
      parlaysContainer.style.display = "none";
      parlaysContainer.style.marginTop = "5px";
      renderParlaysForMonth(parlaysByMonth[month], parlaysContainer);

      btn.addEventListener("click", () => {
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
  // Group parlays by date first
  const parlaysByDate = {};
  
  Object.keys(monthData).forEach(date => {
    if (!parlaysByDate[date]) {
      parlaysByDate[date] = [];
    }
    
    const dateGroup = monthData[date];
    Object.keys(dateGroup).forEach(parlayOdds => {
      const parlay = dateGroup[parlayOdds];
      if (parlay[0].match && parlay[0].pick && parlay[0].odds) {
        parlaysByDate[date].push(parlay);
      }
    });
  });

  // Sort dates (newest first) and render
  Object.keys(parlaysByDate)
    .sort((a, b) => parseDate(b) - parseDate(a))
    .forEach(date => {
      const jsDate = parseDate(date);
      const dateStr = jsDate ? jsDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) : "??/??";
      
      // Create date divider
      const dateDivider = document.createElement("div");
      dateDivider.className = "date-divider";
      dateDivider.textContent = dateStr;
      container.appendChild(dateDivider);
      
      // Add all parlays for this date
      parlaysByDate[date].forEach(parlay => {
        const parlayResult = (parlay[0].parlayResult || "").toLowerCase();
        
        const parlayDiv = document.createElement("div");
        parlayDiv.classList.add("parlay");
        parlayDiv.classList.add(parlayResult === "won" ? "won" : "lost");

        parlayDiv.innerHTML = `
          <div class="parlay-body">
            ${parlay.map(m => {
              const pickResult = (m.pickResult || "").toLowerCase();
              const pickClass = pickResult === "won" ? "won" : (pickResult === "lost" ? "lost" : "");
              return `
                <div class="match ${pickClass}">
                  <div class="match-info">
                    <div class="match-teams">${m.match}</div>
                    <div class="match-pick-result">
                      <span>Pick: ${m.pick} ${m.matchResult ? `(${m.matchResult})` : ''}</span>
                    </div>
                  </div>
                  <div class="match-odds">${m.odds}</div>
                </div>
              `;
            }).join('')}
          </div>
          <div class="parlay-footer">
            <span class="total-odds">Total Odds: ${parlay[0].parlayOdds || "N/A"}</span>
          </div>
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
