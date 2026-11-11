const form = document.getElementById('loan-form');
const scheduleBody = document.getElementById('schedule-body');
const scheduleFooter = document.getElementById('schedule-footer');
const monthlyPaymentEl = document.getElementById('monthly-payment');
const totalPaidEl = document.getElementById('total-paid');
const totalInterestEl = document.getElementById('total-interest');
const durationLabelEl = document.getElementById('duration-label');
const dueDaySelect = document.getElementById('echeance-day');
const specialDayInput = document.getElementById('special-day');
const productSelect = document.getElementById('produit');
const reportProductEl = document.getElementById('report-product');
const reportNameEl = document.getElementById('report-name');
const reportRateEl = document.getElementById('report-rate');
const customerNameInput = document.getElementById('Nom');

const moneyFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const DEFAULT_START_DATE = '2026-01-01';

function formatCurrency(value) {
  return `${moneyFormatter.format(Math.round(Number(value) || 0))} Ar`;
}

function getDayForMonth(targetDate, dueDay, specialDay) {
  const month = targetDate.getMonth() + 1;
  return month === 6 || month === 12 ? Number(specialDay || 22) : Number(dueDay);
}

function getDueDateForMonth(baseDate, monthOffset, dueDay, specialDay) {
  const date = new Date(baseDate);
  date.setMonth(date.getMonth() + monthOffset);
  date.setDate(getDayForMonth(date, dueDay, specialDay));
  return date;
}

function getFirstDueDate(startDate, dueDay, specialDay) {
  const start = new Date(startDate);
  const candidate = getDueDateForMonth(new Date(startDate), 0, dueDay, specialDay);

  if (
    candidate.getFullYear() === start.getFullYear() &&
    candidate.getMonth() === start.getMonth()
  ) {
    return getDueDateForMonth(new Date(startDate), 1, dueDay, specialDay);
  }

  return candidate;
}

