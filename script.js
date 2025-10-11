let parlayMatches = [];
let allParlays = [];
let matchResults = {};

function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function addMatchToForm() {
  const matchIndex = parlayMatches.length;
  parlayMatches.push({
    homeTeam: '',
    awayTeam: '',
    date: '',
    pick: '',
    odds: 1.00
  });
  renderMatchForms();
}

function openAddMatchModal() {
  parlayMatches = [];
  addMatchToForm();
  document.getElementById('addMatchModal').classList.add('show');
  document.getElementById('stakeAmount').value = '';
}

function closeAddMatchModal() {
  document.getElementById('addMatchModal').classList.remove('show');
}

function toggleAdminPanel() {
  document.getElementById('adminContainer').classList.toggle('show');
}

function removeMatchFromForm(index) {
  parlayMatches.splice(index, 1);
  if (parlayMatches.length === 0) addMatchToForm();
  renderMatchForms();
}

function renderMatchForms() {
  const container = document.getElementById('matchesContainer');
  container.innerHTML = parlayMatches.map((match, index) => `
    <div class="match-card">
      <h3>
        Match ${index + 1}
        ${parlayMatches.length > 1 ? `<button class="remove-match-btn" onclick="removeMatchFromForm(${index})">Remove</button>` : ''}
      </h3>
      
      <div class="form-group">
        <label>Date</label>
        <input type="date" value="${match.date}" onchange="updateMatch(${index}, 'date', this.value)">
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Home Team</label>
          <input type="text" placeholder="e.g., Man United" value="${match.homeTeam}" onchange="updateMatch(${index}, 'homeTeam', this.value)">
        </div>
        <div class="form-group">
          <label>Away Team</label>
          <input type="text" placeholder="e.g., Liverpool" value="${match.awayTeam}" onchange="updateMatch(${index}, 'awayTeam', this.value)">
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Pick</label>
          <input type="text" placeholder="e.g., Home Win, Over, Draw" value="${match.pick}" onchange="updateMatch(${index}, 'pick', this.value)">
        </div>
        <div class="form-group">
          <label>Odds</label>
          <input type="number" placeholder="1.50" value="${match.odds}" step="0.01" min="1" onchange="updateMatch(${index}, 'odds', parseFloat(this.value))">
        </div>
      </div>
    </div>
  `).join('');
  
  updateParlayOdds();
}

function updateMatch(index, field, value) {
  parlayMatches[index][field] = value;
  renderMatchForms();
}

function updateParlayOdds() {
  const totalOdds = parlayMatches.reduce((acc, match) => acc * (match.odds || 1), 1);
  document.getElementById('parlayOdds').textContent = totalOdds.toFixed(2);
}

function submitParlay() {
  if (parlayMatches.some(m => !m.homeTeam || !m.awayTeam || !m.date || !m.pick || m.odds < 1)) {
    alert('Please fill in all fields for each match');
    return;
  }

  const stake = parseFloat(document.getElementById('stakeAmount').value);
  if (!stake || stake <= 0) {
    alert('Please enter a valid total stake amount');
    return;
  }

  const parlayOdds = parlayMatches.reduce((acc, m) => acc * m.odds, 1);

  const parlay = {
    id: Date.now(),
    date: new Date().toISOString().split('T')[0],
    matches: parlayMatches.map((m, idx) => ({
      ...m,
      id: `${Date.now()}-${idx}`,
      result: null
    })),
    parlayOdds: parlayOdds,
    stake: stake,
    potentialWin: stake * parlayOdds,
    status: 'open'
  };

  allParlays.push(parlay);
  renderParlays();
  renderAdminPanel();
  closeAddMatchModal();
}

function renderParlays() {
  const container = document.getElementById('parlaysContainer');
  if (allParlays.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = allParlays.map((parlay, index) => `
    <div class="parlay ${parlay.status}">
      <div class="parlay-header">
        <span class="parlay-title">Parlay ${index + 1} - ${formatDate(parlay.date)}</span>
        <span class="parlay-status">${parlay.status.toUpperCase()}</span>
      </div>
      <div class="parlay-body">
        ${parlay.matches.map(match => `
          <div class="match-in-parlay ${match.result || ''}">
            <div class="match-teams">${match.homeTeam} vs ${match.awayTeam}</div>
            <div class="match-meta">
              <span>${match.pick}</span>
              <span>@ ${match.odds.toFixed(2)}</span>
              <span>${formatDate(match.date)}</span>
            </div>
            ${match.result ? `<div class="match-result ${match.result}">${match.result.toUpperCase()}</div>` : ''}
          </div>
        `).join('')}
      </div>
      <div class="parlay-footer">
        <div class="footer-item">
          <span class="footer-label">Total Odds</span>
          <span class="footer-value">${parlay.parlayOdds.toFixed(2)}</span>
        </div>
        <div class="footer-item">
          <span class="footer-label">Stake</span>
          <span class="footer-value">$${parlay.stake.toFixed(2)}</span>
        </div>
        <div class="footer-item">
          <span class="footer-label">Potential Win</span>
          <span class="footer-value">$${parlay.potentialWin.toFixed(2)}</span>
        </div>
      </div>
    </div>
  `).join('');

  updateSeasonStats();
}

function renderAdminPanel() {
  const container = document.getElementById('matchResultsContainer');
  let allMatches = [];
  allParlays.forEach((parlay, pIndex) => {
    parlay.matches.forEach((match, mIndex) => {
      allMatches.push({
        ...match,
        parlayId: parlay.id,
        parlayIndex: pIndex
      });
    });
  });

  container.innerHTML = allMatches.map((match, index) => `
    <div class="match-result-card">
      <div class="match-result-header">
        <span class="match-result-teams">${match.homeTeam} vs ${match.awayTeam}</span>
        <span class="match-result-status ${match.result || ''}">${match.result ? match.result.toUpperCase() : 'PENDING'}</span>
      </div>
      <div style="font-size: 0.85em; color: #aaa; margin-bottom: 10px;">
        ${match.pick} @ ${match.odds.toFixed(2)} | ${formatDate(match.date)}
      </div>
      <div class="match-result-buttons">
        <button class="btn-match-win" onclick="setMatchResult(${match.parlayIndex}, '${match.id}', 'won')">✓ Won</button>
        <button class="btn-match-lose" onclick="setMatchResult(${match.parlayIndex}, '${match.id}', 'lost')">✗ Lost</button>
      </div>
    </div>
  `).join('');
}

function setMatchResult(parlayIndex, matchId, result) {
  const parlay = allParlays[parlayIndex];
  const match = parlay.matches.find(m => m.id === matchId);
  if (match) {
    match.result = result;
    const allResultsSet = parlay.matches.every(m => m.result);
    if (allResultsSet) {
      const hasLoss = parlay.matches.some(m => m.result === 'lost');
      parlay.status = hasLoss ? 'lost' : 'won';
    }
    renderParlays();
    renderAdminPanel();
  }
}

function updateSeasonStats() {
  const won = allParlays.filter(p => p.status === 'won').length;
  const lost = allParlays.filter(p => p.status === 'lost').length;
  document.getElementById('seasonParlayRecord').textContent = `Parlays WL: ${won}-${lost}`;
  const totalBank = allParlays.reduce((acc, p) => {
    if (p.status === 'won') return acc + p.potentialWin;
    if (p.status === 'lost') return acc - p.stake;
    return acc;
  }, 0);
  document.getElementById('seasonBank').textContent = `Bank: ${totalBank.toFixed(2)}`;
}

window.onclick = function(event) {
  const modal = document.getElementById('addMatchModal');
  if (event.target === modal) closeAddMatchModal();
};
