const sheetID = "1hqgI3ZtPxQfSTA9y5w3jBmedTZP7sqlMGIVqm4mqZB8";

// Array with the names of the sheets (months)
const months = ["August","September","October"]; 

let rawData = [];

// ==========================
// 1️⃣ Fetch data from a specific sheet
// ==========================
async function fetchData(sheetName) {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
    const res = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2)); // Strip Google wrapper
    const rows = json.table.rows;

    // Map rows into structured objects
    rawData = rows.map(r => ({
      date: r.c[0]?.v,
      match: r.c[1]?.v,
      prediction: r.c[2]?.v,
      odds: r.c[3]?.v,
      parlayOdds: r.c[4]?.v,
      result: r.c[5]?.v,
      profit: r.c[6]?.v
    }));

    renderParlays("all"); // initially show all
  } catch (err) {
    console.error("Error fetching data from sheet:", sheetName, err);
  }
}

// ==========================
// 2️⃣ Create buttons for each sheet/month
// ==========================
function createMonthButtons() {
  const container = document.getElementById("monthButtons");
  container.innerHTML = "";

  months.forEach(month => {
    const btn = document.createElement("button");
    btn.textContent = month;

    btn.style.margin = "5px";
    btn.style.padding = "10px 15px";
    btn.style.backgroundColor = "black";
    btn.style.color = "white";
    btn.style.border = "2px solid limegreen";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";

    // When clicked → fetch data for this sheet
    btn.addEventListener("click", async () => {
      await fetchData(month);
      populateStats(month); // update stats in the button
    });

    container.appendChild(btn);
  });
}

// ==========================
// 3️⃣ Compute stats (Wins/Losses/Profit) for the sheet
// ==========================
function populateStats(monthName) {
  const stats = {wins:0, losses:0, profit:0};
  rawData.forEach(item => {
    if (item.result?.toLowerCase() === "win") stats.wins++;
    else stats.losses++;
    stats.profit += Number(item.profit);
  });

  const container = document.getElementById("monthButtons");
  const btns = container.querySelectorAll("button");
  btns.forEach(btn => {
    if (btn.textContent.includes(monthName)) {
      btn.innerHTML = `
        ${monthName} <span style="margin-left:10px;">
        Wins: ${stats.wins} | Losses: ${stats.losses} | 
        Profit: <span style="color:${stats.profit>=0?'limegreen':'red'}">${stats.profit}</span></span>
      `;
    }
  });
}

// ==========================
// 4️⃣ Render parlays
// ==========================
function renderParlays(monthFilter="all") {
  const container = document.getElementById("parlaysContainer");
  container.innerHTML = "";

  // Group by date → parlay odds
  const grouped = {};
  rawData.forEach(item => {
    const date = item.date;
    if (!grouped[date]) grouped[date] = {};
    if (!grouped[date][item.parlayOdds]) grouped[date][item.parlayOdds] = [];
    grouped[date][item.parlayOdds].push(item);
  });

  Object.keys(grouped).sort().forEach(date => {
    const dateHeader = document.createElement("div");
    dateHeader.classList.add("parlay-date");
    dateHeader.textContent = date;
    container.appendChild(dateHeader);

    Object.keys(grouped[date]).forEach(parlayOdds => {
      const parlay = grouped[date][parlayOdds];
      const result = parlay[0].result.toLowerCase();

      const parlayDiv = document.createElement("div");
      parlayDiv.classList.add("parlay");
      parlayDiv.classList.add(result==="win"?"won":"lost");

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

      // Fade-in animation
      setTimeout(()=>parlayDiv.classList.add("show"),50);
    });
  });
}

// ==========================
// 5️⃣ Auto-refresh every 60s for the current sheet
// ==========================
let currentMonth = months[0];
fetchData(currentMonth);
createMonthButtons();
setInterval(() => fetchData(currentMonth),60000);
