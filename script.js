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
      date: lastDate,
      match: r.c[1]?.v || "",
      prediction: r.c[2]?.v || "",
      odds: r.c[3]?.v || "",
      parlayOdds: r.c[4]?.v || "",
      result: r.c[5]?.v || "",
      profit: parseFloat(r.c[6]?.v) || 0
    };
  });

  renderParlays(rows);
  renderSummary(rows);
}

function renderParlays(bets) {
  const parlaysDiv = document.getElementById("parlays");
  parlaysDiv.innerHTML = "";

  const groups = {};
  bets.forEach(b => {
    const key = `${b.date}_${b.parlayOdds}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  });

  Object.values(groups).forEach(parlayBets => {
    const totalOdds = parlayBets[0].parlayOdds || "-";
    const date = parlayBets[0].date;
    const result = parlayBets[0].result;
    const profit = parlayBets[0].profit;

    const parlayDiv = document.createElement("div");
    parlayDiv.classList.add("parlay");

    parlayDiv.innerHTML = `
      <h3>${date} | Απόδοση: <span class="odds">${totalOdds}</span></h3>
      <div class="bets">
        ${parlayBets.map(b => `
          <div class="bet">
            ${b.match} (${b.prediction}) - Απόδοση: <span class="odds">${b.odds}</span>
          </div>
        `).join("")}
      </div>
      <p>Αποτέλεσμα: <span class="${result === 'Profit' ? 'profit' : 'loss'}">${result}</span> 
      | Κέρδος: <span class="${profit >= 0 ? 'profit' : 'loss'}">${profit}</span></p>
    `;

    parlaysDiv.appendChild(parlayDiv);
  });
}

function renderSummary(bets) {
  const summaryDiv = document.getElementById("summary");

  const keys = [...new Set(bets.map(b => `${b.date}_${b.parlayOdds}`))];
  const totalParlays = keys.length;

  const resultsByKey = {};
  keys.forEach(k => {
    const group = bets.filter(b => `${b.date}_${b.parlayOdds}` === k);
    resultsByKey[k] = group[0].result;
  });

  const wins = Object.values(resultsByKey).filter(r => r === "Profit").length;
  const losses = Object.values(resultsByKey).filter(r => r === "Loss").length;
  const winRate = totalParlays > 0 ? ((wins / totalParlays) * 100).toFixed(1) : 0;

  const totalProfit = bets.reduce((acc, b) => acc + b.profit, 0);

  summaryDiv.innerHTML = `
    📌 Παρολί: ${totalParlays} |
    ✅ Νίκες: ${wins} |
    ❌ Ήττες: ${losses} |
    📈 Winrate: ${winRate}% |
    💰 Profit: <span class="${totalProfit >= 0 ? 'profit' : 'loss'}">${totalProfit}</span>
  `;
}

loadBets();

// 🔄 Αυτόματο refresh κάθε 60 δευτερόλεπτα
setInterval(loadBets, 60000);
