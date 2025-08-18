// 🔹 Your Google Sheet ID
const sheetID = "1hqgI3ZtPxQfSTA9y5w3jBmedTZP7sqlMGIVqm4mqZB8";

// 🔹 Array to store all data from the sheet
let rawData = [];

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

    // Map rows to structured objects
    rawData = rows.map(r => ({
      date: r.c[0]?.v,
      match: r.c[1]?.v,
      prediction: r.c[2]?.v,
      odds: r.c[3]?.v,
      parlayOdds: r.c[4]?.v,
      result: r.c[5]?.v,
      profit: r.c[6]?.v
    }));

    populateMonths();         // Month buttons with stats
    renderParlays("all");     // Show all initially
  } catch (err) {
    console.error("Error fetching data", err);
  }
}

// ==========================
// 2️⃣ Generate month buttons with stats
// ==========================
function populateMonths() {
  const monthMap = {};
  rawData.forEach(item => {
    if (!item.date) return;
    const month = new Date(item.date).toLocaleString('default', { month: 'long' });
    if (!monthMap[month]) monthMap[month] = { wins: 0, losses: 0, profit: 0 };

    if ((item.result || "").toLowerCase() === "win") monthMap[month].wins++;
    else monthMap[month].losses++;

    monthMap[month].profit += Number(item.profit) || 0;
  });

  const container = document.getElementById("monthButtons");
  container.innerHTML = "";

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

    btn.style.margin = "5px";
    btn.style.padding = "10px 15px";
    btn.style.backgroundColor = "black";
    btn.style.color = "white";
    btn.style.border = "2px solid limegreen";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";
    btn.style.whiteSpace = "nowrap";

    btn.addEventListener("click", () => renderParlays(month));
    container.appendChild(btn);
  });

  // All button
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
// 3️⃣ Render parlays for a month
// ==========================
function renderParlays(monthFilter = "all") {
  let filteredData = rawData;
  if (monthFilter !== "all") {
    filteredData = rawData.filter(item => item.date && new Date(item.date).toLocaleString('default', { month: 'long' }) === monthFilter);
  }

  const container = document.getElementById("parlaysContainer");
  container.innerHTML = "";

  const grouped = {};
  filteredData.forEach(item => {
    if (!item.date) return;
    const date = item.date;
    if (!grouped[date]) grouped[date] = {};
    if (!grouped[date][item.parlayOdds]) grouped[date][item.parlayOdds] = [];
    grouped[date][item.parlayOdds].push(item);
  });

  let totalWins = 0, totalLosses = 0, totalProfit = 0;

  Object.keys(grouped).sort().forEach(date => {
    const dateHeader = document.createElement("div");
    dateHeader.classList.add("parlay-date");
    dateHeader.textContent = date;
    container.appendChild(dateHeader);

    Object.keys(grouped[date]).forEach(parlayOdds => {
      const parlay = grouped[date][parlayOdds];
      const result = (parlay[0].result || "").toLowerCase();
      if (result === "win") totalWins++;
      else totalLosses++;
      totalProfit += Number(parlay[0].profit) || 0;

      const parlayDiv = document.createElement("div");
      parlayDiv.classList.add("parlay");
      parlayDiv.classList.add(result === "win" ? "won" : "lost");

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

      setTimeout(() => parlayDiv.classList.add("show"), 50);
    });
  });

  // Update stats
  document.getElementById("wins").textContent = `Wins: ${totalWins}`;
  document.getElementById("losses").textContent = `Losses: ${totalLosses}`;
  const profitEl = document.getElementById("profit");
  profitEl.textContent = `Profit: ${totalProfit}`;
  profitEl.style.color = totalProfit >= 0 ? "limegreen" : "red";
}

// ==========================
// 4️⃣ Auto-refresh every 60s
// ==========================
fetchData();
setInterval(fetchData, 60000);
