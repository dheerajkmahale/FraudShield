export function formatCurrency(amount, currency = 'INR') {
  if (amount === undefined || amount === null) return '-';
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatDateShort(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function titleCase(str = '') {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
