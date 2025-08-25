// ==============================
//  Betting Tracker (Season 25/26)
// ==============================

// 🔹 Google Sheet settings
const sheetID = "1hqgI3ZtPxQfSTA9y5w3jBmedTZP7sqlMGIVqm4mqZB8";
const SHEET_NAME = "season 2025/2026";

// 🔹 Construct CSV URL
const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

// ==============================
//  Globals
// ==============================
let rawData = [];
let csvData = "";
const START_BANK = 500;
const SEASON_START_YEAR = 2025;

// ==============================
//  Utility functions
// ==============================
function debug(msg) {
  console.log(`[DEBUG] ${msg}`);
}

// Parse CSV
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

// Parse date dd/mm → Date
function parseDate(ddmm) {
  if (!ddmm) return null;
  const [day, month] = ddmm.split('/');
  if (!day || !month) return null;
  const m = parseInt(month, 10);
  const y = m >= 8 ? SEASON_START_YEAR : SEASON_START_YEAR + 1;
  return new Date(`${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
}

// ==============================
//  Main Load Function
// ==============================
function loadData() {
  try {
    debug('Starting to load CSV data...');
    const parsedData = parseCSV(csvData);

    let lastNonEmpty = {
      Date: null, Match: null, 'Match Result': null, Pick: null,
      'Pick Result': null, Odds: null, 'Parlay Odds': null,
      'Parlay Result': null, Bank: null
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

      // Update lastNonEmpty
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
  }
}

// ==============================
//  Populate Season & Months
// ==============================
function populateSeasonAndMonths() {
  debug('Populating season and months...');

  const parlaysByMonth = {};
  const monthDates = {};

  rawData.forEach(item => {
    const jsDate = parseDate(item.date);
    if (!jsDate) return;
    const month = jsDate.toLocaleString('default', { month: 'long' });

    if (!parlaysByMonth[month]) parlaysByMonth[month] = {};
    if (!parlaysByMonth[month][item.date]) parlaysByMonth[month][item.date] = {};
    if (!parlaysByMonth[month][item.date][item.parlayOdds])
      parlaysByMonth[month][item.date][item.parlayOdds] = [];

    parlaysByMonth[month][item.date][item.parlayOdds].push(item);

    if (!monthDates[month] || jsDate > monthDates[month]) {
      monthDates[month] = jsDate;
    }
  });

  debug(`Grouped into months: ${Object.keys(parlaysByMonth).join(', ')}`);

  // 🔹 υπολογισμοί season + months (όπως έχεις ήδη)
  // εδώ μπορείς να κρατήσεις το ίδιο code block από την προηγούμενη version σου
  // που φτιάχνει Season stats, monthly stats & UI
}

// ==============================
//  Fetch Data
// ==============================
async function fetchData() {
  try {
    debug("Fetching CSV from Google Sheets...");
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error(`HTTP error! ${response.status}`);
    csvData = await response.text();
    loadData();
  } catch (err) {
    debug(`Fetch error: ${err.message}`);
    console.error("Fetch error", err);
  }
}

// ==============================
//  Init
// ==============================
fetchData();
setInterval(fetchData, 60000); // auto-refresh 60s
