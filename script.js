const sheetID = "1hqgI3ZtPxQfSTA9y5w3jBmedTZP7sqlMGIVqm4mqZB8"; // 🔹 βάλε το ID του Google Sheet σου
const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;

async function loadBets() {
  const res = await fetch(url);
  const text = await res.text();
  const json = JSON.parse(text.substr(47).slice(0, -2));

  let lastDate = "";

  let rows = json.table.rows.slice(1).map(r => {
    if (r.c[0]?.v) {
      lastDate = r.c[0].v;
    }

    return {
      date: lastDate, // π.χ. 16/08/2025
      match: r.c[1]?.v || "",
      prediction: r.c[2]?.v || "",
      odds: r.c[3]?.v || "",
      parlayOdds: r.c[4]?.v || "",
      result: r.c[5]?.v || "",
      profit: parseFloat(r.c[6]?.v) || 0
    };
  });

  // Αγνοούμε κενές σειρές χωρίς parlay odds
  rows = rows.filter(r => r.parlayOdds !== "");

  // Group ανά μήνα
  const groupedByMonth = {};
  rows.forEach(r => {
    const [day, month, year] = r.date.split("/");
    const monthKey = `${month}/${year}`; // π.χ. "08/2025"
    if (!groupedByMonth[monthKey]) groupedByMonth[monthKey] = [];
    groupedByMonth[monthKey].push(r);
  });

  renderMonthlyParlays(groupedByMonth);
}

function renderMonthlyParlays(groupedByMonth) {
  const parlaysDiv = document.getElementById("parlays");
  parlaysDiv.innerHTML = "";

  Object.keys(groupedByMonth).forEach(monthKey => {
    const monthSection = document.createElement("div");
    monthSection.classList.add("month-section");

    const monthTitle = document.createElement("h2");
    monthTitle.textContent = `📅 Μήνας: ${monthKey}`;
    monthSection.appendChild(monthTitle);

    const bets = groupedByMonth[monthKey];

    // Group parlay ανά Parlay Odds
    const groups = {};
    bets.forEach(b => {
      const key = b.parlayOdds;
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    });

    // Στατιστικά του μήνα
    const totalParlays = Object.keys(groups).length;
    const wins = Object.values(groups).filter(g => g[0].result === "Profit").length;
    const losses = Object.values(groups).filter(g => g[0].result === "Loss").length;
    const winRate = totalParlays > 0 ? ((wins / totalParlays) * 100).toFixed(1) : 0;
    const totalProfit = bets.reduce((acc, b) => acc + b.profit, 0);

    const summaryDiv = document.createElement("div");
    summaryDiv.classList.add("summary");
    summaryDiv.innerHTML = `
      📌 Παρολί: ${totalParlays} |
      ✅ Νίκες: ${wins} |
      ❌ Ήττες: ${losses} |
      📈 Winrate: ${winRate}% |
      💰 Profit: <span class="${totalProfit >= 0 ? 'profit' : 'loss'}">${totalProfit}</span>
    `;
    monthSection.appendChild(summaryDiv);

    // Προβολή parlay
    Object.values(groups).forEach(parlayBets => {
      const totalOdds = parlayBets[0].parlayOdds;
      const result = parlayBets[0].result;
      const profit = parlayBets[0].profit;

      const parlayDiv = document.createElement("div");
      parlayDiv.classList.add("parlay");

      parlayDiv.innerHTML = `
        <h3>Απόδοση: <span class="odds">${totalOdds}</span></h3>
        <div class="bets">
          ${parlayBets.map(b => `
            <div class="bet">
              ${b.match} (${b.prediction}) - Απόδοση: <span class="odds">${b.odds}</span>
            </div>
          `).join("")}
        </div>
        <p>Αποτέλεσμα: <span class="${result === 'Profit' ? 'profit' : 'loss'}">${result || "-"}</span> 
        | Κέρδος: <span class="${profit >= 0 ? 'profit' : 'loss'}">${profit}</span></p>
      `;

      monthSection.appendChild(parlayDiv);
    });

    parlaysDiv.appendChild(monthSection);
  });
}

loadBets();
setInterval(loadBets, 60000);
