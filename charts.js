// Small Business Financial Management & Profit Analysis System
// Lightweight SVG chart renderers (no external chart library dependency)

const CHART_COLORS = ["#1C2B39", "#2E7D5B", "#C9A85C", "#B0472F", "#5C6A65", "#7A9E8E", "#D9B98C", "#8B5E4A", "#3E5C6E"];

function formatINR(amount){
  const rounded = Math.round(amount);
  return "₹" + rounded.toLocaleString('en-IN');
}

function formatINRCompact(amount){
  const abs = Math.abs(amount);
  if (abs >= 100000){
    return (amount < 0 ? "-" : "") + "₹" + (abs/100000).toFixed(1) + "L";
  }
  if (abs >= 1000){
    return (amount < 0 ? "-" : "") + "₹" + (abs/1000).toFixed(0) + "K";
  }
  return formatINR(amount);
}

// ---------- Line chart: Revenue vs Expenses ----------
function renderTrendChart(containerId, months, incomeData, expenseData){
  const w = 560, h = 260, padL = 46, padR = 14, padT = 16, padB = 30;
  const maxVal = Math.max(...incomeData, ...expenseData, 1) * 1.1;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const xFor = (i) => padL + (i / (months.length - 1)) * chartW;
  const yFor = (v) => padT + chartH - (v / maxVal) * chartH;

  const incomePoints = incomeData.map((v,i)=>`${xFor(i)},${yFor(v)}`).join(" ");
  const expensePoints = expenseData.map((v,i)=>`${xFor(i)},${yFor(v)}`).join(" ");

  // gridlines (4 horizontal)
  let gridLines = "";
  for (let g=0; g<=3; g++){
    const gy = padT + (chartH/3)*g;
    const val = maxVal - (maxVal/3)*g;
    gridLines += `<line x1="${padL}" y1="${gy}" x2="${w-padR}" y2="${gy}" stroke="#E9EDEC" stroke-width="1"/>`;
    gridLines += `<text x="${padL-8}" y="${gy+4}" font-size="9" text-anchor="end" fill="#8B9793">${formatINRCompact(val)}</text>`;
  }

  const monthLabels = months.map((m,i)=>`<text x="${xFor(i)}" y="${h-8}" font-size="9.5" text-anchor="middle" fill="#5C6A65">${m}</text>`).join("");

  const incomeDots = incomeData.map((v,i)=>`<circle cx="${xFor(i)}" cy="${yFor(v)}" r="3" fill="#2E7D5B"/>`).join("");
  const expenseDots = expenseData.map((v,i)=>`<circle cx="${xFor(i)}" cy="${yFor(v)}" r="3" fill="#B0472F"/>`).join("");

  document.getElementById(containerId).innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;" role="img" aria-label="Revenue versus expenses trend chart">
      ${gridLines}
      <polyline points="${incomePoints}" fill="none" stroke="#2E7D5B" stroke-width="2.2"/>
      <polyline points="${expensePoints}" fill="none" stroke="#B0472F" stroke-width="2.2"/>
      ${incomeDots}
      ${expenseDots}
      ${monthLabels}
    </svg>
    <div style="display:flex;gap:20px;margin-top:10px;font-size:0.78rem;color:#5C6A65;">
      <span style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:50%;background:#2E7D5B;display:inline-block;"></span>Revenue</span>
      <span style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:50%;background:#B0472F;display:inline-block;"></span>Expenses</span>
    </div>
  `;
}

// ---------- Pie chart: Expense breakdown ----------
function renderPieChart(containerId, labels, values){
  const total = values.reduce((a,b)=>a+b,0);
  if (!total || labels.length === 0){
    document.getElementById(containerId).innerHTML = `<p style="color:#8B9793;font-size:0.85rem;text-align:center;padding:30px 0;">No expense data to display yet.</p>`;
    return;
  }
  let cumulative = 0;
  const gradientParts = values.map((v,i)=>{
    const start = (cumulative/total)*360;
    cumulative += v;
    const end = (cumulative/total)*360;
    return `${CHART_COLORS[i % CHART_COLORS.length]} ${start}deg ${end}deg`;
  }).join(", ");

  const legend = labels.map((l,i)=>{
    const pct = ((values[i]/total)*100).toFixed(1);
    return `<div style="display:flex;align-items:center;gap:8px;font-size:0.78rem;margin-bottom:7px;">
      <span style="width:10px;height:10px;border-radius:3px;background:${CHART_COLORS[i%CHART_COLORS.length]};flex-shrink:0;"></span>
      <span style="color:#1C2420;flex:1;">${l}</span>
      <span style="color:#5C6A65;font-weight:600;">${pct}%</span>
    </div>`;
  }).join("");

  document.getElementById(containerId).innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:18px;">
      <div style="width:150px;height:150px;border-radius:50%;background:conic-gradient(${gradientParts});flex-shrink:0;" role="img" aria-label="Expense breakdown pie chart"></div>
      <div style="width:100%;">${legend}</div>
    </div>
  `;
}

