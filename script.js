// 🔹 Your Google Sheet ID
const sheetID = "1hqgI3ZtPxQfSTA9y5w3jBmedTZP7sqlMGIVqm4mqZB8";

// 🔹 Array to store all data from the sheet
let rawData = [];

// 🔹 Starting bank
const START_BANK = 500;

function parseDate(ddmm) {
  if (!ddmm) return null;
  const [day, month] = ddmm.split('/');
  if (!day || !month) return null;
  return new Date(`2025-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
}

async function fetchData() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;
    const res = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
    const rows = json.table.rows;

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
      Object.keys(obj).forEach(k => {
        if (obj[k] !== null && obj[k] !== undefined) lastNonEmpty[k] = obj[k];
      });
      return obj;
    }).filter(r =>
      r.date && r.match && r.prediction && r.odds
    );

    populateSeasonAndMonths();
  } catch (err) {
    console.error("Error fetching data", err);
  }
}

function getParlayStats(parlays) {
  let wins = 0, losses = 0, profit = 0;
  Object.values(parlays).forEach(parlay => {
    const result = (parlay[0].result || "").toLowerCase();
    if (result === "profit") wins++;
    else if (result === "loss") losses++;
    profit += Number(parlay[0].profit) || 0;
  });
  return { wins, losses, profit };
}

function populateSeasonAndMonths() {
  const parlaysByMonth = {};
  const monthDates = {};

  // Group data by month, date, and parlayOdds
  rawData.forEach(item => {
    const jsDate = parseDate(item.date);
    if (!jsDate) return;
    const month = jsDate.toLocaleString('default', { month: 'long' });
    if (!parlaysByMonth[month]) parlaysByMonth[month] = {};
    if (!parlaysByMonth[month][item.date]) parlaysByMonth[month][item.date] = {};
    if (!parlaysByMonth[month][item.date][item.parlayOdds]) parlaysByMonth[month][item.date][item.parlayOdds] = [];
    parlaysByMonth[month][item.date][item.parlayOdds].push(item);

    // Store first date for month sorting
    if (!monthDates[month] || jsDate > monthDates[month]) {
      monthDates[month] = jsDate;
    }
  });

  // Compute overall season stats (all months, all parlays)
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

  // Clear container
  const container = document.getElementById("monthButtons");
  container.innerHTML = "";

  // 🔹 Season Button (Bank αντί για Profit)
  const currentBank = START_BANK + seasonStats.profit;
  const bankColor = currentBank > START_BANK ? "limegreen" : (currentBank < START_BANK ? "red" : "gold");

  const seasonBtn = document.createElement("button");
  seasonBtn.className = "month-toggle-btn season-btn";
  seasonBtn.innerHTML = `
    <span class="month-name">Season 2025–2026</span>
    <span class="month-stats">
      Wins: ${seasonStats.wins} | 
      Losses: ${seasonStats.losses} | 
      Bank: <span style="color:${bankColor}">${currentBank.toFixed(2)}</span>
    </span>
  `;
  seasonBtn.disabled = true;
  seasonBtn.style.pointerEvents = "none";
  container.appendChild(seasonBtn);

  // 🔹 Month Buttons
  Object.keys(parlaysByMonth)
    .sort((a, b) => monthDates[b] - monthDates[a]) // Newest month first
    .forEach(month => {
      let monthParlays = {};
      Object.values(parlaysByMonth[month]).forEach(dateGroup => {
        Object.values(dateGroup).forEach(parlayArr => {
          const key = parlayArr[0].date + "_" + parlayArr[0].parlayOdds;
          monthParlays[key] = parlayArr;
        });
      });
      const stats = getParlayStats(monthParlays);

      const monthBank = START_BANK + stats.profit;
      const bankColorM = monthBank > START_BANK ? "limegreen" : (monthBank < START_BANK ? "red" : "gold");

      const btn = document.createElement("button");
      btn.className = "month-toggle-btn";
      btn.innerHTML = `
        <span class="month-name">${month}</span>
        <span class="month-stats">
          Wins: ${stats.wins} | 
          Losses: ${stats.losses} | 
          Bank: <span style="color:${bankColorM}">${monthBank.toFixed(2)}</span>
        </span>
      `;

      // Parlay dropdown logic
      const parlaysContainer = document.createElement("div");
      parlaysContainer.className = "parlays-dropdown";
      parlaysContainer.style.display = "none";
      parlaysContainer.style.marginTop = "5px";
      renderParlaysForMonth(parlaysByMonth[month], parlaysContainer);

      btn.addEventListener("click", () => {
        document.querySelectorAll('.parlays-dropdown').forEach(el => {
          if (el !== parlaysContainer) el.style.display = "none";
        });
        parlaysContainer.style.display = parlaysContainer.style.display === "none" ? "block" : "none";
      });

      container.appendChild(btn);
      container.appendChild(parlaysContainer);
    });
}

// --- Parlay cards: reverse chronological order ---
function renderParlaysForMonth(monthData, container) {
  Object.keys(monthData)
    .sort((a, b) => {
      // Reverse chronological: newest first
      const dateA = parseDate(a);
      const dateB = parseDate(b);
      return dateB - dateA;
    })
    .forEach(date => {
      const dateGroup = monthData[date];
      Object.keys(dateGroup).forEach(parlayOdds => {
        const parlay = dateGroup[parlayOdds];
        const result = (parlay[0].result || "").toLowerCase();
        const jsDate = parseDate(parlay[0].date);

        // Only render if there are valid matches in this parlay
        if (!parlay[0].match || !parlay[0].prediction || !parlay[0].odds) return;

        // 📌 Parlay card with date + odds in same line
        const parlayDiv = document.createElement("div");
        parlayDiv.classList.add("parlay");
        parlayDiv.classList.add(result === "profit" ? "won" : "lost");

        const dateStr = jsDate ? jsDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) : "??/??";

        parlayDiv.innerHTML = `
          <div class="parlay-meta">
            <span class="parlay-date">${dateStr}</span>
            <span class="sep">•</span>
            <span class="total-odds">Total Odds: ${parlayOdds || "N/A"}</span>
          </div>
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
//  Auto-refresh every 60s
// ==========================
fetchData();
setInterval(fetchData, 60000);
