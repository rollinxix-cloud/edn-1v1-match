// Global State Management
let matches = [];
let currentFilter = 'ALL';
let isAdminAuthenticated = false;

// Initialize Application State on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("edn_matches")) {
        try {
            matches = JSON.parse(localStorage.getItem("edn_matches"));
        } catch (e) {
            matches = [];
        }
    }
    calculateFees();
    updateStats();
    renderDashboard();
});

// 1. Dynamic Fee Calculator Logic
function calculateFees() {
    const stakeInput = document.getElementById("calc-stake-input").value;
    const stake = parseFloat(stakeInput) || 0;
    
    const platformFeePerPlayer = 10;
    const depositPerPlayer = stake + platformFeePerPlayer;
    const winningPot = stake * 2;
    const totalAdminProfit = platformFeePerPlayer * 2;

    document.getElementById("calc-player-deposit").innerText = `Rs. ${depositPerPlayer}`;
    document.getElementById("calc-winning-pot").innerText = `Rs. ${winningPot}`;
    document.getElementById("calc-admin-profit").innerText = `Rs. ${totalAdminProfit}`;
}

// 2. Open Challenge Creation
function createChallenge(event) {
    event.preventDefault();

    const playerA = document.getElementById("player-a").value.trim();
    const stake = parseFloat(document.getElementById("match-stake").value) || 0;
    const refA = document.getElementById("ref-a").value.trim();

    const newChallenge = {
        id: 'CHALLENGE-' + Date.now(),
        playerA,
        playerB: null,
        stake,
        refA,
        refB: null,
        status: 'OPEN CHALLENGE',
        winner: null,
        timestamp: new Date().toLocaleString()
    };

    matches.unshift(newChallenge);
    saveData();
    
    document.getElementById("challenge-form").reset();
    
    updateStats();
    renderDashboard();
}

// 3. Opponent Accepts Challenge Action
function acceptChallengeModal(matchId) {
    const target = matches.find(m => m.id === matchId);
    if (!target) return;

    const playerB = prompt(`Accepting challenge from ${target.playerA} (Stake: Rs. ${target.stake}).\nEnter your Player Name (Player B):`);
    if (!playerB || !playerB.trim()) return;

    const refB = prompt(`Enter your eSewa Ref ID for deposit (Stake Rs. ${target.stake} + Rs. 10 fee):`);
    if (!refB || !refB.trim()) return;

    target.playerB = playerB.trim();
    target.refB = refB.trim();
    target.status = 'PENDING DEPOSITS';

    saveData();
    updateStats();
    renderDashboard();
    alert("Challenge accepted! Admin will verify both deposit ref IDs shortly.");
}

function saveData() {
    localStorage.setItem("edn_matches", JSON.stringify(matches));
}

function updateStats() {
    document.getElementById("stat-open").innerText = matches.filter(m => m.status === 'OPEN CHALLENGE').length;
    document.getElementById("stat-active").innerText = matches.filter(m => m.status === 'FUNDS SECURED / MATCH ACTIVE').length;
    document.getElementById("stat-completed").innerText = matches.filter(m => m.status === 'COMPLETED').length;
}

function setFilter(filterType) {
    currentFilter = filterType;
    
    ['all', 'open', 'pending', 'active', 'completed'].forEach(id => {
        const el = document.getElementById(`filter-${id}`);
        if(el) el.className = "px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition text-slate-400 hover:text-white";
    });

    const activeIdMap = {
        'ALL': 'all',
        'OPEN CHALLENGE': 'open',
        'PENDING DEPOSITS': 'pending',
        'FUNDS SECURED / MATCH ACTIVE': 'active',
        'COMPLETED': 'completed'
    };
    
    const targetFilterElement = document.getElementById(`filter-${activeIdMap[filterType]}`);
    if(targetFilterElement) {
        targetFilterElement.className = "px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition bg-slate-800 text-white";
    }

    renderDashboard();
}

