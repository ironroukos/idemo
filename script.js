let bets = JSON.parse(localStorage.getItem("bets")) || [];
let parlays = {};

function saveData() {
  localStorage.setItem("bets", JSON.stringify(bets));
}

function render() {
  const seasonStats = document.getElementById("season-stats");
  const monthsContainer = document.getElementById("months-container");
  monthsContainer.innerHTML = "";

  // Group bets by month
  const grouped = {};
  bets.forEach(bet => {
    const d = new Date(bet.date);
    const key = d.toLocaleString("default", { month: "long", year: "numeric" });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(bet);
  });

  // Season stats
  let won = bets.filter(b => b.parlayResult === "won").length;
  let lost = bets.filter(b => b.parlayResult === "lost").length;
  seasonStats.textContent = `Won: ${won} | Lost: ${lost} | Open: ${bets.length - won - lost}`;

  // Render months
  Object.keys(grouped).forEach(month => {
    const div = document.createElement("div");
    div.className = "month";

    const header = document.createElement("div");
    header.className = "month-header";
    header.textContent = `${month} (${grouped[month].length} bets)`;
    div.appendChild(header);

    grouped[month].forEach(bet => {
      const betDiv = document.createElement("div");
      betDiv.className = "bet";

      const info = document.createElement("div");
      info.className = "bet-info";
      info.textContent = `${bet.date} | ${bet.match} | Pick: ${bet.pick} @ ${bet.odds} | Stake: ${bet.stake} | Status: ${bet.parlayResult || "open"}`;
      betDiv.appendChild(info);

      const actions = document.createElement("div");
      actions.className = "bet-actions";

      const winBtn = document.createElement("button");
      winBtn.textContent = "✅";
      winBtn.className = "win";
      winBtn.onclick = () => updateResult(bet.id, "won");
      actions.appendChild(winBtn);

      const loseBtn = document.createElement("button");
      loseBtn.textContent = "❌";
      loseBtn.className = "lose";
      loseBtn.onclick = () => updateResult(bet.id, "lost");
      actions.appendChild(loseBtn);

      const delBtn = document.createElement("button");
      delBtn.textContent = "🗑";
      delBtn.className = "delete";
      delBtn.onclick = () => deleteBet(bet.id);
      actions.appendChild(delBtn);

      betDiv.appendChild(actions);
      div.appendChild(betDiv);
    });

    monthsContainer.appendChild(div);
  });
}

function addBet(data) {
  const bet = {
    id: crypto.randomUUID(),
    date: data.date,
    home: data.home,
    away: data.away,
    match: `${data.home} vs ${data.away}`,
    pick: data.pick,
    odds: parseFloat(data.odds),
    stake: parseFloat(data.stake),
    parlayId: data.isParlay && bets.length ? bets[bets.length - 1].parlayId : crypto.randomUUID(),
    parlayResult: "",
    pickResult: ""
  };
  bets.push(bet);
  saveData();
  render();
}

function updateResult(id, result) {
  const bet = bets.find(b => b.id === id);
  if (!bet) return;

  bet.pickResult = result;
  // If parlay, set all bets with same parlayId
  if (bet.parlayId) {
    const parlayBets = bets.filter(b => b.parlayId === bet.parlayId);
    parlayBets.forEach(b => (b.parlayResult = result));
  } else {
    bet.parlayResult = result;
  }
  saveData();
  render();
}

function deleteBet(id) {
  bets = bets.filter(b => b.id !== id);
  saveData();
  render();
}

// Modal handling
const modal = document.getElementById("modal");
const addBtn = document.getElementById("addBetBtn");
const closeModal = document.getElementById("closeModal");
const betForm = document.getElementById("betForm");

addBtn.onclick = () => (modal.style.display = "block");
closeModal.onclick = () => (modal.style.display = "none");
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

betForm.onsubmit = e => {
  e.preventDefault();
  const data = {
    date: document.getElementById("betDate").value,
    home: document.getElementById("homeTeam").value,
    away: document.getElementById("awayTeam").value,
    pick: document.getElementById("pick").value,
    odds: document.getElementById("odds").value,
    stake: document.getElementById("stake").value,
    isParlay: document.getElementById("isParlay").checked
  };
  addBet(data);
  betForm.reset();
  modal.style.display = "none";
};

render();
