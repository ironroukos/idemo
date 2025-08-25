// Global variables
let csvData = [];
let parlayData = [];
let monthlyStats = {};
let seasonStats = { wins: 0, losses: 0, bank: 0 };

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadCSVData();
});

// Load and parse CSV data
async function loadCSVData() {
    try {
        // Read the CSV file
        const csvContent = await window.fs.readFile('4bet _ Road to Profit - Season 2025-2026.csv', { encoding: 'utf8' });
        parseCSVData(csvContent);
        processData();
        updateSeasonStats();
        createMonthlyStats();
        renderInterface();
    } catch (error) {
        console.error('Error loading CSV:', error);
        // Fallback to hardcoded data if file read fails
        loadHardcodedData();
    }
}

// Parse CSV content
function parseCSVData(csvContent) {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    csvData = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            const values = parseCSVLine(line);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                csvData.push(row);
            }
        }
    }
}

// Parse CSV line handling commas in quoted strings
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

// Process raw CSV data into parlay groups
function processData() {
    parlayData = [];
    let currentParlay = null;
    
    csvData.forEach(row => {
        // Skip empty rows or rows without essential data
        if (!row.Date && !row.Match && !row.Pick) return;
        
        // If we have a date, this starts a new parlay group
        if (row.Date && row.Date.trim()) {
            // Finalize previous parlay if exists
            if (currentParlay) {
                parlayData.push(currentParlay);
            }
            
            // Start new parlay
            currentParlay = {
                date: row.Date.trim(),
                matches: [],
                parlayOdds: parseFloat(row['Parlay Odds']) || 0,
                parlayResult: row['Parlay Result'] || '',
                bank: parseFloat(row.Bank) || 0
            };
        }
        
        // Add match to current parlay if we have match data
        if (row.Match && row.Match.trim() && currentParlay) {
            currentParlay.matches.push({
                match: row.Match.trim(),
                matchResult: row['Match Result'] || '',
                pick: row.Pick || '',
                pickResult: row['Pick Result'] || '',
                odds: parseFloat(row.Odds) || 0
            });
        }
    });
    
    // Don't forget the last parlay
    if (currentParlay) {
        parlayData.push(currentParlay);
    }
}

// Calculate season statistics
function updateSeasonStats() {
    seasonStats = { wins: 0, losses: 0, bank: 0 };
    
    parlayData.forEach(parlay => {
        if (parlay.parlayResult === 'Won') {
            seasonStats.wins++;
        } else if (parlay.parlayResult === 'Lost') {
            seasonStats.losses++;
        }
        
        // Use the bank value from the last entry or calculate profit/loss
        if (parlay.bank !== 0) {
            seasonStats.bank = parlay.bank;
        }
    });
    
    // If no bank data, calculate based on wins/losses (assuming 10 unit stakes)
    if (seasonStats.bank === 0) {
        let runningBank = 0;
        parlayData.forEach(parlay => {
            if (parlay.parlayResult === 'Won') {
                runningBank += (parlay.parlayOdds - 1) * 10; // Assuming 10 unit stakes
            } else if (parlay.parlayResult === 'Lost') {
                runningBank -= 10;
            }
        });
        seasonStats.bank = runningBank;
    }
}

// Create monthly statistics
function createMonthlyStats() {
    monthlyStats = {};
    
    parlayData.forEach(parlay => {
        const date = new Date(parlay.date.split('/').reverse().join('-')); // Convert DD/MM to YYYY-MM-DD
        const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        if (!monthlyStats[monthKey]) {
            monthlyStats[monthKey] = { wins: 0, losses: 0, bank: 0, parlays: [] };
        }
        
        monthlyStats[monthKey].parlays.push(parlay);
        
        if (parlay.parlayResult === 'Won') {
            monthlyStats[monthKey].wins++;
        } else if (parlay.parlayResult === 'Lost') {
            monthlyStats[monthKey].losses++;
        }
    });
    
    // Calculate monthly bank changes
    Object.keys(monthlyStats).forEach(month => {
        let monthBank = 0;
        monthlyStats[month].parlays.forEach(parlay => {
            if (parlay.parlayResult === 'Won') {
                monthBank += (parlay.parlayOdds - 1) * 10;
            } else if (parlay.parlayResult === 'Lost') {
                monthBank -= 10;
            }
        });
        monthlyStats[month].bank = monthBank;
    });
}

// Render the complete interface
function renderInterface() {
    updateSeasonDisplay();
    createSeasonDropdown();
    createMonthButtons();
    renderAllParlays();
    setupEventListeners();
}

// Update season stats display
function updateSeasonDisplay() {
    document.getElementById('seasonWins').textContent = `Wins: ${seasonStats.wins}`;
    document.getElementById('seasonLosses').textContent = `Losses: ${seasonStats.losses}`;
    document.getElementById('seasonBank').textContent = `Bank: ${seasonStats.bank >= 0 ? '+' : ''}${seasonStats.bank}`;
}

// Create season dropdown with monthly summaries
function createSeasonDropdown() {
    const dropdown = document.getElementById('seasonDropdown');
    dropdown.innerHTML = '';
    
    Object.keys(monthlyStats).forEach(month => {
        const stats = monthlyStats[month];
        const monthDiv = document.createElement('div');
        monthDiv.className = 'month-summary';
        monthDiv.innerHTML = `
            <div class="month-summary-name">${month}</div>
            <div class="month-summary-stats">
                Wins: ${stats.wins} | Losses: ${stats.losses} | Bank: ${stats.bank >= 0 ? '+' : ''}${stats.bank}
            </div>
        `;
        dropdown.appendChild(monthDiv);
    });
}

