// 🔹 Your Google Sheet ID
const sheetID = "1hqgI3ZtPxQfSTA9y5w3jBmedTZP7sqlMGIVqm4mqZB8";

// 🔹 Array to store all data from the sheet
let rawData = [];

// Helper to parse "DD/MM" to a valid JS Date object (uses 2025 as year, update as needed)
function parseDate(ddmm) {
  if (!ddmm) return null;
  const [day, month] = ddmm.split('/');
  if (!day || !month) return null;
  // Use current year or allow setting in spreadsheet
  return new Date(`2025-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
}

// ==========================
// 1️⃣ Fetch data from Google Sheets
// ==========================
async function fetchData() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;
    const res = await fetch(url);
    const text = await res.text();

    // Parse JSON wrapped by Google
    const json = JSON.parse(text.substring(47).slice(0, -2));
    const rows = json.table.rows;

    // Map rows to structured objects, filling merged cells
    let lastNonEmpty = {
      date: null, match: null, prediction: null, odds: null, parlayOdds: null, result: null, profit: null
    };
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
      // Update lastNonEmpty if values are present
      Object.keys(obj).forEach(k => {
        if (obj[k] !== null && obj[k] !== undefined) lastNonEmpty[k] = obj[k];
      });
      return obj;
    }).filter(r =>
      r.date && r.match && r.prediction && r.odds // skip empty/invalid rows
    );

    populateMonths();         // Month buttons with stats & dropdowns
  } catch (err) {
    console.error("Error fetching data", err);
  }
}

// ==========================
// 2️⃣ Generate month buttons with stats & dropdown functionality
// ==========================
function populateMonths() {
  const monthMap = {};
  const parlaysByMonth = {};

  rawData.forEach(item => {
    const jsDate = parseDate(item.date);
    if (!jsDate) return;
    const month = jsDate.toLocaleString('default', { month: 'long' });

    // Stats
    if (!monthMap[month]) monthMap[month] = { wins: 0, losses: 0, profit: 0 };
    if ((item.result || "").toLowerCase() === "profit") monthMap[month].wins++;
    else if ((item.result || "").toLowerCase() === "loss") monthMap[month].losses++;
    monthMap[month].profit += Number(item.profit) || 0;

    // Group parlays by month
    if (!parlaysByMonth[month]) parlaysByMonth[month] = [];
    parlaysByMonth[month].push(item);
  });

  const container = document.getElementById("monthButtons");
  container.innerHTML = "";

  Object.keys(monthMap).forEach(month => {
    const stats = monthMap[month];

    // Month button
    const btn = document.createElement("button");
    btn.className = "month-toggle-btn";
    btn.innerHTML = `
      <span class="month-name" style="float:left;">${month}</span>
      <span class="month-stats" style="float:right;">
        Wins: ${stats.wins} | 
        Losses: ${stats.losses} | 
        Profit: <span style="color:${stats.profit>=0?'limegreen':'red'}">${stats.profit}</span>
      </span>
      <span style="clear:both"></span>
    `;
    btn.style.margin = "10px 0";
    btn.style.width = "100%";
    btn.style.backgroundColor = "black";
    btn.style.color = "white";
    btn.style.border = "2px solid limegreen";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";
    btn.style.whiteSpace = "nowrap";
    btn.style.textAlign = "left";
    btn.style.position = "relative";
    btn.style.fontSize = "1.2em";
    btn.style.padding = "10px 15px";

    // Parlay cards container (hidden by default)
    const parlaysContainer = document.createElement("div");
    parlaysContainer.className = "parlays-dropdown";
    parlaysContainer.style.display = "none";
    parlaysContainer.style.marginTop = "5px";

    // Fill in parlay cards for this month
    renderParlaysForMonth(parlaysByMonth[month], parlaysContainer);

    // Toggle dropdown
    btn.addEventListener("click", () => {
      // Optional: close other dropdowns
      document.querySelectorAll('.parlays-dropdown').forEach(el => {
        if (el !== parlaysContainer) el.style.display = "none";
      });
      parlaysContainer.style.display = parlaysContainer.style.display === "none" ? "block" : "none";
    });

    container.appendChild(btn);
    container.appendChild(parlaysContainer);
  });
}

// ==========================
// 3️⃣ Render parlays for a month (dropdown)
// ==========================
function renderParlaysForMonth(monthData, container) {
  // Group by date and parlayOdds
  const grouped = {};
  monthData.forEach(item => {
    if (!item.date) return;
    const date = item.date;
    if (!grouped[date]) grouped[date] = {};
    if (!grouped[date][item.parlayOdds]) grouped[date][item.parlayOdds] = [];
    grouped[date][item.parlayOdds].push(item);
  });

  Object.keys(grouped).sort().forEach(date => {
    // Only render if there are valid matches in this date group
    const hasValidMatches = Object.values(grouped[date]).some(parlay =>
      parlay.some(m => m.match && m.prediction && m.odds)
    );
    if (!hasValidMatches) return;

    const jsDate = parseDate(date);
    const dateHeader = document.createElement("div");
    dateHeader.classList.add("parlay-date");
    dateHeader.textContent = jsDate ? jsDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) : "Invalid Date";
    container.appendChild(dateHeader);

    Object.keys(grouped[date]).forEach(parlayOdds => {
      const parlay = grouped[date][parlayOdds];
      const result = (parlay[0].result || "").toLowerCase();

      // Skip rendering "parlay" with no match/prediction/odds
      if (!parlay[0].match || !parlay[0].prediction || !parlay[0].odds) return;

      const parlayDiv = document.createElement("div");
      parlayDiv.classList.add("parlay");
      parlayDiv.classList.add(result === "profit" ? "won" : "lost");

      parlayDiv.innerHTML = `
        <div class="total-odds">Total Odds: ${parlayOdds || "N/A"}</div>
        ${parlay.map(m => `
          <div class="match">
            <span>${m.match} (${m.prediction})</span>
            <span>${m.odds}</span>
          </div>
        `).join('')}
      `;

      container.appendChild(parlayDiv);

      setTimeout(() => parlayDiv.classList.add("show"), 50);
    });
  });
}

// ==========================
// 4️⃣ Auto-refresh every 60s
// ==========================
fetchData();
setInterval(fetchData, 60000);
