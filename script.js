// 🔹 Store data
let rawData = [];
const START_BANK = 0;
const SEASON_START_YEAR = 2025;
const STORAGE_KEY = 'roukos_bets_data';

// 🔹 Load data from localStorage or use empty array
function loadBettingData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error loading data:', e);
    return [];
  }
}

// 🔹 Save data to localStorage
function saveBettingData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving data:', e);
    alert('Failed to save data. Storage might be full.');
  }
}

let BETTING_DATA = loadBettingData();

// 🔹 Parse date dd/mm → Date object
function parseDate(ddmm) {
  if (!ddmm) return null;
  const [day, month] = ddmm.split('/');
  const y = parseInt(month, 10) >= 8 ? SEASON_START_YEAR : SEASON_START_YEAR + 1;
  return new Date(`${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
}

// 🔹 Add new match form functionality
function showAddMatchForm() {
  const today = new Date();
  const defaultDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  const formHTML = `
    <div id="addMatchOverlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.95); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto;">
      <div style="background: #1a1a1a; padding: 30px; border-radius: 16px; border: 2px solid limegreen; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto;">
        <h2 style="color: limegreen; margin-top: 0; font-family: 'Fira Sans', sans-serif;">Add New Match</h2>
        
        <label style="display: block; margin: 15px 0 5px; color: #fff; font-family: 'Fira Sans', sans-serif;">Date (dd/mm):</label>
        <input type="text" id="inputDate" value="${defaultDate}" placeholder="e.g., 05/10" style="width: 100%; padding: 10px; background: #000; color: #fff; border: 1px solid #555; border-radius: 8px; font-family: 'Fira Sans', sans-serif; box-sizing: border-box;">
        
        <label style="display: block; margin: 15px 0 5px; color: #fff; font-family: 'Fira Sans', sans-serif;">Home Team:</label>
        <input type="text" id="inputHomeTeam" placeholder="e.g., Arsenal" style="width: 100%; padding: 10px; background: #000; color: #fff; border: 1px solid #555; border-radius: 8px; font-family: 'Fira Sans', sans-serif; box-sizing: border-box;">
        
        <label style="display: block; margin: 15px 0 5px; color: #fff; font-family: 'Fira Sans', sans-serif;">Away Team:</label>
        <input type="text" id="inputAwayTeam" placeholder="e.g., Chelsea" style="width: 100%; padding: 10px; background: #000; color: #fff; border: 1px solid #555; border-radius: 8px; font-family: 'Fira Sans', sans-serif; box-sizing: border-box;">
        
        <label style="display: block; margin: 15px 0 5px; color: #fff; font-family: 'Fira Sans', sans-serif;">Pick:</label>
        <input type="text" id="inputPick" placeholder="e.g., Over 2.5 goals" style="width: 100%; padding: 10px; background: #000; color: #fff; border: 1px solid #555; border-radius: 8px; font-family: 'Fira Sans', sans-serif; box-sizing: border-box;">
        
        <label style="display: block; margin: 15px 0 5px; color: #fff; font-family: 'Fira Sans', sans-serif;">Odds:</label>
        <input type="number" step="0.01" id="inputOdds" placeholder="e.g., 1.85" style="width: 100%; padding: 10px; background: #000; color: #fff; border: 1px solid #555; border-radius: 8px; font-family: 'Fira Sans', sans-serif; box-sizing: border-box;">
        
        <label style="display: block; margin: 15px 0 5px; color: #fff; font-family: 'Fira Sans', sans-serif;">Parlay Odds (same number = same parlay):</label>
        <input type="number" step="0.01" id="inputParlayOdds" placeholder="e.g., 3.50" style="width: 100%; padding: 10px; background: #000; color: #fff; border: 1px solid #555; border-radius: 8px; font-family: 'Fira Sans', sans-serif; box-sizing: border-box;">
        
        <label style="display: block; margin: 15px 0 5px; color: #fff; font-family: 'Fira Sans', sans-serif;">Stake:</label>
        <input type="number" step="0.01" id="inputStake" placeholder="e.g., 10" value="10" style="width: 100%; padding: 10px; background: #000; color: #fff; border: 1px solid #555; border-radius: 8px; font-family: 'Fira Sans', sans-serif; box-sizing: border-box;">
        
        <div style="display: flex; gap: 10px; margin-top: 25px;">
          <button onclick="addMatch()" style="flex: 1; padding: 12px; background: limegreen; color: #000; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: 'Fira Sans', sans-serif; font-size: 1rem;">Add Match</button>
          <button onclick="closeAddMatchForm()" style="flex: 1; padding: 12px; background: #ff4444; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: 'Fira Sans', sans-serif; font-size: 1rem;">Cancel</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', formHTML);
  // Focus first input
  setTimeout(() => document.getElementById('inputHomeTeam').focus(), 100);
}

function closeAddMatchForm() {
  const overlay = document.getElementById('addMatchOverlay');
  if (overlay) overlay.remove();
}

function addMatch() {
  const date = document.getElementById('inputDate').value.trim();
  const homeTeam = document.getElementById('inputHomeTeam').value.trim();
  const awayTeam = document.getElementById('inputAwayTeam').value.trim();
  const pick = document.getElementById('inputPick').value.trim();
  const odds = parseFloat(document.getElementById('inputOdds').value);
  const parlayOdds = parseFloat(document.getElementById('inputParlayOdds').value);
  const stake = parseFloat(document.getElementById('inputStake').value) || 10;
  
  if (!date || !homeTeam || !awayTeam || !pick || !odds || !parlayOdds) {
    alert('Please fill in all fields!');
    return;
  }
  
  const match = `${homeTeam} vs ${awayTeam}`;
  
  const newBet = {
    date: date,
    match: match,
    matchResult: "",
    pick: pick,
    pickResult: "",
    odds: odds,
    parlayOdds: parlayOdds,
    parlayResult: "",
    bank: 0,
    stake: stake
  };
  
  BETTING_DATA.push(newBet);
  saveBettingData(BETTING_DATA);
  closeAddMatchForm();
  fetchData();
  
  // Show success message
  showToast('Match added successfully! ✅', 'success');
}

// 🔹 Mark pick result (won/lost)
function markPickResult(dataIndex, result) {
  if (dataIndex < 0 || dataIndex >= BETTING_DATA.length) return;
  
  BETTING_DATA[dataIndex].pickResult = result;
  
  // Calculate parlay result for this match's parlay group
  const currentBet = BETTING_DATA[dataIndex];
  const parlayGroup = BETTING_DATA.filter(b => 
    b.date === currentBet.date && 
    b.parlayOdds === currentBet.parlayOdds
  );
  
  // Check if all picks in parlay have results
  const allHaveResults = parlayGroup.every(b => b.pickResult === "won" || b.pickResult === "lost");
  
  if (allHaveResults) {
    const allWon = parlayGroup.every(b => b.pickResult === "won");
    const parlayResult = allWon ? "won" : "lost";
    
    // Update parlay result and bank for all picks in this parlay
    parlayGroup.forEach(b => {
      const betIndex = BETTING_DATA.findIndex(bet => 
        bet.date === b.date && 
        bet.match === b.match && 
        bet.parlayOdds === b.parlayOdds
      );
      
      if (betIndex !== -1) {
        BETTING_DATA[betIndex].parlayResult = parlayResult;
        
        // Calculate bank change (only for first pick in parlay to avoid duplicates)
        if (betIndex === dataIndex) {
          if (parlayResult === "won") {
            // Profit = stake * (parlayOdds - 1)
            BETTING_DATA[betIndex].bank = (b.stake || 10) * (b.parlayOdds - 1);
          } else {
            // Loss = -stake
            BETTING_DATA[betIndex].bank = -(b.stake || 10);
          }
        } else {
          BETTING_DATA[betIndex].bank = 0; // Other picks in same parlay don't add to bank
        }
      }
    });
  }
  
  saveBettingData(BETTING_DATA);
  fetchData();
  
  showToast(`Pick marked as ${result.toUpperCase()}! ${result === 'won' ? '🎉' : '😔'}`, result === 'won' ? 'success' : 'error');
}

// 🔹 Delete bet
function deleteBet(dataIndex) {
  if (dataIndex < 0 || dataIndex >= BETTING_DATA.length) return;
  
  if (confirm('Delete this bet?')) {
    BETTING_DATA.splice(dataIndex, 1);
    saveBettingData(BETTING_DATA);
    fetchData();
    showToast('Bet deleted', 'error');
  }
}

// 🔹 Toast notification
function showToast(message, type = 'success') {
  const bgColor = type === 'success' ? 'limegreen' : (type === 'error' ? '#ff4444' : '#555');
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${bgColor};
    color: ${type === 'success' ? '#000' : '#fff'};
    padding: 12px 24px;
    border-radius: 8px;
    font-family: 'Fira Sans', sans-serif;
    font-weight: bold;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideDown 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// 🔹 Export/Import data
function exportData() {
  const dataStr = JSON.stringify(BETTING_DATA, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `roukos-bets-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported! 💾', 'success');
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (confirm(`Import ${imported.length} bets? This will REPLACE your current data.`)) {
          BETTING_DATA = imported;
          saveBettingData(BETTING_DATA);
          fetchData();
          showToast('Data imported! ✅', 'success');
        }
      } catch (err) {
        alert('Invalid file format!');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function clearAllData() {
  if (confirm('Delete ALL bets? This cannot be undone!')) {
    if (confirm('Are you REALLY sure?')) {
      BETTING_DATA = [];
      saveBettingData(BETTING_DATA);
      fetchData();
      showToast('All data cleared', 'error');
    }
  }
}

// 🔹 Load data from BETTING_DATA array
function fetchData() {
  try {
    rawData = BETTING_DATA.filter(r => r.date && r.match && r.pick && r.odds);
    const bankSum = rawData.reduce((sum, row) => sum + (row.bank || 0), 0);
    populateSeasonAndMonths(bankSum);
  } catch (err) {
    console.error(err);
    document.getElementById("seasonBank").innerText = "Bank: Error";
    document.getElementById("seasonParlayRecord").innerText = "Parlays WL: Error";
    document.getElementById("seasonPickRecord").innerText = "Picks WL: Error";
  }
}

// 🔹 Populate season & month stats
function populateSeasonAndMonths(totalBank) {
  const parlaysByMonth = {};
  const monthDates = {};
  rawData.forEach(item => {
    const jsDate = parseDate(item.date);
    if (!jsDate) return;
    const month = jsDate.toLocaleString('default', { month: 'long' });
    if (!parlaysByMonth[month]) parlaysByMonth[month] = {};
    if (!parlaysByMonth[month][item.date]) parlaysByMonth[month][item.date] = {};
    if (!parlaysByMonth[month][item.date][item.parlayOdds]) parlaysByMonth[month][item.date][item.parlayOdds] = [];
    parlaysByMonth[month][item.date][item.parlayOdds].push(item);
    if (!monthDates[month] || jsDate > monthDates[month]) monthDates[month] = jsDate;
  });

  const sortedMonths = Object.keys(parlaysByMonth).sort((a, b) => monthDates[a] - monthDates[b]);
  const monthStatsMap = {};
  let runningBank = 0;

  sortedMonths.forEach(month => {
    let parlayWins = 0, parlayLosses = 0, pickWins = 0, pickLosses = 0;
    let monthBank = 0;
    Object.values(parlaysByMonth[month]).forEach(dateGroup => {
      Object.values(dateGroup).forEach(parlayArr => {
        const parlayResult = (parlayArr[0].parlayResult || "").toLowerCase();
        if (parlayResult === "won") parlayWins++;
        else if (parlayResult === "lost") parlayLosses++;
        parlayArr.forEach(pick => {
          const pickResult = (pick.pickResult || "").toLowerCase();
          if (pickResult === "won") pickWins++;
          else if (pickResult === "lost") pickLosses++;
        });
      });
    });
    monthBank = rawData.filter(item => {
      const jsDate = parseDate(item.date);
      return jsDate && jsDate.toLocaleString('default', { month: 'long' }) === month;
    }).reduce((sum, row) => sum + (row.bank || 0), 0);
    runningBank += monthBank;
    monthStatsMap[month] = {
      parlayWins, parlayLosses, pickWins, pickLosses,
      bank: runningBank
    };
  });

  // === Season stats ===
  const seasonStats = {
    parlayWins: Object.values(monthStatsMap).reduce((a, m) => a + m.parlayWins, 0),
    parlayLosses: Object.values(monthStatsMap).reduce((a, m) => a + m.parlayLosses, 0),
    pickWins: Object.values(monthStatsMap).reduce((a, m) => a + m.pickWins, 0),
    pickLosses: Object.values(monthStatsMap).reduce((a, m) => a + m.pickLosses, 0),
    bank: totalBank
  };

  const currentBank = seasonStats.bank;
  const bankColor = currentBank > START_BANK ? "limegreen" : (currentBank < START_BANK ? "red" : "gold");
  document.getElementById("seasonBank").innerHTML = `Bank: <span style="color:${bankColor}">${currentBank.toFixed(2)}</span>`;
  document.getElementById("seasonParlayRecord").innerText = `Parlays WL: ${seasonStats.parlayWins}-${seasonStats.parlayLosses}`;
  document.getElementById("seasonPickRecord").innerText = `Picks WL: ${seasonStats.pickWins}-${seasonStats.pickLosses}`;

  // === Render months ===
  const container = document.getElementById("monthButtons");
  if (container) {
    container.innerHTML = "";
    [...sortedMonths].sort((a, b) => monthDates[b] - monthDates[a]).forEach(month => {
      const stats = monthStatsMap[month];
      const bankColor = stats.bank > START_BANK ? "limegreen" : (stats.bank < START_BANK ? "red" : "gold");
      const btn = document.createElement("button");
      btn.className = "month-toggle-btn";
      const monthNameSpan = document.createElement("span");
      monthNameSpan.className = "month-name";
      monthNameSpan.textContent = month;
      const monthStatsSpan = document.createElement("span");
      monthStatsSpan.className = "month-stats";
      monthStatsSpan.innerHTML = `
        <span>Parlays WL: ${stats.parlayWins}-${stats.parlayLosses}</span> |
        <span>Picks WL: ${stats.pickWins}-${stats.pickLosses}</span>
      `;
      const bankDisplaySpan = document.createElement("span");
      bankDisplaySpan.className = "bank-display";
      bankDisplaySpan.innerHTML = `Bank: <span style="color:${bankColor}">${stats.bank.toFixed(2)}</span>`;
      btn.appendChild(monthNameSpan);
      btn.appendChild(monthStatsSpan);
      btn.appendChild(bankDisplaySpan);
      const parlaysContainer = document.createElement("div");
      parlaysContainer.className = "parlays-dropdown";
      parlaysContainer.style.display = "none";
      parlaysContainer.style.marginTop = "5px";
      renderParlaysForMonth(parlaysByMonth[month], parlaysContainer);
      btn.addEventListener("click", () => {
        const seasonDropdown = document.getElementById("seasonDropdown");
        if (seasonDropdown) seasonDropdown.style.display = "none";
        document.querySelectorAll('.parlays-dropdown').forEach(el => {
          if (el !== parlaysContainer && el.id !== 'seasonDropdown') el.style.display = "none";
        });
        parlaysContainer.style.display = parlaysContainer.style.display === "none" ? "block" : "none";
      });
      container.appendChild(btn);
      container.appendChild(parlaysContainer);
    });
  }
}

// 🔹 Render parlays for a month
function renderParlaysForMonth(monthData, container) {
  const dateGroups = {};
  Object.keys(monthData)
    .sort((a, b) => parseDate(b) - parseDate(a))
    .forEach(date => {
      if (!dateGroups[date]) dateGroups[date] = [];
      const dateGroup = monthData[date];
      Object.keys(dateGroup).forEach(parlayOdds => {
        const parlay = dateGroup[parlayOdds];
        if (parlay[0].match && parlay[0].pick && parlay[0].odds) {
          dateGroups[date].push({ parlayOdds, parlay });
        }
      });
    });
  Object.keys(dateGroups).forEach(date => {
    const jsDate = parseDate(date);
    if (!jsDate) return;
    const dateDiv = document.createElement("div");
    dateDiv.className = "date-divider";
    dateDiv.textContent = jsDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    container.appendChild(dateDiv);
    dateGroups[date].forEach(({ parlayOdds, parlay }) => {
      const parlayResult = (parlay[0].parlayResult || "").toLowerCase();
      const parlayDiv = document.createElement("div");
      parlayDiv.classList.add("parlay", parlayResult === "won" ? "won" : (parlayResult === "lost" ? "lost" : ""));
      parlayDiv.innerHTML = `
        <div class="parlay-body">
          ${parlay.map(m => {
            const pickResult = (m.pickResult || "").toLowerCase();
            const pickClass = pickResult === "won" ? "won" : (pickResult === "lost" ? "lost" : "");
            const resultText = m.matchResult ? `(${m.matchResult})` : "";
            
            const dataIndex = BETTING_DATA.findIndex(b => 
              b.date === m.date && 
              b.match === m.match && 
              b.pick === m.pick &&
              b.odds === m.odds
            );
            
            return `
              <div class="match ${pickClass}" style="cursor: pointer; position: relative;" data-index="${dataIndex}">
                <div class="match-info">
                  <div class="match-teams">${m.match}</div>
                  <div class="match-pick">${m.pick} ${resultText}</div>
                </div>
                <div class="match-odds">${m.odds}</div>
                ${!pickResult ? '<div style="position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">Tap to mark</div>' : ''}
              </div>
            `;
          }).join('')}
        </div>
        <div class="parlay-footer">
          <span class="total-odds">Parlay Odds: ${parlayOdds || "N/A"}</span>
        </div>
      `;
      container.appendChild(parlayDiv);
      
      // Add click handlers to matches
      parlayDiv.querySelectorAll('.match').forEach(matchEl => {
        matchEl.addEventListener('click', () => {
          const dataIndex = parseInt(matchEl.dataset.index);
          if (dataIndex === -1) return;
          
          const currentResult = BETTING_DATA[dataIndex].pickResult;
          if (currentResult) {
            // Already has result, ask to change
            if (confirm(`This pick is marked as ${currentResult.toUpperCase()}. Change it?`)) {
              const newResult = currentResult === "won" ? "lost" : "won";
              markPickResult(dataIndex, newResult);
            }
          } else {
            // No result yet, show options
            const result = confirm(`Mark this pick as:\nOK = WON\nCancel = LOST`);
            markPickResult(dataIndex, result ? "won" : "lost");
          }
        });
      });
      
      setTimeout(() => parlayDiv.classList.add("show"), 50);
    });
  });
}

// 🔹 Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateX(-50%) translateY(0); opacity: 1; }
    to { transform: translateX(-50%) translateY(-20px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// 🔹 Load data on page load
fetchData();
