const sheetID = "1hqgI3ZtPxQfSTA9y5w3jBmedTZP7sqlMGIVqm4mqZB8";
const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;
let rawData = [];

async function fetchData() {
  try {
    const res = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2)); // Remove Google wrapper
    const rows = json.table.rows;
    rawData = rows.map(r => {
      return {
        date: r.c[0]?.v,
        match: r.c[1]?.v,
        prediction: r.c[2]?.v,
        odds: r.c[3]?.v,
        parlayOdds: r.c[4]?.v,
        result: r.c[5]?.v,
        profit: r.c[6]?.v
      }
    });
    populateMonths();
    renderParlays();
  } catch (err) {
    console.error("Error fetching data", err);
  }
}

function populateMonths() {
  const monthSet = new Set();
  rawData.forEach(item => {
    const month = new Date(item.date).toLocaleString('default', { month: 'long' });
    monthSet.add(month);
  });
  const monthSelect = document.getElementById("monthSelect");
  monthSet.forEach(month => {
    if (![...monthSelect.options].some(o => o.value === month)) {
      const opt = document.createElement("option");
      opt.value = month;
      opt.textContent = month;
      monthSelect.appendChild(opt);
    }
  });
}

function renderParlays() {
  const monthFilter = document.getElementById("monthSelect").value;
  let filteredData = rawData;
  if (monthFilter !== "all") {
    filteredData = rawData.filter(item => new Date(item.date).toLocaleString('default', { month: 'long' }) === monthFilter);
  }

  const container = document.getElementById("parlaysContainer");
  container.innerHTML = "";

  // Group by date → parlayOdds
  const grouped = {};
  filteredData.forEach(item => {
    const date = item.date;
    if (!grouped[date]) grouped[date] = {};
    if (!grouped[date][item.parlayOdds]) grouped[date][item.parlayOdds] = [];
    grouped[date][item.parlayOdds].push(item);
  });

  let totalWins = 0, totalLosses = 0, totalProfit = 0;

  Object.keys(grouped).sort().forEach(date => {
    // Create a single date header
    const dateHeader = document.createElement("div");
    dateHeader.classList.add("parlay-date");
    dateHeader.textContent = date;
    container.appendChild(dateHeader);

    Object.keys(grouped[date]).forEach(parlayOdds => {
      const parlay = grouped[date][parlayOdds];
      const result = parlay[0].result.toLowerCase();
      if (result === "win") totalWins++;
      else totalLosses++;
      totalProfit += Number(parlay[0].profit);

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
    });
  });

  document.getElementById("wins").textContent = `Wins: ${totalWins}`;
  document.getElementById("losses").textContent = `Losses: ${totalLosses}`;
  const profitEl = document.getElementById("profit");
  profitEl.textContent = `Profit: ${totalProfit}`;
  profitEl.style.color = totalProfit >= 0 ? "limegreen" : "red";
}

// Event listener for month filter
document.getElementById("monthSelect").addEventListener("change", renderParlays);

// Auto-refresh every 60s
fetchData();
setInterval(fetchData, 60000);