function computeAmortization(principal, ratePercent, months, startDate, dueDay, specialDay) {
  const monthsCount = Math.max(1, Number(months));
  const rate = Number(ratePercent) / 100;
  let balance = principal;
  let totalInterest = 0;
  const rows = [];

  const regularPrincipal = Math.floor(principal / monthsCount);
  const firstDueDate = getFirstDueDate(startDate, dueDay, specialDay);
  const firstDays = Math.max(1, Math.round((firstDueDate - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1);

  for (let monthIndex = 0; monthIndex < monthsCount; monthIndex += 1) {
    const currentDueDate = getDueDateForMonth(firstDueDate, monthIndex, dueDay, specialDay);
    const previousDueDate = monthIndex === 0 ? new Date(startDate) : getDueDateForMonth(firstDueDate, monthIndex - 1, dueDay, specialDay);
    let interest;

    if (monthIndex === 0) {
      const daysBetween = Math.max(1, Math.round((currentDueDate - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1);
      interest = Math.ceil((balance * daysBetween * rate) / 30);
    } else {
      const daysBetween = Math.max(1, Math.round((currentDueDate - previousDueDate) / (1000 * 60 * 60 * 24)));
      interest = Math.ceil((balance * daysBetween * rate) / 30);
    }

    let principalPaid = regularPrincipal;
    if (monthIndex === monthsCount - 1) {
      principalPaid = principal - regularPrincipal * (monthsCount - 1);
    }

    const payment = principalPaid + interest;
    balance = Math.max(0, balance - principalPaid);
    totalInterest += interest;

    rows.push({
      date: currentDueDate,
      payment: Math.round(payment),
      interest: Math.ceil(interest),
      principal: Math.round(principalPaid),
      balance: Math.round(balance),
    });
  }

  const totalPaid = principal + totalInterest;
  const averagePayment = monthsCount > 0 ? totalPaid / monthsCount : 0;

  return {
    payment: Math.round(averagePayment),
    totalInterest: Math.round(totalInterest),
    totalPaid: Math.round(totalPaid),
    rows,
  };
}

function formatShortDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

function getMonthCountBetween(startDateText, endDate) {
  const start = new Date(startDateText + 'T00:00:00');
  const end = new Date(endDate);
  const diff = (end.getFullYear() * 12 + end.getMonth()) - (start.getFullYear() * 12 + start.getMonth());
  return Math.max(0, diff);
}


function getSelectedProductLabel() {
  if (!productSelect) return 'RFR';
  return productSelect.value === '2' ? 'Crédit Immobilier (CIM)' : 'Renforcement de fond re roulement (RFR)';
}

function syncProductLabel() {
  if (reportProductEl) {
    reportProductEl.textContent = getSelectedProductLabel();
  }
}

function syncNameLabel() {
  if (reportNameEl) {
    const value = customerNameInput && customerNameInput.value ? customerNameInput.value.trim() : '—';
    reportNameEl.textContent = value;
  }
}

function syncNumberLabel() {
  const reportNumberEl = document.getElementById('report-number');
  if (reportNumberEl) {
    const value = document.getElementById('Numero')?.value?.trim() || '—';
    reportNumberEl.textContent = value;
  }
}

function syncRateColumnHeader() {
  const rateInput = document.getElementById('rate');
  const headerCell = document.querySelector('.detail-table thead th:nth-child(5)');
  const reportRateCell = document.getElementById('report-rate');

  if (!rateInput) return;

  const rateValue = Number(rateInput.value);
  const formattedRate = Number.isFinite(rateValue) && rateValue >= 0 ? `${rateValue}%` : '—';

  if (headerCell) {
    headerCell.textContent = Number.isFinite(rateValue) && rateValue >= 0
      ? `Zana-bola (${rateValue}%)`
      : 'Zana-bola';
  }

  if (reportRateCell) {
    reportRateCell.textContent = formattedRate;
  }
}

function syncDurationLabel() {
  const monthsInput = document.getElementById('months');
  const reportMonthsEl = document.getElementById('report-months');
  if (!monthsInput) return;

  const monthsValue = Number(monthsInput.value);
  const displayValue = Number.isFinite(monthsValue) && monthsValue > 0 ? String(monthsValue) : '0';

  if (reportMonthsEl) {
    reportMonthsEl.textContent = displayValue;
  }

  if (durationLabelEl) {
    durationLabelEl.textContent = `${displayValue} volana`;
  }
}

function renderSchedule(rows, payment, totalPaid, totalInterest, principalAmount = 0, startDateText = '') {
  scheduleBody.innerHTML = '';
  scheduleFooter.innerHTML = '';

  const totalPrincipal = rows.reduce((sum, row) => sum + Number(row.principal || 0), 0);
  const reportPrincipal = Number.isFinite(principalAmount) && principalAmount > 0 ? principalAmount : totalPrincipal;

  rows.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${row.date.toLocaleDateString('fr-FR')}</td>
      <td>${formatCurrency(row.balance)}</td>
      <td>${formatCurrency(row.principal)}</td>
      <td>${formatCurrency(row.interest)}</td>
      <td>${formatCurrency(row.payment)}</td>
    `;
    scheduleBody.appendChild(tr);
  });

  const totalRow = document.createElement('tr');
  totalRow.innerHTML = `
    <td><strong>Total</strong></td>
    <td></td>
    <td></td>
    <td><strong>${formatCurrency(totalPrincipal)}</strong></td>
    <td><strong>${formatCurrency(totalInterest)}</strong></td>
    <td><strong>${formatCurrency(totalPaid)}</strong></td>
  `;
  scheduleFooter.appendChild(totalRow);

  const principalValue = Number(document.getElementById('amount')?.value) || 0;
  const reportNumberEl = document.getElementById('report-number');
  const reportStartDateEl = document.getElementById('report-start-date');
  const reportMonthsEl = document.getElementById('report-months');
  const reportPrincipalEl = document.getElementById('report-principal');
  const reportBalanceEl = document.getElementById('report-balance');
  const reportDateLineEl = document.querySelector('.report-date-line');
  const safeStartDate = (startDateText || document.getElementById('start-date')?.value || DEFAULT_START_DATE);

  if (reportNumberEl) {
    const value = document.getElementById('Numero')?.value?.trim() || '—';
    reportNumberEl.textContent = value;
  }
  if (reportStartDateEl) reportStartDateEl.textContent = formatShortDate(safeStartDate);
  if (reportDateLineEl) {
    reportDateLineEl.textContent = `Natao teto FIANARANTSOA ny ${formatShortDate(safeStartDate)}`;
  }
  if (reportMonthsEl) {
    const selectedMonths = Number(document.getElementById('months')?.value) || rows.length;
    reportMonthsEl.textContent = String(selectedMonths);
  }
  if (reportPrincipalEl) reportPrincipalEl.textContent = moneyFormatter.format(principalValue || reportPrincipal).replace(/\s/g, ' ');
  if (reportBalanceEl) reportBalanceEl.textContent = formatCurrency(rows[rows.length - 1]?.balance ?? 0).replace(' Ar', '');

  if (monthlyPaymentEl) monthlyPaymentEl.textContent = formatCurrency(payment);
  if (totalPaidEl) totalPaidEl.textContent = formatCurrency(totalPaid);
  if (totalInterestEl) totalInterestEl.textContent = formatCurrency(totalInterest);
}

function calculateFromInputs() {
  const principal = Number(document.getElementById('amount').value);
  const ratePercent = Number(document.getElementById('rate').value);
  const months = Number(document.getElementById('months').value);
  const startDate = document.getElementById('start-date').value || DEFAULT_START_DATE;
  const dueDay = Number(dueDaySelect.value);
  const specialDay = Number(specialDayInput.value) || 22;

  if (!Number.isFinite(principal) || principal <= 0) {
    return;
  }

  if (!Number.isFinite(ratePercent) || ratePercent < 0) {
    return;
  }

  if (!Number.isFinite(months) || months <= 0) {
    return;
  }

  if (!startDate) {
    return;
  }

  syncProductLabel();
  syncNameLabel();
  syncNumberLabel();
  syncRateColumnHeader();

  const result = computeAmortization(principal, ratePercent, months, startDate, dueDay, specialDay);
  if (durationLabelEl) durationLabelEl.textContent = `${months} volana`;
  renderSchedule(result.rows, result.payment, result.totalPaid, result.totalInterest, principal, startDate);
}

function onSubmit(event) {
  event.preventDefault();
  calculateFromInputs();
}

form.addEventListener('submit', onSubmit);
document.getElementById('print-table-btn')?.addEventListener('click', () => window.print());

const startDateInput = document.getElementById('start-date');
if (startDateInput && !startDateInput.value) {
  startDateInput.value = DEFAULT_START_DATE;
}

syncProductLabel();
syncNameLabel();
syncNumberLabel();
syncRateColumnHeader();
const initialResult = computeAmortization(1000000, 2.75, 11, (document.getElementById('start-date')?.value || DEFAULT_START_DATE), 25, 22);
if (durationLabelEl) durationLabelEl.textContent = '11 volana';
renderSchedule(initialResult.rows, initialResult.payment, initialResult.totalPaid, initialResult.totalInterest, 1000000, document.getElementById('start-date')?.value || DEFAULT_START_DATE);
