// 🔹 Your Google Sheet ID
const sheetID = "1hqgI3ZtPxQfSTA9y5w3jBmedTZP7sqlMGIVqm4mqZB8";

// 🔹 Google Sheets JSON endpoint
const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;

// 🔹 Array to store all data from the sheet
let rawData = [];

// ==========================
// 1️⃣ Fetch data from Google Sheets
// ==========================
async function fetchData() {
  try {
    const res = await fetch(url);           // Fetch JSON from Sheets
    const text = await res.text();
    // Google wraps JSON in extra characters, so strip first 47 chars and last 2 chars
    const json = JSON.parse(text.substring(47).slice(0, -2)); 
    const rows = json.table.rows;           // Rows contain the actual data (row 2 onwards)

    // ==========================
    // 2️⃣ Map each row to structured object
    // ==========================
    rawData = rows.map(r => ({
      date: r.c[0]?.v,       // Column A → Date
      match: r.c[1]?.v,      // Column B → Match
      prediction: r.c[2]?.v, // Column C → Prediction
      odds: r.c[3]?.v,       // Column D → Match Odds
      parlayOdds: r.c[4]?.v, // Column E → Total Parlay Odds
      result: r.c[5]?.v,     // Column F → Win/Loss
      profit: r.c[6]?.v      // Column G → Profit/Loss for this parlay
    }));

    populateMonths();         // Generate month buttons with stats
    renderParlays("all");     // Show all parlays initially
  } catch (err) {
    console.error("Error fetching data", err);
  }
}

// ==========================
// 3️⃣ Generate month buttons with stats
// ==========================
function populateMonths() {
  const monthMap = {}; // Object to store stats per month

  // Calculate Wins/Losses/Profit for each month
  rawData.forEach(item => {
    const month = new Date(item.date).toLocaleString('default', { month: 'long' });
    if (!monthMap[month]) monthMap[month] = { wins: 0, losses: 0, profit: 0 };

    if (item.result.toLowerCase() === "win") monthMap[month].wins++;
    else monthMap[month].losses++;

    monthMap[month].profit += Number(item.profit);
  });

  const container = document.getElementById("monthButtons");
  container.innerHTML = ""; // Clear old buttons

  // Create a button for each month with stats inline
  Object.keys(monthMap).forEach(month => {
    const stats = monthMap[month];
    const btn = document.createElement("button");
    btn.innerHTML = `
      ${month} 
      <span style="margin-left:10px;">
        Wins: ${stats.wins} | 
        Losses: ${stats.losses} | 
        Profit: <span style="color:${stats.profit>=0?'limegreen':'red'}">${stats.profit}</span>
      </span>
    `;

    // Basic button styling
    btn.style.margin = "5px";
    btn.style.padding = "10px 15px";
    btn.style.backgroundColor = "black";
    btn.style.color = "white";
    btn.style.border = "2px solid limegreen";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";
    btn.style.whiteSpace = "nowrap";

    // Click event → show parlays for this month
    btn.addEventListener("click", () => renderParlays(month));
    container.appendChild(btn);
  });

  // Optional "All" button to show every month
  const allBtn = document.createElement("button");
  allBtn.textContent = "All";
  allBtn.style.margin = "5px";
  allBtn.style.padding = "10px 15px";
  allBtn.style.backgroundColor = "black";
  allBtn.style.color = "white";
  allBtn.style.border = "2px solid limegreen";
  allBtn.style.borderRadius = "5px";
  allBtn.style.cursor = "pointer";
  allBtn.addEventListener("click", () => renderParlays("all"));
  container.appendChild(allBtn);
}

// ==========================
// 4️⃣ Render parlays for a selected month
// ==========================
function renderParlays(monthFilter = "all") {
  // Filter data by selected month (or show all)
  let filteredData = rawData;
  if (monthFilter !== "all") {
    filteredData = rawData.filter(item => 
      new Date(item.date).toLocaleString('default', { month: 'long' }) === monthFilter
    );
  }

  const container = document.getElementById("parlaysContainer");
  container.innerHTML = ""; // Clear previous parlays

  // ==========================
  // Group data by date → parlay odds
  // ==========================
  const grouped = {};
  filteredData.forEach(item => {
    const date = item.date;
    if (!grouped[date]) grouped[date] = {};
    if (!grouped[date][item.parlayOdds]) grouped[date][item.parlayOdds] = [];
    grouped[date][item.parlayOdds].push(item);
  });

  // ==========================
  // Render grouped parlays
  // ==========================
  Object.keys(grouped).sort().forEach(date => {
    // Date header (displayed once per day)
    const dateHeader = document.createElement("div");
    dateHeader.classList.add("parlay-date");
    dateHeader.textContent = date;
    container.appendChild(dateHeader);

    // Render each parlay for this date
    Object.keys(grouped[date]).forEach(parlayOdds => {
      const parlay = grouped[date][parlayOdds];
      const result = parlay[0].result.toLowerCase();

      const parlayDiv = document.createElement("div");
      parlayDiv.classList.add("parlay");
      parlayDiv.classList.add(result === "win" ? "won" : "lost");

      // Matches and total odds
      parlayDiv.innerHTML = `
        <div class="total-odds">Total Odds: ${parlayOdds}</div>
        ${parlay.map(m => `
          <div class="match">
            <span>${m.match} (${m.prediction})</span>
            <span>${m.odds}</span>
          </div>
        `).join('')}
      `;

      container.appendChild(parlayDiv);

      // Trigger fade-in animation
      setTimeout(() => parlayDiv.classList.add("show"), 50);
    });
  });
}

// ==========================
// 5️⃣ Auto-refresh every 60 seconds
// ==========================
fetchData();                  // Initial load
setInterval(fetchData, 60000); // Refresh automatically
