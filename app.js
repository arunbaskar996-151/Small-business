// Small Business Financial Management & Profit Analysis System
// Application logic

(function(){
  "use strict";

  const STORAGE_KEY = "fmsAppState_v1";
  const $ = (id) => document.getElementById(id);

  let transactions = [];
  let currentTxType = "income";

  // ================= INIT =================
  function init(){
    loadTransactions();
    setupNav();
    setupModal();
    setupFilters();
    renderAll();
  }

  function loadTransactions(){
    try{
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved){
        transactions = JSON.parse(saved);
        return;
      }
    }catch(e){ /* fall through to sample data */ }
    // seed with sample data on first run
    transactions = JSON.parse(JSON.stringify(SAMPLE_TRANSACTIONS));
    persist();
  }

  function persist(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions)); }catch(e){ /* storage unavailable */ }
  }

  // ================= NAVIGATION =================
  function setupNav(){
    document.querySelectorAll(".nav-item").forEach(btn=>{
      btn.addEventListener("click", () => {
        document.querySelectorAll(".nav-item").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        const target = btn.dataset.page;
        document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
        $(`page-${target}`).classList.add("active");
        window.scrollTo(0,0);
        closeMobileSidebar();
        if (target === "insights") renderInsights();
      });
    });

    $("mobileMenuBtn").addEventListener("click", () => {
      $("sidebar").classList.toggle("mobile-open");
    });
  }

  function closeMobileSidebar(){
    $("sidebar").classList.remove("mobile-open");
  }

  // ================= MODAL =================
  function setupModal(){
    $("addTxBtnDash").addEventListener("click", openTxModal);
    $("addTxBtnTx").addEventListener("click", openTxModal);
    $("cancelTxBtn").addEventListener("click", closeTxModal);
    $("saveTxBtn").addEventListener("click", saveNewTransaction);
    $("typeIncomeBtn").addEventListener("click", () => setTxType("income"));
    $("typeExpenseBtn").addEventListener("click", () => setTxType("expense"));
  }

  function openTxModal(){
    setTxType("income");
    $("txDate").value = new Date().toISOString().slice(0,10);
    $("txDescription").value = "";
    $("txAmount").value = "";
    $("txAmountError").style.display = "none";
    $("txModal").classList.remove("hidden");
  }
  function closeTxModal(){
    $("txModal").classList.add("hidden");
  }
  function setTxType(type){
    currentTxType = type;
    $("typeIncomeBtn").classList.toggle("active", type === "income");
    $("typeExpenseBtn").classList.toggle("active", type === "expense");
    const catSelect = $("txCategory");
    catSelect.innerHTML = "";
    CATEGORIES[type].forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.name;
      opt.textContent = c.name;
      catSelect.appendChild(opt);
    });
  }

  function saveNewTransaction(){
    const dateVal = $("txDate").value;
    const category = $("txCategory").value;
    const description = $("txDescription").value.trim() || category;
    const amount = parseFloat($("txAmount").value);

    if (!amount || amount <= 0 || isNaN(amount)){
      $("txAmountError").style.display = "block";
      return;
    }
    $("txAmountError").style.display = "none";

    const dateObj = dateVal ? new Date(dateVal) : new Date();
    const monthIndex = dateObj.getMonth();
    const monthName = MONTHS[monthIndex];

    const newTx = {
      id: transactions.length ? Math.max(...transactions.map(t=>t.id))+1 : 1,
      date: dateVal || new Date().toISOString().slice(0,10),
      month: monthName,
      monthIndex: monthIndex,
      type: currentTxType,
      category: category,
      description: description,
      amount: Math.round(amount)
    };
    transactions.push(newTx);
    persist();
    closeTxModal();
    renderAll();
  }

  // ================= AGGREGATION HELPERS =================
  function monthlyTotals(){
    const income = new Array(12).fill(0);
    const expense = new Array(12).fill(0);
    transactions.forEach(t => {
      if (t.type === "income") income[t.monthIndex] += t.amount;
      else expense[t.monthIndex] += t.amount;
    });
    return { income, expense };
  }

  function expenseByCategory(){
    const map = {};
    transactions.filter(t=>t.type==='expense').forEach(t => {
      map[t.category] = (map[t.category]||0) + t.amount;
    });
    return map;
  }

  function totals(){
    let income = 0, expense = 0;
    transactions.forEach(t => { if(t.type==='income') income += t.amount; else expense += t.amount; });
    return { income, expense, profit: income - expense };
  }

  // ================= RENDER: ALL =================
  function renderAll(){
    renderKPIs();
    renderDashboardCharts();
    renderPnL();
    renderTransactionsTable();
    populateFilterOptions();
  }

  // ================= KPI CARDS =================
  function renderKPIs(){
    const t = totals();
    const margin = t.income > 0 ? (t.profit/t.income)*100 : 0;
    const monthly = monthlyTotals();
    const lastMonthIdx = findLastActiveMonthIndex();
    const prevMonthIdx = lastMonthIdx > 0 ? lastMonthIdx - 1 : null;
    let momChange = null;
    if (prevMonthIdx !== null){
      const lastProfit = monthly.income[lastMonthIdx] - monthly.expense[lastMonthIdx];
      const prevProfit = monthly.income[prevMonthIdx] - monthly.expense[prevMonthIdx];
      if (prevProfit !== 0) momChange = ((lastProfit - prevProfit)/Math.abs(prevProfit))*100;
    }

    const cards = [
      { label: "Total Revenue", value: formatINR(t.income), cls: "" },
      { label: "Total Expenses", value: formatINR(t.expense), cls: "" },
      { label: "Net Profit", value: formatINR(t.profit), cls: t.profit >= 0 ? "positive" : "negative" },
      { label: "Profit Margin", value: margin.toFixed(1) + "%", cls: margin >= 0 ? "positive" : "negative" }
    ];

    $("kpiRow").innerHTML = cards.map(c => `
      <div class="kpi-card">
        <div class="kpi-label">${c.label}</div>
        <div class="kpi-value ${c.cls} num">${c.value}</div>
        ${c.label==='Net Profit' && momChange !== null ? `<div class="kpi-delta ${momChange>=0?'up':'down'}">${momChange>=0?'▲':'▼'} ${Math.abs(momChange).toFixed(1)}% vs previous month</div>` : ""}
      </div>
    `).join("");
  }

  function findLastActiveMonthIndex(){
    let last = 0;
    transactions.forEach(t => { if (t.monthIndex > last) last = t.monthIndex; });
    return last;
  }

  // ================= DASHBOARD CHARTS =================
  function renderDashboardCharts(){
    const monthly = monthlyTotals();
    renderTrendChart("trendChart", MONTHS, monthly.income, monthly.expense);

    const catMap = expenseByCategory();
    const sortedCats = Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
    renderPieChart("expensePieChart", sortedCats.map(c=>c[0]), sortedCats.map(c=>c[1]));

    const profitData = monthly.income.map((v,i)=> v - monthly.expense[i]);
    renderProfitBarChart("profitBarChart", MONTHS, profitData);
  }

  // ================= P&L STATEMENT =================
  function renderPnL(){
    const incomeByCat = {};
    const expenseByCat = {};
    transactions.forEach(t => {
      const map = t.type === 'income' ? incomeByCat : expenseByCat;
      map[t.category] = (map[t.category]||0) + t.amount;
    });
    const t = totals();
    const margin = t.income > 0 ? (t.profit/t.income)*100 : 0;

    let html = `
      <div class="statement-header">
        <span class="statement-title">Baskar Traders — Profit &amp; Loss Statement</span>
        <span class="statement-period">Jan – Dec 2025</span>
      </div>
      <div class="statement-body">
        <div class="stmt-row section-label">Income</div>
    `;
    Object.entries(incomeByCat).sort((a,b)=>b[1]-a[1]).forEach(([cat,amt])=>{
      html += `<div class="stmt-row"><span class="r-name">${cat}</span><span class="r-value income num">${formatINR(amt)}</span></div>`;
    });
    html += `<div class="stmt-row total"><span class="r-name">Total Income</span><span class="r-value income num">${formatINR(t.income)}</span></div>`;

    html += `<div class="stmt-row section-label">Expenses</div>`;
    Object.entries(expenseByCat).sort((a,b)=>b[1]-a[1]).forEach(([cat,amt])=>{
      html += `<div class="stmt-row"><span class="r-name">${cat}</span><span class="r-value expense num">${formatINR(amt)}</span></div>`;
    });
    html += `<div class="stmt-row total"><span class="r-name">Total Expenses</span><span class="r-value expense num">${formatINR(t.expense)}</span></div>`;

    html += `
        <div class="stmt-row total" style="margin-top:14px;">
          <span class="r-name">Net Profit</span>
          <span class="r-value ${t.profit>=0?'profit-pos':'profit-neg'} num">${formatINR(t.profit)} (${margin.toFixed(1)}% margin)</span>
        </div>
      </div>
    `;
    $("pnlStatement").innerHTML = html;

    const monthly = monthlyTotals();
    const marginData = monthly.income.map((inc,i)=> inc > 0 ? ((inc - monthly.expense[i])/inc)*100 : 0);
    renderMarginChart("marginChart", MONTHS, marginData);
  }

  // ================= TRANSACTIONS TABLE =================
  function populateFilterOptions(){
    const monthSelect = $("filterMonth");
    const catSelect = $("filterCategory");
    const currentMonthVal = monthSelect.value;
    const currentCatVal = catSelect.value;

    monthSelect.innerHTML = `<option value="all">All Months</option>` +
      MONTHS.map(m=>`<option value="${m}">${m}</option>`).join("");
    monthSelect.value = currentMonthVal || "all";

    const allCats = [...new Set(transactions.map(t=>t.category))].sort();
    catSelect.innerHTML = `<option value="all">All Categories</option>` +
      allCats.map(c=>`<option value="${c}">${c}</option>`).join("");
    catSelect.value = currentCatVal || "all";
  }

  function setupFilters(){
    $("filterType").addEventListener("change", renderTransactionsTable);
    $("filterMonth").addEventListener("change", renderTransactionsTable);
    $("filterCategory").addEventListener("change", renderTransactionsTable);
    $("searchTx").addEventListener("input", renderTransactionsTable);
  }

  function renderTransactionsTable(){
    const typeFilter = $("filterType").value;
    const monthFilter = $("filterMonth").value;
    const catFilter = $("filterCategory").value;
    const searchTerm = $("searchTx").value.trim().toLowerCase();

    let filtered = transactions.filter(t => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (monthFilter !== "all" && t.month !== monthFilter) return false;
      if (catFilter !== "all" && t.category !== catFilter) return false;
      if (searchTerm && !t.description.toLowerCase().includes(searchTerm)) return false;
      return true;
    });

    filtered.sort((a,b) => new Date(b.date) - new Date(a.date));

    const tbody = $("txTableBody");
    const emptyState = $("txEmptyState");
    if (filtered.length === 0){
      tbody.innerHTML = "";
      emptyState.classList.remove("hidden");
      return;
    }
    emptyState.classList.add("hidden");

    tbody.innerHTML = filtered.map(t => `
      <tr>
        <td>${formatDate(t.date)}</td>
        <td>${escapeHtml(t.description)}</td>
        <td>${escapeHtml(t.category)}</td>
        <td><span class="type-badge ${t.type}">${t.type}</span></td>
        <td class="num-col ${t.type}">${t.type==='expense'?'-':''}${formatINR(t.amount)}</td>
        <td><button class="row-delete-btn" data-id="${t.id}" aria-label="Delete transaction">✕</button></td>
      </tr>
    `).join("");

    tbody.querySelectorAll(".row-delete-btn").forEach(btn=>{
      btn.addEventListener("click", () => deleteTransaction(Number(btn.dataset.id)));
    });
  }

  function deleteTransaction(id){
    transactions = transactions.filter(t => t.id !== id);
    persist();
    renderAll();
  }

  function formatDate(dateStr){
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  }

  function escapeHtml(str){
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ================= INSIGHTS =================
  function renderInsights(){
    const monthly = monthlyTotals();
    const t = totals();
    const catMap = expenseByCategory();
    const sortedCats = Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
    const insights = [];

    // Best and worst month
    let bestIdx = 0, worstIdx = 0;
    const profits = monthly.income.map((v,i)=>v - monthly.expense[i]);
    profits.forEach((p,i)=>{
      if (p > profits[bestIdx]) bestIdx = i;
      if (p < profits[worstIdx]) worstIdx = i;
    });
    insights.push({
      type: "positive",
      icon: "↑",
      title: `${MONTHS[bestIdx]} was your strongest month`,
      text: `Net profit reached ${formatINR(profits[bestIdx])}, the highest of the year. Consider what drove this — seasonal demand, a promotion, or a large order — and see if it can be repeated.`
    });
    if (profits[worstIdx] < profits[bestIdx] * 0.5){
      insights.push({
        type: profits[worstIdx] < 0 ? "warning" : "neutral",
        icon: "↓",
        title: `${MONTHS[worstIdx]} was your weakest month`,
        text: `Net profit was ${formatINR(profits[worstIdx])}. Review expenses and sales activity for this period to identify what held performance back.`
      });
    }

    // Largest expense category
    if (sortedCats.length){
      const [topCat, topAmt] = sortedCats[0];
      const pctOfExpense = ((topAmt/t.expense)*100).toFixed(1);
      insights.push({
        type: "neutral",
        icon: "!",
        title: `${topCat} is your largest expense`,
        text: `It accounts for ${formatINR(topAmt)} — ${pctOfExpense}% of total expenses. Even small efficiencies here would meaningfully improve your margin.`
      });
    }

    // Margin health
    const margin = t.income > 0 ? (t.profit/t.income)*100 : 0;
    if (margin < 10){
      insights.push({
        type: "warning",
        icon: "⚠",
        title: "Profit margin is thin",
        text: `Your overall margin is ${margin.toFixed(1)}%. Margins below 10% leave little cushion for slow months or unexpected costs — review pricing or cost of goods sold.`
      });
    } else if (margin >= 20){
      insights.push({
        type: "positive",
        icon: "✓",
        title: "Healthy profit margin",
        text: `Your overall margin is ${margin.toFixed(1)}%, a healthy buffer for reinvestment or unexpected expenses.`
      });
    }

    // Loss-making months count
    const lossMonths = profits.filter(p => p < 0).length;
    if (lossMonths > 0){
      insights.push({
        type: "warning",
        icon: "✕",
        title: `${lossMonths} month${lossMonths>1?'s':''} recorded a net loss`,
        text: `Out of 12 months, ${lossMonths} ended with expenses exceeding income. Look at whether these align with a predictable slow season or a specific one-off cost.`
      });
    }

    $("insightsList").innerHTML = insights.map(i => `
      <div class="insight-card ${i.type}">
        <div class="insight-icon">${i.icon}</div>
        <div class="insight-text"><b>${i.title}</b>${i.text}</div>
      </div>
    `).join("");
  }

  init();
})();
