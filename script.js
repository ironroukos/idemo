body {
  background-color: black;
  color: white;
  font-family: 'Dancing Script', cursive;
  padding: 20px;
  margin: 0;
  min-height: 100vh;
}

h1 {
  color: limegreen;
  font-size: 3em;
  text-align: center;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

/* Buttons: Month / Season */
.month-toggle-btn, .season-btn {
  font-family: 'Dancing Script', cursive;
  font-size: 2.2rem;
  background: transparent;
  color: white;
  border: 2px solid limegreen;
  border-radius: 20px;
  cursor: pointer;
  padding: 24px 32px;
  margin: 28px auto 16px auto;
  width: 97%;
  max-width: 700px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  box-sizing: border-box;
  transition: all 0.3s ease;
  flex-wrap: wrap;
  position: relative;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.month-toggle-btn:hover, .season-btn:hover {
  background: rgba(0,255,0,0.1);
  border-color: #55ff55;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.month-name, .season-title {
  font-size: 2rem;
  margin-right: 18px;
  white-space: nowrap;
  font-weight: 600;
}

.month-stats, .season-stats {
  font-size: 1.25rem;
  margin-left: 18px;
  white-space: nowrap;
  font-family: Arial, sans-serif;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

/* Individual stat items */
.month-stats span, .season-stats span {
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 1rem;
  white-space: nowrap;
}

/* Season button active */
.season-btn { 
  cursor: pointer; 
  pointer-events: auto;
  border-color: #FFD700; /* Gold border for season */
}

/* Dropdown container for month */
.parlays-dropdown {
  background: linear-gradient(135deg, #111 0%, #1a1a1a 100%);
  border: 1px solid #333;
  border-left: 3px solid limegreen;
  border-radius: 12px;
  padding: 16px 18px 19px 22px;
  margin-top: 5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Monthly summary inside season dropdown */
.month-summary {
  border: 1px solid #333;
  padding: 12px 16px;
  margin: 8px 0;
  border-radius: 8px;
  background: rgba(0,0,0,0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.month-summary:hover { 
  background: rgba(0,0,0,0.6); 
  border-color: limegreen;
  transform: translateX(5px);
}

.month-summary-name { 
  font-size: 1.3rem; 
  font-weight: bold; 
  color: limegreen;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.month-summary-stats { 
  font-size: 1.1rem; 
  font-family: Arial, sans-serif; 
  white-space: nowrap;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.month-summary-stats span {
  padding: 2px 4px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 0.9rem;
}

/* Parlay cards - Betting slip style */
.parlay {
  border: 3px solid;
  border-radius: 16px;
  padding: 0;
  margin: 16px 0;
  display: none;
  transition: all 0.3s ease;
  background: #1a1a1a;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;
  min-height: 200px;
}

.parlay.show { 
  display: block;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.parlay.won { 
  border-color: limegreen;
  background: linear-gradient(135deg, #1a1a1a 0%, #0f2f0f 100%);
}

.parlay.lost { 
  border-color: #ff4444;
  background: linear-gradient(135deg, #1a1a1a 0%, #2f0f0f 100%);
}

/* Header section of parlay slip */
.parlay-header {
  background: linear-gradient(135deg, #333 0%, #222 100%);
  padding: 12px 16px;
  border-bottom: 2px solid #444;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.parlay.won .parlay-header {
  background: linear-gradient(135deg, limegreen 0%, #32cd32 100%);
  color: black;
}

.parlay.lost .parlay-header {
  background: linear-gradient(135deg, #ff4444 0%, #cc3333 100%);
  color: white;
}

/* Body section with matches */
.parlay-body {
  padding: 16px;
}

/* Footer section with total odds */
.parlay-footer {
  background: rgba(255, 255, 255, 0.05);
  padding: 12px 16px;
  border-top: 1px solid #444;
  text-align: center;
  font-weight: bold;
}

/* Parlay meta (date + total odds) */
.parlay-meta {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.6rem;
  font-weight: bold;
  margin-bottom: 12px;
  text-align: center;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.parlay-date, .total-odds {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.sep { 
  opacity: 0.7;
  font-size: 1.5rem;
  color: limegreen;
}

/* Match inside parlay - betting slip style */
.parlay .match {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 1rem;
  margin: 8px 0;
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
  border-left: 4px solid #666;
  min-height: 60px;
}

.parlay .match:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateX(3px);
}

.parlay .match.won { 
  color: limegreen;
  border-left-color: limegreen;
  background: rgba(0, 255, 0, 0.12);
}

.parlay .match.lost { 
  color: #ff6b6b;
  border-left-color: #ff6b6b;
  background: rgba(255, 0, 0, 0.12);
}

/* Match content layout */
.match-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.match-teams {
  font-weight: bold;
  font-size: 1.1rem;
}

.match-pick {
  font-size: 0.9rem;
  opacity: 0.8;
}

.match-result {
  font-size: 0.85rem;
  font-weight: bold;
  color: #ccc;
}

.match-odds {
  font-weight: bold;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  min-width: 50px;
  text-align: center;
  font-size: 1.1rem;
  align-self: center;
}

.parlay.won .match-odds {
  background: rgba(0, 255, 0, 0.2);
  color: limegreen;
}

.parlay.lost .match-odds {
  background: rgba(255, 0, 0, 0.2);
  color: #ff6b6b;
}

/* Loading states */
.loading {
  opacity: 0.6;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* Error states */
.error {
  color: #ff6b6b !important;
  font-weight: bold;
}

/* Stats container */
#stats { 
  margin-bottom: 20px; 
  font-size: 1.2em;
  text-align: center;
  padding: 10px;
}

/* Responsive adjustments for new parlay design */
@media (max-width: 768px) {
  body { padding: 15px; }
  
  h1 { 
    font-size: 2.2em; 
    margin-bottom: 15px; 
  }
  
  .month-toggle-btn, .season-btn {
    font-size: 1.4rem;
    padding: 18px 16px;
    border-radius: 16px;
    margin: 16px auto 12px auto;
    flex-direction: column;
    gap: 8px;
    width: 98%;
    text-align: center;
  }
  
  .month-name, .season-title { 
    font-size: 1.3rem; 
    margin: 0;
  }
  
  .month-stats, .season-stats { 
    font-size: 1rem; 
    margin: 0;
    justify-content: center;
    text-align: center;
  }
  
  .month-stats span, .season-stats span {
    font-size: 0.9rem;
    padding: 2px 4px;
  }
  
  .parlays-dropdown { 
    padding: 12px 8px; 
    margin-top: 5px; 
    border-radius: 12px; 
  }
  
  .parlay { 
    margin: 12px 0; 
    border-radius: 12px;
    min-height: 180px;
  }
  
  .parlay-header {
    padding: 10px 12px;
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }
  
  .parlay-body {
    padding: 12px;
  }
  
  .parlay .match { 
    flex-direction: column; 
    align-items: stretch;
    gap: 8px;
    padding: 10px;
    min-height: 80px;
  }
  
  .match-info {
    text-align: left;
  }
  
  .match-teams {
    font-size: 1rem;
  }
  
  .match-pick, .match-result {
    font-size: 0.85rem;
  }
  
  .match-odds {
    align-self: center;
    margin-top: 8px;
    font-size: 1rem;
    padding: 6px 10px;
  }

  .month-summary {
    flex-direction: column;
    gap: 6px;
    text-align: center;
  }

  .month-summary-stats {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  body { padding: 10px; }
  
  h1 { font-size: 1.8em; }
  
  .month-toggle-btn, .season-btn {
    font-size: 1.2rem;
    padding: 14px 12px;
  }
  
  .month-name, .season-title { 
    font-size: 1.1rem; 
  }
  
  .month-stats, .season-stats { 
    font-size: 0.9rem;
  }
}

/* Laptop/Desktop centering and improvements */
@media (min-width: 800px) {
  #monthButtons { 
    display: flex; 
    flex-direction: column; 
    align-items: center;
    max-width: 900px;
    margin: 0 auto;
  }
  
  .month-toggle-btn, .season-btn, .parlays-dropdown { 
    max-width: 800px; 
    width: 100%; 
  }

  .parlay {
    max-width: 100%;
    margin: 12px auto;
  }

  /* Hover effects for desktop */
  .month-toggle-btn:hover .month-name,
  .season-btn:hover .season-title {
    color: limegreen;
    text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
  }
}