// 4. Admin Control Systems
function loginAdmin() {
    const pass = document.getElementById("admin-password").value;
    if (pass === "admin123") {
        isAdminAuthenticated = true;
        document.getElementById("admin-login-form").classList.add("hidden");
        document.getElementById("admin-logged-in").classList.remove("hidden");
        document.getElementById("admin-password").value = "";
        renderDashboard();
    } else {
        alert("Invalid Administrator Password Credentials Provided.");
    }
}

function logoutAdmin() {
    isAdminAuthenticated = false;
    document.getElementById("admin-login-form").classList.remove("hidden");
    document.getElementById("admin-logged-in").classList.add("hidden");
    renderDashboard();
}

function approveDeposits(matchId) {
    const targetIdx = matches.findIndex(m => m.id === matchId);
    if (targetIdx !== -1) {
        matches[targetIdx].status = 'FUNDS SECURED / MATCH ACTIVE';
        saveData();
        updateStats();
        renderDashboard();
    }
}

function declareWinner(matchId, winnerName) {
    const targetIdx = matches.findIndex(m => m.id === matchId);
    if (targetIdx !== -1) {
        const match = matches[targetIdx];
        match.status = 'COMPLETED';
        match.winner = winnerName;
        saveData();
        updateStats();
        renderDashboard();
        generateReceipt(match);
    }
}

function deleteMatch(matchId) {
    if (confirm("Are you sure you want to permanently delete this escrow marketplace record?")) {
        matches = matches.filter(m => m.id !== matchId);
        saveData();
        updateStats();
        renderDashboard();
    }
}

// 5. Copypaste Payout Receipt Automation Engine
function generateReceipt(match) {
    const totalPot = match.stake * 2;
    const template = `🏆 MATCH COMPLETED: ${match.winner.toUpperCase()} WINS! 🏆\n` +
                     `----------------------------------------\n` +
                     `⚔️ P2P Grudge Match: ${match.playerA} vs ${match.playerB}\n` +
                     `💰 Total Stakes Secured: Rs. ${match.stake} each\n` +
                     `👑 Payout Grand Total: Rs. ${totalPot}\n` +
                     `🆔 Escrow Ref ID: ${match.id}\n` +
                     `----------------------------------------\n` +
                     `⚡ Payout safely processed via eSewa by EDN (Easy Deposit Nepal) Escrow Engine.`;

    document.getElementById("receipt-box").value = template;
    document.getElementById("receipt-container").classList.remove("hidden");
    document.getElementById("receipt-container").scrollIntoView({ behavior: 'smooth' });
}

function copyReceipt() {
    const receiptBox = document.getElementById("receipt-box");
    receiptBox.select();
    receiptBox.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(receiptBox.value);
    alert("Receipt Copied to Clipboard! Ready to post on Facebook Group.");
}