// Create month toggle buttons
function createMonthButtons() {
    const container = document.getElementById('monthButtons');
    container.innerHTML = '';
    
    Object.keys(monthlyStats).forEach(month => {
        const stats = monthlyStats[month];
        const button = document.createElement('button');
        button.className = 'month-toggle-btn';
        button.dataset.month = month;
        button.innerHTML = `
            <span class="month-name">${month}</span>
            <span class="month-stats">
                Wins: ${stats.wins} | Losses: ${stats.losses} | Bank: ${stats.bank >= 0 ? '+' : ''}${stats.bank}
            </span>
        `;
        container.appendChild(button);
    });
}

// Render all parlay cards
function renderAllParlays() {
    const container = document.getElementById('parlaysContainer');
    container.innerHTML = '';
    
    // Group parlays by date for better organization
    const parlaysByDate = {};
    parlayData.forEach(parlay => {
        if (!parlaysByDate[parlay.date]) {
            parlaysByDate[parlay.date] = [];
        }
        parlaysByDate[parlay.date].push(parlay);
    });
    
    // Render each date group
    Object.keys(parlaysByDate).sort((a, b) => {
        const dateA = new Date(a.split('/').reverse().join('-'));
        const dateB = new Date(b.split('/').reverse().join('-'));
        return dateB - dateA; // Most recent first
    }).forEach(date => {
        // Add date divider
        const dateDivider = document.createElement('div');
        dateDivider.className = 'date-divider';
        dateDivider.textContent = date;
        container.appendChild(dateDivider);
        
        // Add parlays for this date
        parlaysByDate[date].forEach(parlay => {
            const parlayCard = createParlayCard(parlay);
            container.appendChild(parlayCard);
        });
    });
}

// Create individual parlay card
function createParlayCard(parlay) {
    const card = document.createElement('div');
    card.className = `parlay-card ${parlay.parlayResult.toLowerCase()}`;
    card.dataset.date = parlay.date;
    
    // Determine month for filtering
    const date = new Date(parlay.date.split('/').reverse().join('-'));
    const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    card.dataset.month = monthKey;
    
    // Create matches HTML
    const matchesHtml = parlay.matches.map(match => `
        <div class="match ${match.pickResult.toLowerCase()}">
            <span>${match.match} - ${match.pick}</span>
            <span>${match.odds}x (${match.pickResult})</span>
        </div>
    `).join('');
    
    card.innerHTML = `
        <div class="parlay-meta">
            <span class="parlay-date">${parlay.date}</span>
            <span class="sep">|</span>
            <span class="total-odds">${parlay.parlayOdds}x</span>
        </div>
        <div class="parlay">
            ${matchesHtml}
        </div>
        <div class="parlay-summary">
            <span>Result: ${parlay.parlayResult}</span>
            <span>Bank: ${parlay.bank >= 0 ? '+' : ''}${parlay.bank}</span>
        </div>
    `;
    
    return card;
}

// Setup event listeners
function setupEventListeners() {
    // Season button toggle
    const seasonButton = document.getElementById('seasonButton');
    const seasonDropdown = document.getElementById('seasonDropdown');
    
    seasonButton.addEventListener('click', () => {
        const isVisible = seasonDropdown.style.display !== 'none';
        seasonDropdown.style.display = isVisible ? 'none' : 'block';
    });
    
    // Month button toggles
    const monthButtons = document.querySelectorAll('.month-toggle-btn');
    monthButtons.forEach(button => {
        button.addEventListener('click', () => {
            const month = button.dataset.month;
            toggleMonthParlays(month, button);
        });
    });
}

// Toggle month parlays visibility
function toggleMonthParlays(month, button) {
    const parlayCards = document.querySelectorAll(`[data-month="${month}"]`);
    const dateDividers = document.querySelectorAll('.date-divider');
    const isShowing = button.classList.contains('active');
    
    if (isShowing) {
        // Hide this month's parlays
        button.classList.remove('active');
        parlayCards.forEach(card => card.classList.remove('show'));
        
        // Hide date dividers that have no visible parlays
        dateDividers.forEach(divider => {
            const nextElement = divider.nextElementSibling;
            if (nextElement && !nextElement.classList.contains('show')) {
                divider.style.display = 'none';
            }
        });
    } else {
        // Hide all other months first
        document.querySelectorAll('.month-toggle-btn.active').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.parlay-card.show').forEach(card => {
            card.classList.remove('show');
        });
        
        // Show this month's parlays
        button.classList.add('active');
        parlayCards.forEach(card => card.classList.add('show'));
        
        // Show relevant date dividers
        dateDividers.forEach(divider => {
            const date = divider.textContent;
            const hasVisibleParlays = document.querySelector(`[data-date="${date}"].show`);
            divider.style.display = hasVisibleParlays ? 'block' : 'none';
        });
    }
}

// Fallback data in case CSV loading fails
function loadHardcodedData() {
    // Using some sample data from your CSV
    parlayData = [
        {
            date: '24/08',
            matches: [
                { match: 'Elfsborg - Halmstad', matchResult: '1-2', pick: 'Over 2.5', pickResult: 'Won', odds: 1.60 },
                { match: 'Crystal Palace - Forest', matchResult: '1-1', pick: 'GG', pickResult: 'Won', odds: 1.80 },
                { match: 'Wolfsberger - Rapid Wien', matchResult: '1-2', pick: 'Over 2.5', pickResult: 'Won', odds: 1.72 }
            ],
            parlayOdds: 4.95,
            parlayResult: 'Won',
            bank: 39.5
        }
    ];
    
    processData();
    updateSeasonStats();
    createMonthlyStats();
    renderInterface();
}