// ---------- Bar chart: Monthly net profit ----------
function renderProfitBarChart(containerId, months, profitData){
  const w = 900, h = 220, padL = 50, padR = 14, padT = 16, padB = 30;
  const maxAbs = Math.max(...profitData.map(v=>Math.abs(v))) * 1.15 || 1;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const zeroY = padT + chartH/2;
  const barW = (chartW / months.length) * 0.55;
  const gap = (chartW / months.length);

  let bars = "";
  months.forEach((m,i)=>{
    const v = profitData[i];
    const barH = (Math.abs(v)/maxAbs) * (chartH/2);
    const x = padL + i*gap + (gap-barW)/2;
    const y = v >= 0 ? zeroY - barH : zeroY;
    const color = v >= 0 ? "#2E7D5B" : "#B0472F";
    bars += `<rect x="${x}" y="${y}" width="${barW}" height="${Math.max(barH,1)}" fill="${color}" rx="2"/>`;
    bars += `<text x="${x + barW/2}" y="${h-8}" font-size="10" text-anchor="middle" fill="#5C6A65">${m}</text>`;
  });

  document.getElementById(containerId).innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;" role="img" aria-label="Monthly net profit bar chart">
      <line x1="${padL}" y1="${zeroY}" x2="${w-padR}" y2="${zeroY}" stroke="#1C2B39" stroke-width="1.3"/>
      ${bars}
    </svg>
  `;
}

// ---------- Line chart: Profit margin % ----------
function renderMarginChart(containerId, months, marginData){
  const w = 900, h = 220, padL = 50, padR = 14, padT = 20, padB = 30;
  const maxVal = Math.max(...marginData, 5);
  const minVal = Math.min(...marginData, 0);
  const range = (maxVal - minVal) || 1;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const xFor = (i) => padL + (i / (months.length - 1)) * chartW;
  const yFor = (v) => padT + chartH - ((v - minVal) / range) * chartH;

  const points = marginData.map((v,i)=>`${xFor(i)},${yFor(v)}`).join(" ");
  const dots = marginData.map((v,i)=>`<circle cx="${xFor(i)}" cy="${yFor(v)}" r="3.2" fill="#C9A85C"/>
    <text x="${xFor(i)}" y="${yFor(v)-10}" font-size="9.5" text-anchor="middle" fill="#1C2B39" font-weight="700">${v.toFixed(1)}%</text>`).join("");
  const monthLabels = months.map((m,i)=>`<text x="${xFor(i)}" y="${h-8}" font-size="10" text-anchor="middle" fill="#5C6A65">${m}</text>`).join("");

  const zeroY = yFor(0);
  const zeroLine = (minVal < 0) ? `<line x1="${padL}" y1="${zeroY}" x2="${w-padR}" y2="${zeroY}" stroke="#DDE3E1" stroke-width="1" stroke-dasharray="4,3"/>` : "";

  document.getElementById(containerId).innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;" role="img" aria-label="Monthly profit margin trend chart">
      ${zeroLine}
      <polyline points="${points}" fill="none" stroke="#C9A85C" stroke-width="2.4"/>
      ${dots}
      ${monthLabels}
    </svg>
  `;
}