// Live Matrix Rendering Update Architecture
function renderDashboard() {
    const container = document.getElementById("matches-matrix");
    if (!container) return;
    
    const searchVal = document.getElementById("search-filter").value.toLowerCase();
    container.innerHTML = "";

    let dynamicDataset = matches.filter(match => {
        const pA = match.playerA ? match.playerA.toLowerCase() : '';
        const pB = match.playerB ? match.playerB.toLowerCase() : '';
        const matchesSearch = pA.includes(searchVal) || pB.includes(searchVal);
        const matchesFilter = (currentFilter === 'ALL') || (match.status === currentFilter);
        return matchesSearch && matchesFilter;
    });

    if (dynamicDataset.length === 0) {
        container.innerHTML = `
            <div class="bg-slate-900/40 border border-slate-800/80 p-8 rounded-2xl text-center">
                <p class="text-slate-500 font-medium text-sm">No marketplace listings found matching criteria configuration.</p>
            </div>`;
        return;
    }

    dynamicDataset.forEach(match => {
        let badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
        if (match.status === 'PENDING DEPOSITS') {
            badgeClass = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
        } else if (match.status === 'FUNDS SECURED / MATCH ACTIVE') {
            badgeClass = "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse";
        } else if (match.status === 'COMPLETED') {
            badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        }

        const card = document.createElement("div");
        card.className = "bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4 relative overflow-hidden backdrop-blur-sm shadow-md";
        
        let playerBSection = "";

        if (match.status === 'OPEN CHALLENGE') {
            playerBSection = `
                <div class="col-span-3 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                    <span class="text-xs text-amber-500 font-bold uppercase tracking-wider">Awaiting Opponent</span>
                    <button onclick="acceptChallengeModal('${match.id}')" class="mt-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition uppercase tracking-wide">Accept Challenge</button>
                </div>`;
        } else {
            playerBSection = `
                <div class="col-span-3 bg-slate-950/60 border border-slate-800/60 rounded-xl p-3">
                    <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Player B</div>
                    <div class="text-base font-bold text-white tracking-wide truncate mt-0.5">${match.playerB}</div>
                    <div class="text-[10px] text-slate-500 font-mono mt-1 select-all" title="Click to select Ref ID">Ref: ${match.refB}</div>
                </div>`;
        }

        let winDeclarationBlock = "";
        if (match.status === 'COMPLETED') {
            winDeclarationBlock = `
                <div class="bg-emerald-950/40 border border-emerald-900/50 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-semibold">
                    <span class="text-emerald-400 uppercase tracking-wide">🏆 Winner Declared</span>
                    <span class="text-white bg-emerald-600 px-2 py-0.5 rounded font-bold">${match.winner}</span>
                </div>`;
        }

        let adminActionsMarkup = "";
        if (isAdminAuthenticated) {
            adminActionsMarkup = `
                <div class="border-t border-slate-800/80 pt-3.5 mt-2 flex flex-wrap gap-2 items-center justify-between bg-slate-950/50 p-3 rounded-xl">
                    <div class="text-xs font-bold text-slate-500 tracking-wider uppercase gaming-font">Admin Controls:</div>
                    <div class="flex space-x-2">
                        ${match.status === 'PENDING DEPOSITS' ? `
                            <button onclick="approveDeposits('${match.id}')" class="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition uppercase tracking-wide">Approve Funds</button>
                        ` : ''}
                        ${match.status === 'FUNDS SECURED / MATCH ACTIVE' ? `
                            <button onclick="declareWinner('${match.id}', '${match.playerA}')" class="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg transition uppercase tracking-wide">🏆 ${match.playerA} Wins</button>
                            <button onclick="declareWinner('${match.id}', '${match.playerB}')" class="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg transition uppercase tracking-wide">🏆 ${match.playerB} Wins</button>
                        ` : ''}
                        <button onclick="deleteMatch('${match.id}')" class="bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-rose-100 text-xs px-2.5 py-1.5 rounded-lg transition">✕ Delete</button>
                    </div>
                </div>`;
        }

        card.innerHTML = `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div class="flex items-center space-x-2">
                    <span class="text-xs text-slate-500 font-mono">${match.id}</span>
                    <span class="text-xs text-slate-600">•</span>
                    <span class="text-xs text-slate-400 font-medium">${match.timestamp}</span>
                </div>
                <span class="inline-flex text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${badgeClass} w-max gaming-font">
                    ${match.status}
                </span>
            </div>

            <div class="grid grid-cols-7 gap-2 items-center text-center py-2">
                <div class="col-span-3 bg-slate-950/60 border border-slate-800/60 rounded-xl p-3">
                    <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Player A (Challenger)</div>
                    <div class="text-base font-bold text-white tracking-wide truncate mt-0.5">${match.playerA}</div>
                    <div class="text-[10px] text-slate-500 font-mono mt-1 select-all" title="Click to select Ref ID">Ref: ${match.refA}</div>
                </div>
                <div class="col-span-1 text-center font-bold text-slate-600 text-sm italic gaming-font">VS</div>
                ${playerBSection}
            </div>

            <div class="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                <div>
                    <span class="text-xs text-slate-400 font-medium">Stake Per Side:</span>
                    <span class="text-sm font-bold text-slate-200 ml-1">Rs. ${match.stake}</span>
                </div>
                <div class="text-right">
                    <span class="text-xs text-slate-400 font-medium">Winner Pot:</span>
                    <span class="text-base font-black text-emerald-400 ml-1 gaming-font">Rs. ${match.stake * 2}</span>
                </div>
            </div>

            ${winDeclarationBlock}
            ${adminActionsMarkup}
        `;
        container.appendChild(card);
    });
}
