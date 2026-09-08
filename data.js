// Small Business Financial Management & Profit Analysis System
// Sample data generator — produces a realistic 12-month transaction set
// for a small retail/trading business (relatable to Indian SME context).

const BUSINESS_NAME = "Baskar Traders";
const BUSINESS_TYPE = "Retail & Wholesale Trading";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CATEGORIES = {
  income: [
    { name: "Product Sales", base: 185000, variance: 0.22 },
    { name: "Service Income", base: 32000, variance: 0.3 },
    { name: "Other Income", base: 6000, variance: 0.5 }
  ],
  expense: [
    { name: "Cost of Goods Sold", base: 98000, variance: 0.2 },
    { name: "Salaries & Wages", base: 42000, variance: 0.05 },
    { name: "Rent", base: 18000, variance: 0.0 },
    { name: "Utilities", base: 6500, variance: 0.15 },
    { name: "Marketing", base: 9000, variance: 0.4 },
    { name: "Transport & Logistics", base: 11000, variance: 0.25 },
    { name: "Office Supplies", base: 3200, variance: 0.3 },
    { name: "Loan Interest", base: 5400, variance: 0.02 },
    { name: "Miscellaneous", base: 2800, variance: 0.35 }
  ]
};

// Seeded pseudo-random for reproducible demo data
function seededRandom(seed){
  let s = seed;
  return function(){
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateTransactions(){
  const rand = seededRandom(42);
  const transactions = [];
  let txId = 1;
  const year = 2025;

  MONTHS.forEach((month, mIdx) => {
    // seasonal multiplier: festive bump in Oct/Nov, slow in Jun/Jul
    let seasonal = 1.0;
    if (mIdx === 9 || mIdx === 10) seasonal = 1.35;      // Oct, Nov - festive season
    if (mIdx === 5 || mIdx === 6) seasonal = 0.85;        // Jun, Jul - slow season
    if (mIdx === 0) seasonal = 0.95;                      // Jan - post holiday dip
    // gradual year-on-year growth trend
    const growthTrend = 1 + (mIdx * 0.012);

    CATEGORIES.income.forEach(cat => {
      const variance = (rand() - 0.5) * 2 * cat.variance;
      const amount = Math.round(cat.base * seasonal * growthTrend * (1 + variance) / 100) * 100;
      transactions.push({
        id: txId++,
        date: `${year}-${String(mIdx+1).padStart(2,'0')}-${String(5 + Math.floor(rand()*20)).padStart(2,'0')}`,
        month: month,
        monthIndex: mIdx,
        type: "income",
        category: cat.name,
        description: `${cat.name} — ${month} ${year}`,
        amount: amount
      });
    });

    CATEGORIES.expense.forEach(cat => {
      const variance = (rand() - 0.5) * 2 * cat.variance;
      // COGS scales with sales seasonally too
      const seasonalFactor = cat.name === "Cost of Goods Sold" ? seasonal : (1 + (seasonal-1)*0.3);
      const amount = Math.round(cat.base * seasonalFactor * growthTrend * (1 + variance) / 100) * 100;
      transactions.push({
        id: txId++,
        date: `${year}-${String(mIdx+1).padStart(2,'0')}-${String(3 + Math.floor(rand()*24)).padStart(2,'0')}`,
        month: month,
        monthIndex: mIdx,
        type: "expense",
        category: cat.name,
        description: `${cat.name} — ${month} ${year}`,
        amount: amount
      });
    });
  });

  return transactions;
}

const SAMPLE_TRANSACTIONS = generateTransactions();
