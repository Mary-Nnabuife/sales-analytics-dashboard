/**
 * SalesPulse - Sales Analytics Dashboard
 * Pure Vanilla JavaScript: No dependencies, no backend, WebStorage for persistence.
 */

(function () {
  'use strict';

  // --- Storage Key & Constants ---
  const STORAGE_KEY = 'salespulse_transactions_ledger';

  // Palette colors for canvas charts (Direct values - NO CSS variables)
  const COLORS = {
    blue: '#3b82f6',
    blueAlpha: 'rgba(59, 130, 246, 0.25)',
    blueBorder: '#2563eb',
    green: '#10b981',
    greenAlpha: 'rgba(16, 185, 129, 0.25)',
    purple: '#8b5cf6',
    amber: '#f59e0b',
    cyan: '#06b6d4',
    rose: '#f43f5e',
    grid: '#1f2c47',
    textMuted: '#64748b',
    textLight: '#94a3b8',
    cardBg: '#131b2e'
  };

  const CATEGORY_COLORS = {
    Software: '#3b82f6',
    Hardware: '#10b981',
    Consulting: '#8b5cf6',
    Subscriptions: '#f59e0b',
    Support: '#06b6d4'
  };

  // State Management
  let transactions = [];
  let filteredTransactions = [];
  let currentPage = 1;
  const PAGE_SIZE = 8;
  const MONTHLY_TARGET = 150000;

  // Cached DOM Elements
  const elements = {
    // Topbar & Filters
    timeRangeFilter: document.getElementById('time-range-filter'),
    channelFilter: document.getElementById('channel-filter'),
    btnOpenModal: document.getElementById('btn-open-modal'),
    btnResetData: document.getElementById('btn-reset-data'),
    btnExportCsv: document.getElementById('btn-export-csv'),

    // Target Banner
    kpiTargetCurrent: document.getElementById('kpi-target-current'),
    kpiTargetGoal: document.getElementById('kpi-target-goal'),
    kpiTargetPct: document.getElementById('kpi-target-pct'),
    targetProgressFill: document.getElementById('target-progress-fill'),

    // KPI Summary
    kpiRevenue: document.getElementById('kpi-revenue'),
    kpiProfit: document.getElementById('kpi-profit'),
    kpiMargin: document.getElementById('kpi-margin'),
    kpiOrders: document.getElementById('kpi-orders'),
    kpiUnitsSold: document.getElementById('kpi-units-sold'),
    kpiAov: document.getElementById('kpi-aov'),
    kpiRefundRate: document.getElementById('kpi-refund-rate'),

    // Storage Status
    storageRecordCount: document.getElementById('storage-record-count'),
    storageBarFill: document.getElementById('storage-bar-fill'),

    // Charts
    trendCanvas: document.getElementById('trendChart'),
    trendTooltip: document.getElementById('trendChartTooltip'),
    categoryDonutCanvas: document.getElementById('categoryDonutChart'),
    donutCenterValue: document.getElementById('donut-center-value'),
    categoryLegend: document.getElementById('category-legend'),
    channelCanvas: document.getElementById('channelChart'),
    channelTooltip: document.getElementById('channelChartTooltip'),
    regionCanvas: document.getElementById('regionChart'),
    regionTooltip: document.getElementById('regionChartTooltip'),

    // Products
    topProductsList: document.getElementById('top-products-list'),

    // Table & Pagination
    tableSearchInput: document.getElementById('table-search-input'),
    tableStatusFilter: document.getElementById('table-status-filter'),
    transactionsTbody: document.getElementById('transactions-tbody'),
    paginationInfo: document.getElementById('pagination-info'),
    pageIndicator: document.getElementById('page-indicator'),
    btnPagePrev: document.getElementById('btn-page-prev'),
    btnPageNext: document.getElementById('btn-page-next'),

    // Modal
    modalOverlay: document.getElementById('sale-modal-overlay'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    btnCancelModal: document.getElementById('btn-cancel-modal'),
    saleForm: document.getElementById('sale-form'),
    saleDateInput: document.getElementById('sale-date'),

    // Toast
    toastContainer: document.getElementById('toast-container'),

    // Sidebar navigation
    menuItems: document.querySelectorAll('.sidebar-menu .menu-item')
  };

  // --- Initial Demo Data Generator ---
  function getSampleTransactions() {
    const today = new Date();
    const customers = [
      { name: 'Sarah Jenkins', email: 's.jenkins@apextech.io' },
      { name: 'Marcus Vance', email: 'marcus.v@novacorp.com' },
      { name: 'Elena Rostova', email: 'elena@helioslabs.net' },
      { name: 'David Kim', email: 'dkim@quantumflow.ai' },
      { name: 'Amara Okafor', email: 'amara@stratos.co' },
      { name: 'Carlos Mendez', email: 'carlos@solaris-bi.com' },
      { name: 'Sophia Chen', email: 'sophia.c@omnicloud.org' },
      { name: 'Liam O’Connor', email: 'liam@celticventures.ie' },
      { name: 'Olivia Martin', email: 'o.martin@vanguard.io' },
      { name: 'Tariq Al-Mansoor', email: 'tariq@horizon-uae.com' },
      { name: 'Hannah Schmidt', email: 'hannah@bavariagroup.de' },
      { name: 'Lucas Silva', email: 'lsilva@atlantico-tech.br' }
    ];

    const catalog = [
      { product: 'Enterprise Cloud Suite', category: 'Software', price: 1250, cost: 350 },
      { product: 'AI Data Intelligence License', category: 'Software', price: 2400, cost: 600 },
      { product: 'NextGen Server Rack Unit', category: 'Hardware', price: 3800, cost: 2600 },
      { product: 'Strategic Cloud Architecture', category: 'Consulting', price: 4500, cost: 1800 },
      { product: 'Monthly Security Retainer', category: 'Subscriptions', price: 650, cost: 150 },
      { product: '24/7 Dedicated Support Tier', category: 'Support', price: 890, cost: 220 },
      { product: 'IoT Edge Gateway Pro', category: 'Hardware', price: 1550, cost: 950 },
      { product: 'Microservices Modernization', category: 'Consulting', price: 5200, cost: 2100 },
      { product: 'Developer Seat License (Annual)', category: 'Software', price: 480, cost: 90 },
      { product: 'Compliance & Audit Review', category: 'Consulting', price: 3100, cost: 1100 }
    ];

    const channels = ['Online', 'B2B Wholesale', 'Direct Sales', 'Marketplace'];
    const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa'];
    const payments = ['Credit Card', 'Bank Transfer', 'PayPal', 'Crypto'];
    const statuses = ['Completed', 'Completed', 'Completed', 'Completed', 'Pending', 'Refunded'];

    const samples = [];
    let orderNum = 10420;

    // Generate 55 realistic transactions spread over last 60 days
    for (let i = 0; i < 55; i++) {
      const daysAgo = Math.floor(Math.pow(Math.random(), 1.4) * 60);
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);

      const cust = customers[Math.floor(Math.random() * customers.length)];
      const item = catalog[Math.floor(Math.random() * catalog.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      const channel = channels[Math.floor(Math.random() * channels.length)];
      const region = regions[Math.floor(Math.random() * regions.length)];
      const payment = payments[Math.floor(Math.random() * payments.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      samples.push({
        id: 'ORD-' + (orderNum++),
        date: date.toISOString().split('T')[0],
        customer: cust.name,
        email: cust.email,
        product: item.product,
        category: item.category,
        channel: channel,
        region: region,
        qty: qty,
        unitPrice: item.price,
        unitCost: item.cost,
        totalAmount: item.price * qty,
        totalCost: item.cost * qty,
        paymentMethod: payment,
        status: status
      });
    }

    // Sort descending by date
    return samples.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // --- LocalStorage Persistence Layer ---
  function loadTransactions() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        transactions = JSON.parse(stored);
      } else {
        transactions = getSampleTransactions();
        saveTransactions();
      }
    } catch (err) {
      console.error('Failed to parse WebStorage:', err);
      transactions = getSampleTransactions();
    }
    updateStorageStatus();
  }

  function saveTransactions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
      updateStorageStatus();
    } catch (err) {
      showToast('WebStorage full or inaccessible!', 'danger');
    }
  }

  function updateStorageStatus() {
    if (!elements.storageRecordCount) return;
    const count = transactions.length;
    elements.storageRecordCount.textContent = `${count} transactions recorded`;
    
    // Approximate storage estimation
    const bytes = new Blob([localStorage.getItem(STORAGE_KEY) || '']).size;
    const kb = (bytes / 1024).toFixed(1);
    const pct = Math.min(100, Math.max(5, (bytes / 5000000) * 100)).toFixed(1);
    elements.storageBarFill.style.width = pct + '%';
  }

  // --- Formatters ---
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatCurrencyPrecise(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  function formatShortNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  }

  // --- Filtering Logic ---
  function applyFilters() {
    const timeRange = elements.timeRangeFilter.value;
    const channel = elements.channelFilter.value;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    filteredTransactions = transactions.filter(t => {
      // Channel match
      if (channel !== 'all' && t.channel !== channel) return false;

      // Time match
      if (timeRange === 'all') return true;

      const tDate = new Date(t.date);
      const diffDays = Math.floor((now - tDate) / (1000 * 60 * 60 * 24));

      if (timeRange === 'today') {
        return t.date === todayStr;
      } else if (timeRange === '7d') {
        return diffDays <= 7 && diffDays >= 0;
      } else if (timeRange === '30d') {
        return diffDays <= 30 && diffDays >= 0;
      } else if (timeRange === '90d') {
        return diffDays <= 90 && diffDays >= 0;
      } else if (timeRange === 'this-year') {
        return tDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    currentPage = 1;
    renderAll();
  }

  // --- KPI Calculation & Rendering ---
  function renderKPIs() {
    let grossRevenue = 0;
    let totalCost = 0;
    let completedOrders = 0;
    let totalUnits = 0;
    let refundedOrders = 0;

    filteredTransactions.forEach(t => {
      if (t.status === 'Completed') {
        grossRevenue += t.totalAmount;
        totalCost += t.totalCost;
        completedOrders++;
        totalUnits += t.qty;
      } else if (t.status === 'Pending') {
        grossRevenue += t.totalAmount;
        totalCost += t.totalCost;
        totalUnits += t.qty;
      } else if (t.status === 'Refunded') {
        refundedOrders++;
      }
    });

    const netProfit = grossRevenue - totalCost;
    const profitMargin = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : '0.0';
    const aov = completedOrders > 0 ? (grossRevenue / completedOrders) : 0;
    const refundRate = filteredTransactions.length > 0 ? ((refundedOrders / filteredTransactions.length) * 100).toFixed(1) : '0.0';

    // Render KPI values
    elements.kpiRevenue.textContent = formatCurrencyPrecise(grossRevenue);
    elements.kpiProfit.textContent = formatCurrencyPrecise(netProfit);
    elements.kpiMargin.textContent = `${profitMargin}% margin`;
    elements.kpiOrders.textContent = filteredTransactions.length.toString();
    elements.kpiUnitsSold.textContent = `${totalUnits} units sold`;
    elements.kpiAov.textContent = formatCurrencyPrecise(aov);
    elements.kpiRefundRate.textContent = `${refundRate}% refund rate`;

    // Target banner computation (current month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentMonthRevenue = transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.status !== 'Refunded';
      })
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const targetPct = Math.min(100, Math.round((currentMonthRevenue / MONTHLY_TARGET) * 100));
    elements.kpiTargetCurrent.textContent = formatCurrency(currentMonthRevenue);
    elements.kpiTargetGoal.textContent = formatCurrency(MONTHLY_TARGET);
    elements.kpiTargetPct.textContent = `${targetPct}% reached`;
    elements.targetProgressFill.style.width = `${targetPct}%`;
  }

  // --- High-DPI Canvas Setup Helper ---
  function setupCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, width: rect.width, height: rect.height };
  }

  // --- Chart 1: Revenue & Profit Trend Chart ---
  let trendPoints = []; // for tooltip interaction

  function renderTrendChart() {
    const canvas = elements.trendCanvas;
    if (!canvas || !canvas.offsetWidth) return;
    const { ctx, width, height } = setupCanvas(canvas);

    // Aggregate by date (last 14 active days or chronological sequence)
    const dateMap = {};
    const sortedList = [...filteredTransactions]
      .filter(t => t.status !== 'Refunded')
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // If empty data
    if (sortedList.length === 0) {
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '14px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No transaction data in this filter range', width / 2, height / 2);
      return;
    }

    sortedList.forEach(t => {
      if (!dateMap[t.date]) {
        dateMap[t.date] = { revenue: 0, profit: 0 };
      }
      dateMap[t.date].revenue += t.totalAmount;
      dateMap[t.date].profit += (t.totalAmount - t.totalCost);
    });

    const dates = Object.keys(dateMap);
    // Limit to max 14 points for visual breathing room
    let displayDates = dates;
    if (dates.length > 14) {
      const step = Math.ceil(dates.length / 14);
      displayDates = dates.filter((_, idx) => idx % step === 0 || idx === dates.length - 1);
    }

    const revValues = displayDates.map(d => dateMap[d].revenue);
    const profValues = displayDates.map(d => dateMap[d].profit);

    const maxVal = Math.max(...revValues, 1000) * 1.15;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;
    const chartW = width - paddingLeft - paddingRight;
    const chartH = height - paddingTop - paddingBottom;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw Grid Lines & Y-axis labels
    const gridRows = 4;
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'right';

    for (let i = 0; i <= gridRows; i++) {
      const y = paddingTop + (chartH / gridRows) * i;
      const val = maxVal - (maxVal / gridRows) * i;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();
      ctx.fillText('$' + formatShortNumber(Math.round(val)), paddingLeft - 8, y + 4);
    }

    // Calculate coordinates
    trendPoints = displayDates.map((date, idx) => {
      const x = paddingLeft + (chartW / (displayDates.length - 1 || 1)) * idx;
      const yRev = paddingTop + chartH - (dateMap[date].revenue / maxVal) * chartH;
      const yProf = paddingTop + chartH - (dateMap[date].profit / maxVal) * chartH;
      return {
        x,
        yRev,
        yProf,
        date,
        revenue: dateMap[date].revenue,
        profit: dateMap[date].profit
      };
    });

    // Draw Area under Revenue line
    if (trendPoints.length > 0) {
      const gradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartH);
      gradient.addColorStop(0, COLORS.blueAlpha);
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

      ctx.beginPath();
      ctx.moveTo(trendPoints[0].x, paddingTop + chartH);
      trendPoints.forEach(pt => ctx.lineTo(pt.x, pt.yRev));
      ctx.lineTo(trendPoints[trendPoints.length - 1].x, paddingTop + chartH);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Revenue Stroke
      ctx.beginPath();
      ctx.strokeStyle = COLORS.blue;
      ctx.lineWidth = 3;
      trendPoints.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.yRev);
        else ctx.lineTo(pt.x, pt.yRev);
      });
      ctx.stroke();

      // Profit Stroke
      ctx.beginPath();
      ctx.strokeStyle = COLORS.green;
      ctx.lineWidth = 2.5;
      trendPoints.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.yProf);
        else ctx.lineTo(pt.x, pt.yProf);
      });
      ctx.stroke();

      // Data Point Dots
      trendPoints.forEach(pt => {
        // Rev dot
        ctx.beginPath();
        ctx.arc(pt.x, pt.yRev, 4, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.blue;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Prof dot
        ctx.beginPath();
        ctx.arc(pt.x, pt.yProf, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.green;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // X-axis Date Labels
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '10px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      const labelInterval = Math.max(1, Math.floor(trendPoints.length / 6));

      trendPoints.forEach((pt, idx) => {
        if (idx % labelInterval === 0 || idx === trendPoints.length - 1) {
          const dateObj = new Date(pt.date);
          const formatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          ctx.fillText(formatted, pt.x, height - 12);
        }
      });
    }
  }

  // --- Chart 2: Category Donut Chart ---
  let donutSlices = [];

  function renderCategoryDonut() {
    const canvas = elements.categoryDonutCanvas;
    if (!canvas || !canvas.offsetWidth) return;
    const { ctx, width, height } = setupCanvas(canvas);

    // Aggregate by category
    const catMap = { Software: 0, Hardware: 0, Consulting: 0, Subscriptions: 0, Support: 0 };
    let grandTotal = 0;

    filteredTransactions.forEach(t => {
      if (t.status !== 'Refunded') {
        const cat = catMap.hasOwnProperty(t.category) ? t.category : 'Software';
        catMap[cat] = (catMap[cat] || 0) + t.totalAmount;
        grandTotal += t.totalAmount;
      }
    });

    elements.donutCenterValue.textContent = formatShortNumber(grandTotal);

    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(centerX, centerY) - 10;
    const innerRadius = outerRadius * 0.65;

    ctx.clearRect(0, 0, width, height);
    donutSlices = [];

    if (grandTotal === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = outerRadius - innerRadius;
      ctx.stroke();
      elements.categoryLegend.innerHTML = '<div style="color:#64748b;font-size:0.8rem;text-align:center;">No data available</div>';
      return;
    }

    let startAngle = -Math.PI / 2;
    let legendHtml = '';

    Object.keys(catMap).forEach(cat => {
      const val = catMap[cat];
      if (val === 0) return;

      const sliceAngle = (val / grandTotal) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;
      const color = CATEGORY_COLORS[cat] || COLORS.blue;

      // Draw Arc
      ctx.beginPath();
      ctx.arc(centerX, centerY, (outerRadius + innerRadius) / 2, startAngle, endAngle);
      ctx.strokeStyle = color;
      ctx.lineWidth = outerRadius - innerRadius;
      ctx.stroke();

      donutSlices.push({
        category: cat,
        amount: val,
        percentage: ((val / grandTotal) * 100).toFixed(1),
        startAngle,
        endAngle,
        color
      });

      startAngle = endAngle;

      // Legend Item
      legendHtml += `
        <div class="donut-legend-row">
          <div class="donut-legend-label">
            <span class="donut-legend-dot" style="background-color: ${color}"></span>
            <span>${cat}</span>
          </div>
          <span class="donut-legend-pct">${formatCurrency(val)} (${((val / grandTotal) * 100).toFixed(0)}%)</span>
        </div>
      `;
    });

    elements.categoryLegend.innerHTML = legendHtml;
  }

  // --- Chart 3: Channel Breakdown Bar Chart ---
  let channelBars = [];

  function renderChannelChart() {
    const canvas = elements.channelCanvas;
    if (!canvas || !canvas.offsetWidth) return;
    const { ctx, width, height } = setupCanvas(canvas);

    const channelMap = {
      'Online': 0,
      'B2B Wholesale': 0,
      'Direct Sales': 0,
      'Marketplace': 0
    };

    filteredTransactions.forEach(t => {
      if (t.status !== 'Refunded' && channelMap.hasOwnProperty(t.channel)) {
        channelMap[t.channel] += t.totalAmount;
      }
    });

    const channels = Object.keys(channelMap);
    const maxVal = Math.max(...Object.values(channelMap), 1000) * 1.15;

    const padLeft = 85;
    const padRight = 30;
    const padTop = 15;
    const padBottom = 25;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    ctx.clearRect(0, 0, width, height);
    channelBars = [];

    const barHeight = 22;
    const gap = (chartH - (barHeight * channels.length)) / (channels.length + 1);

    channels.forEach((ch, idx) => {
      const val = channelMap[ch];
      const y = padTop + gap + idx * (barHeight + gap);
      const barW = (val / maxVal) * chartW;

      // Track hit test
      channelBars.push({ x: padLeft, y, width: barW, height: barHeight, label: ch, value: val });

      // Channel Label
      ctx.fillStyle = COLORS.textLight;
      ctx.font = '11px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(ch, padLeft - 10, y + 15);

      // Bar Background track
      ctx.fillStyle = '#0d1322';
      roundRect(ctx, padLeft, y, chartW, barHeight, 6);
      ctx.fill();

      // Colored Bar
      const grad = ctx.createLinearGradient(padLeft, 0, padLeft + barW, 0);
      grad.addColorStop(0, COLORS.blue);
      grad.addColorStop(1, '#6366f1');
      ctx.fillStyle = grad;
      roundRect(ctx, padLeft, y, Math.max(barW, 4), barHeight, 6);
      ctx.fill();

      // Value Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(formatShortNumber(val), padLeft + barW + 8, y + 15);
    });
  }

  // --- Chart 4: Regional Performance Chart ---
  let regionBars = [];

  function renderRegionChart() {
    const canvas = elements.regionCanvas;
    if (!canvas || !canvas.offsetWidth) return;
    const { ctx, width, height } = setupCanvas(canvas);

    const regionMap = {
      'North America': 0,
      'Europe': 0,
      'Asia Pacific': 0,
      'Latin America': 0,
      'Middle East': 0
    };

    filteredTransactions.forEach(t => {
      if (t.status !== 'Refunded') {
        const key = t.region.includes('Middle East') ? 'Middle East' : t.region;
        if (regionMap.hasOwnProperty(key)) {
          regionMap[key] += t.totalAmount;
        }
      }
    });

    const regions = Object.keys(regionMap);
    const maxVal = Math.max(...Object.values(regionMap), 1000) * 1.15;

    const padLeft = 85;
    const padRight = 30;
    const padTop = 15;
    const padBottom = 25;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    ctx.clearRect(0, 0, width, height);
    regionBars = [];

    const barHeight = 22;
    const gap = (chartH - (barHeight * regions.length)) / (regions.length + 1);

    regions.forEach((reg, idx) => {
      const val = regionMap[reg];
      const y = padTop + gap + idx * (barHeight + gap);
      const barW = (val / maxVal) * chartW;

      regionBars.push({ x: padLeft, y, width: barW, height: barHeight, label: reg, value: val });

      // Region Label
      ctx.fillStyle = COLORS.textLight;
      ctx.font = '11px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(reg, padLeft - 10, y + 15);

      // Background track
      ctx.fillStyle = '#0d1322';
      roundRect(ctx, padLeft, y, chartW, barHeight, 6);
      ctx.fill();

      // Colored Bar
      const grad = ctx.createLinearGradient(padLeft, 0, padLeft + barW, 0);
      grad.addColorStop(0, COLORS.green);
      grad.addColorStop(1, '#059669');
      ctx.fillStyle = grad;
      roundRect(ctx, padLeft, y, Math.max(barW, 4), barHeight, 6);
      ctx.fill();

      // Value label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(formatShortNumber(val), padLeft + barW + 8, y + 15);
    });
  }

  // Canvas helper for rounded rectangles
  function roundRect(ctx, x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  // --- Top Products Leaderboard ---
  function renderTopProducts() {
    const productStats = {};

    filteredTransactions.forEach(t => {
      if (t.status !== 'Refunded') {
        if (!productStats[t.product]) {
          productStats[t.product] = {
            product: t.product,
            category: t.category,
            units: 0,
            revenue: 0
          };
        }
        productStats[t.product].units += t.qty;
        productStats[t.product].revenue += t.totalAmount;
      }
    });

    const sortedProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    if (sortedProducts.length === 0) {
      elements.topProductsList.innerHTML = '<div style="color:#64748b;font-size:0.85rem;padding:12px;text-align:center;">No products sold in this period</div>';
      return;
    }

    elements.topProductsList.innerHTML = sortedProducts
      .map((item, idx) => `
        <div class="product-item">
          <div class="product-info-col">
            <span class="product-rank">#${idx + 1}</span>
            <div class="product-details">
              <h4>${escapeHtml(item.product)}</h4>
              <span>${escapeHtml(item.category)}</span>
            </div>
          </div>
          <div class="product-metrics-col">
            <div class="product-revenue">${formatCurrency(item.revenue)}</div>
            <div class="product-units">${item.units} sold</div>
          </div>
        </div>
      `).join('');
  }

  // --- Transactions Table & Pagination ---
  function renderTransactionsTable() {
    const searchTerm = (elements.tableSearchInput.value || '').toLowerCase().trim();
    const statusFilter = elements.tableStatusFilter.value;

    let displayList = filteredTransactions.filter(t => {
      // Status filter
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;

      // Search term
      if (searchTerm) {
        const matchesId = t.id.toLowerCase().includes(searchTerm);
        const matchesCust = t.customer.toLowerCase().includes(searchTerm);
        const matchesProd = t.product.toLowerCase().includes(searchTerm);
        const matchesEmail = t.email ? t.email.toLowerCase().includes(searchTerm) : false;
        return matchesId || matchesCust || matchesProd || matchesEmail;
      }
      return true;
    });

    const totalRecords = displayList.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const paginatedItems = displayList.slice(startIdx, startIdx + PAGE_SIZE);

    if (paginatedItems.length === 0) {
      elements.transactionsTbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center;padding:24px;color:#64748b;">
            No transactions match your search or filter.
          </td>
        </tr>
      `;
    } else {
      elements.transactionsTbody.innerHTML = paginatedItems.map(t => {
        let statusClass = 'status-completed';
        if (t.status === 'Pending') statusClass = 'status-pending';
        if (t.status === 'Refunded') statusClass = 'status-refunded';

        return `
          <tr>
            <td><span class="order-id-badge">${escapeHtml(t.id)}</span></td>
            <td>${escapeHtml(t.date)}</td>
            <td>
              <div class="customer-cell">${escapeHtml(t.customer)}</div>
              <span class="customer-email-sub">${escapeHtml(t.email || 'N/A')}</span>
            </td>
            <td>${escapeHtml(t.product)}</td>
            <td>${escapeHtml(t.category)}</td>
            <td>${escapeHtml(t.channel)}</td>
            <td style="font-weight:700;color:#ffffff;">${formatCurrencyPrecise(t.totalAmount)}</td>
            <td><span class="status-badge ${statusClass}">${escapeHtml(t.status)}</span></td>
            <td>
              <button type="button" class="table-action-btn" data-delete-id="${escapeHtml(t.id)}" title="Delete sale">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Pagination info & controls
    const endCount = Math.min(startIdx + PAGE_SIZE, totalRecords);
    elements.paginationInfo.textContent = totalRecords === 0 
      ? 'Showing 0 to 0 of 0 entries'
      : `Showing ${startIdx + 1} to ${endCount} of ${totalRecords} entries`;

    elements.pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
    elements.btnPagePrev.disabled = (currentPage <= 1);
    elements.btnPageNext.disabled = (currentPage >= totalPages);
  }

  // --- Export Data to CSV ---
  function exportCSV() {
    if (filteredTransactions.length === 0) {
      showToast('No transaction data to export!', 'danger');
      return;
    }

    const headers = ['Order ID', 'Date', 'Customer', 'Email', 'Product', 'Category', 'Channel', 'Region', 'Quantity', 'Unit Price', 'Total Amount', 'Status', 'Payment Method'];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.date,
      `"${t.customer.replace(/"/g, '""')}"`,
      `"${(t.email || '').replace(/"/g, '""')}"`,
      `"${t.product.replace(/"/g, '""')}"`,
      t.category,
      t.channel,
      t.region,
      t.qty,
      t.unitPrice,
      t.totalAmount,
      t.status,
      t.paymentMethod
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `salespulse_export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Sales report exported to CSV successfully.', 'success');
  }

  // --- Reset to Sample Data ---
  function resetToDemoData() {
    if (confirm('Reset sales ledger back to default demo records? Your custom additions will be cleared.')) {
      transactions = getSampleTransactions();
      saveTransactions();
      applyFilters();
      showToast('Sales records restored to sample dataset.', 'success');
    }
  }

  // --- Toast Notifications ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        ${type === 'danger' ? '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>' : '<polyline points="20 6 9 17 4 12"></polyline>'}
      </svg>
      <span>${escapeHtml(message)}</span>
    `;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  // Helper: Escape HTML
  function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // --- Modal Management ---
  function openSaleModal() {
    elements.saleDateInput.value = new Date().toISOString().split('T')[0];
    elements.saleForm.reset();
    elements.saleDateInput.value = new Date().toISOString().split('T')[0];
    elements.modalOverlay.classList.add('active');
  }

  function closeSaleModal() {
    elements.modalOverlay.classList.remove('active');
  }

  function handleSaleSubmit(e) {
    e.preventDefault();

    const customer = document.getElementById('sale-customer').value.trim();
    const email = document.getElementById('sale-email').value.trim();
    const date = elements.saleDateInput.value;
    const product = document.getElementById('sale-product').value.trim();
    const category = document.getElementById('sale-category').value;
    const channel = document.getElementById('sale-channel').value;
    const region = document.getElementById('sale-region').value;
    const qty = parseInt(document.getElementById('sale-qty').value, 10) || 1;
    const price = parseFloat(document.getElementById('sale-price').value) || 0;
    const cost = parseFloat(document.getElementById('sale-cost').value) || 0;
    const payment = document.getElementById('sale-payment').value;
    const status = document.getElementById('sale-status').value;

    const newRecord = {
      id: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
      date,
      customer,
      email: email || `${customer.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      product,
      category,
      channel,
      region,
      qty,
      unitPrice: price,
      unitCost: cost,
      totalAmount: price * qty,
      totalCost: cost * qty,
      paymentMethod: payment,
      status
    };

    // Prepend to transaction array
    transactions.unshift(newRecord);
    saveTransactions();
    applyFilters();
    closeSaleModal();

    showToast(`New sale ${newRecord.id} recorded successfully!`, 'success');
  }

  // --- Master Render Pipeline ---
  function renderAll() {
    renderKPIs();
    renderTrendChart();
    renderCategoryDonut();
    renderChannelChart();
    renderRegionChart();
    renderTopProducts();
    renderTransactionsTable();
  }

  // --- Interactive Canvas Tooltips ---
  function setupTooltips() {
    // Trend chart tooltip
    elements.trendCanvas.addEventListener('mousemove', e => {
      if (trendPoints.length === 0) return;
      const rect = elements.trendCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let closest = null;
      let minDistance = 35; // threshold

      trendPoints.forEach(pt => {
        const dist = Math.abs(pt.x - mouseX);
        if (dist < minDistance) {
          minDistance = dist;
          closest = pt;
        }
      });

      if (closest) {
        elements.trendTooltip.style.opacity = '1';
        elements.trendTooltip.style.left = `${closest.x}px`;
        elements.trendTooltip.style.top = `${closest.yRev - 10}px`;
        elements.trendTooltip.innerHTML = `
          <div style="font-size:0.7rem;color:#94a3b8;margin-bottom:3px;">${closest.date}</div>
          <div style="color:#3b82f6;">Revenue: ${formatCurrencyPrecise(closest.revenue)}</div>
          <div style="color:#10b981;">Profit: ${formatCurrencyPrecise(closest.profit)}</div>
        `;
      } else {
        elements.trendTooltip.style.opacity = '0';
      }
    });

    elements.trendCanvas.addEventListener('mouseleave', () => {
      elements.trendTooltip.style.opacity = '0';
    });

    // Channel chart tooltip
    elements.channelCanvas.addEventListener('mousemove', e => {
      const rect = elements.channelCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let found = null;
      channelBars.forEach(b => {
        if (mouseY >= b.y && mouseY <= b.y + b.height && mouseX >= b.x && mouseX <= b.x + b.width + 50) {
          found = b;
        }
      });

      if (found) {
        elements.channelTooltip.style.opacity = '1';
        elements.channelTooltip.style.left = `${found.x + found.width / 2}px`;
        elements.channelTooltip.style.top = `${found.y}px`;
        elements.channelTooltip.innerHTML = `
          <div style="font-weight:700;">${found.label}</div>
          <div style="color:#3b82f6;">${formatCurrencyPrecise(found.value)}</div>
        `;
      } else {
        elements.channelTooltip.style.opacity = '0';
      }
    });

    elements.channelCanvas.addEventListener('mouseleave', () => {
      elements.channelTooltip.style.opacity = '0';
    });

    // Region chart tooltip
    elements.regionCanvas.addEventListener('mousemove', e => {
      const rect = elements.regionCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let found = null;
      regionBars.forEach(b => {
        if (mouseY >= b.y && mouseY <= b.y + b.height && mouseX >= b.x && mouseX <= b.x + b.width + 50) {
          found = b;
        }
      });

      if (found) {
        elements.regionTooltip.style.opacity = '1';
        elements.regionTooltip.style.left = `${found.x + found.width / 2}px`;
        elements.regionTooltip.style.top = `${found.y}px`;
        elements.regionTooltip.innerHTML = `
          <div style="font-weight:700;">${found.label}</div>
          <div style="color:#10b981;">${formatCurrencyPrecise(found.value)}</div>
        `;
      } else {
        elements.regionTooltip.style.opacity = '0';
      }
    });

    elements.regionCanvas.addEventListener('mouseleave', () => {
      elements.regionTooltip.style.opacity = '0';
    });
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Filter controls
    elements.timeRangeFilter.addEventListener('change', applyFilters);
    elements.channelFilter.addEventListener('change', applyFilters);

    // Export & Reset
    elements.btnExportCsv.addEventListener('click', exportCSV);
    elements.btnResetData.addEventListener('click', resetToDemoData);

    // Modal controls
    elements.btnOpenModal.addEventListener('click', openSaleModal);
    elements.btnCloseModal.addEventListener('click', closeSaleModal);
    elements.btnCancelModal.addEventListener('click', closeSaleModal);
    elements.modalOverlay.addEventListener('click', e => {
      if (e.target === elements.modalOverlay) closeSaleModal();
    });
    elements.saleForm.addEventListener('submit', handleSaleSubmit);

    // Table search & filter
    elements.tableSearchInput.addEventListener('input', () => {
      currentPage = 1;
      renderTransactionsTable();
    });
    elements.tableStatusFilter.addEventListener('change', () => {
      currentPage = 1;
      renderTransactionsTable();
    });

    // Pagination
    elements.btnPagePrev.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderTransactionsTable();
      }
    });
    elements.btnPageNext.addEventListener('click', () => {
      currentPage++;
      renderTransactionsTable();
    });

    // Delegated table row deletion
    elements.transactionsTbody.addEventListener('click', e => {
      const deleteBtn = e.target.closest('[data-delete-id]');
      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-delete-id');
        if (confirm(`Are you sure you want to delete transaction ${id}?`)) {
          transactions = transactions.filter(t => t.id !== id);
          saveTransactions();
          applyFilters();
          showToast(`Transaction ${id} removed.`, 'danger');
        }
      }
    });

    // Window resize (rerender canvas for high-DPI scaling)
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        renderTrendChart();
        renderCategoryDonut();
        renderChannelChart();
        renderRegionChart();
      }, 150);
    });

    // Sidebar navigation active state
    elements.menuItems.forEach(item => {
      item.addEventListener('click', e => {
        elements.menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  }

  // --- Application Initialization ---
  function init() {
    loadTransactions();
    setupEventListeners();
    setupTooltips();
    applyFilters();
  }

  // Boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

