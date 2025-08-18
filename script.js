const sheetID = "1hqgI3ZtPxQfSTA9y5w3jBmedTZP7sqlMGIVqm4mqZB8"; // 🔹 βάλε το ID του Google Sheet σου
const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;

async function loadBets() {
  const res = await fetch(url);
  const text = await res.text();
  const json = JSON.parse(text.substr(47).slice(0, -2));

  let rows = json.table.rows.map(r => ({
    date: r.c[0]?.v || "",
    match: r.c[1]?.v || "",
    prediction: r.c[2]?.v || "",
    odds: r.c[3]?.v || "",
    parlayOdds: r.c[4]?.v || "",
    result: r.c[5]?.v || "",
    profit: parseFloat(r.c[6]?.v) || 0
  }));

  renderParlays(rows);
  renderSummary(rows);
}

function renderParlays(bets) {
  const parlaysDiv = document.getElementById("parlays");
  parlaysDiv.innerHTML = "";

  let parlayIndex = 0;
  let buffer = [];

  for (let i = 0; i < bets.length; i++) {
    buffer.push(bets[i]);

    if (i + 1 >= bets.length || bets[i+1].date !== bets[i].date) {
      parlayIndex++;
      const parlayBets = buffer;
      buffer = [];

      const totalOdds = parlayBets[0].parlayOdds || "-";
      const date = parlayBets[0].date;
      const result = parlayBets[0].result;
      const profit = parlayBets[0].profit;

      const parlayDiv = document.createElement("div");
      parlayDiv.classList.add("parlay");

      if (result === "Profit") {
        parlayDiv.classList.add("profit");
      } else if (result === "Loss") {
        parlayDiv.classList.add("loss");
      }

      parlayDiv.innerHTML = `
        <h3>Παρολί ${parlayIndex} - ${date} (Απόδοση: <span class="odds">${totalOdds}</span>)</h3>
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
    }
  }
}

function renderSummary(bets) {
  const summaryDiv = document.getElementById("summary");

  const totalProfit = bets.reduce((acc, b) => acc + b.profit, 0);
  const totalParlays = [...new Set(bets.map(b => b.date))].length;
  const wins = bets.filter(b => b.result === "Profit").length;
  const losses = bets.filter(b => b.result === "Loss").length;
  const winRate = totalParlays > 0 ? ((wins / totalParlays) * 100).toFixed(1) : 0;

  summaryDiv.innerHTML = `
    📌 Συνολικά Παρολί: ${totalParlays} |
    ✅ Νίκες: ${wins} |
    ❌ Ήττες: ${losses} |
    📈 Winrate: ${winRate}% |
    💰 Συνολικό Profit: <span class="${totalProfit >= 0 ? 'profit' : 'loss'}">${totalProfit}</span>
  `;
}

loadBets();

