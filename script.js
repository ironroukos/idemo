// 🔹 Google Sheet ID (ένα μόνο φύλλο: season 2025/2026)
const sheetID = "1hqgI3ZtPxQfSTA9y5w3jBmedTZP7sqlMGIVqm4mqZB8";
const SHEET_NAME = "season 2025/2026";

let rawData = [];

// Starting bank
const START_BANK = 500;

// Start year of season
const SEASON_START_YEAR = 2025;

// Parse CSV function
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  const data = [];
  
  debug(`CSV has ${lines.length} lines with headers: ${headers.join(', ')}`);
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',');
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index] ? values[index].trim() : '';
      });
      data.push(row);
    }
  }
  
  debug(`Parsed ${data.length} data rows`);
  return data;
}

// Parse date dd/mm → Date object
function parseDate(ddmm) {
  if (!ddmm) return null;
  const [day, month] = ddmm.split('/');
  if (!day || !month) return null;
  const m = parseInt(month, 10);
  const y = m >= 8 ? SEASON_START_YEAR : SEASON_START_YEAR + 1; // Aug–Dec = 2025, Jan–Jul = 2026
  return new Date(`${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
}

// Load and process data
function loadData() {
  try {
    debug('Starting to load CSV data...');
    
    const parsedData = parseCSV(csvData);
    
    // Process the data similar to your original code
    let lastNonEmpty = { 
      Date: null, 
      Match: null, 
      'Match Result': null, 
      Pick: null, 
      'Pick Result': null, 
      Odds: null, 
      'Parlay Odds': null, 
      'Parlay Result': null, 
      Bank: null 
    };
    
    rawData = parsedData.map(row => {
      const obj = {
        date: row['Date'] || lastNonEmpty.Date,
        match: row['Match'] || lastNonEmpty.Match,
        matchResult: row['Match Result'] || lastNonEmpty['Match Result'],
        prediction: row['Pick'] || lastNonEmpty.Pick,
        predictionResult: row['Pick Result'] || lastNonEmpty['Pick Result'],
        odds: row['Odds'] || lastNonEmpty.Odds,
        parlayOdds: row['Parlay Odds'] || lastNonEmpty['Parlay Odds'],
        parlayResult: row['Parlay Result'] || lastNonEmpty['Parlay Result'],
        bank: row['Bank'] || lastNonEmpty.Bank
      };
      
      // Update lastNonEmpty with non-empty values
      Object.keys(obj).forEach(k => {
        const originalKey = k === 'date' ? 'Date' : 
                           k === 'match' ? 'Match' :
                           k === 'matchResult' ? 'Match Result' :
                           k === 'prediction' ? 'Pick' :
                           k === 'predictionResult' ? 'Pick Result' :
                           k === 'odds' ? 'Odds' :
                           k === 'parlayOdds' ? 'Parlay Odds' :
                           k === 'parlayResult' ? 'Parlay Result' :
                           k === 'bank' ? 'Bank' : k;
                           
        if (obj[k] !== null && obj[k] !== undefined && obj[k] !== '') {
          lastNonEmpty[originalKey] = obj[k];
        }
      });
      
      return obj;
    }).filter(r => r.date && r.match && r.prediction && r.odds);

    debug(`Filtered data: ${rawData.length} valid rows`);
    
    populateSeasonAndMonths();
    
  } catch (err) {
    debug(`Error loading data: ${err.message}`);
    console.error("Error loading data", err);
    
    // Update UI to show error
    const seasonBank = document.getElementById("seasonBank");
    const seasonWins = document.getElementById("seasonWins");
    const seasonLosses = document.getElementById("seasonLosses");
    
    if (seasonBank) seasonBank.innerText = "Bank: Error loading";
    if (seasonWins) seasonWins.innerText = "Wins: Error loading";
    if (seasonLosses) seasonLosses.innerText = "Losses: Error loading";
    
    // Show error message
    const container = document.getElementById("monthButtons");
    if (container) {
      container.innerHTML = '<div class="error-message">Failed to load betting data. Check console for details.</div>';
    }
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
      currentBank = START_BANK;
      const latestBankValue = Math.max(...Object.values(parlays)
        .map(p => Number(p[0].bank) || START_BANK));
      currentBank = latestBankValue;
    }
  });
  
  const profit = currentBank - START_BANK;
  return { wins, losses, profit, bank: currentBank };
}

function populateSeasonAndMonths() {
  debug('Populating season and months...');
  
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

  debug(`Grouped into months: ${Object.keys(parlaysByMonth).join(', ')}`);

  // Calculate Season totals using the latest bank value
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

  const currentBank = latestBank;
  
  // Count actual wins/losses
  let seasonWins = 0, seasonLosses = 0;
  Object.values(allParlays).forEach(parlay => {
    const result = (parlay[0].parlayResult || "").toLowerCase();
    if (result === "won") seasonWins++;
    else if (result === "lost") seasonLosses++;
  });

  debug(`Season stats - Wins: ${seasonWins}, Losses: ${seasonLosses}, Bank: ${currentBank}`);

  // Update season button stats
  const bankColor = currentBank > START_BANK ? "limegreen" : (currentBank < START_BANK ? "red" : "gold");
  const seasonBankEl = document.getElementById("seasonBank");
  const seasonWinsEl = document.getElementById("seasonWins");
  const seasonLossesEl = document.getElementById("seasonLosses");
  
  if (seasonBankEl) seasonBankEl.innerHTML = `Bank: <span style="color:${bankColor}">${currentBank.toFixed(2)}</span>`;
  if (seasonWinsEl) seasonWinsEl.innerText = `Wins: ${seasonWins}`;
  if (seasonLossesEl) seasonLossesEl.innerText = `Losses: ${seasonLosses}`;

  // Calculate monthly stats with proper bank tracking
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
    
    monthStatsMap[month] = { wins: monthWins, losses: monthLosses, profit: monthEndBank - START_BANK, bank: monthEndBank };
  });

  // Populate Season Dropdown with Monthly Summaries
  const seasonDropdown = document.getElementById("seasonDropdown");
  if (seasonDropdown) {
    seasonDropdown.innerHTML = "";
    
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

  // Season Button Click Event
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

  // Month Buttons
  const container = document.getElementById("monthButtons");
  if (container) {
    container.innerHTML = "";

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
// ==========================
//  Auto-refresh every 60s
// ==========================
fetchData();
setInterval(fetchData, 60000);
