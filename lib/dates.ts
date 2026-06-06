export function getLocalDateKey(reference = new Date()) {
  const year = reference.getFullYear();
  const month = `${reference.getMonth() + 1}`.padStart(2, '0');
  const day = `${reference.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateAfterDays(days: number, reference = new Date()) {
  const next = new Date(reference);
  next.setDate(next.getDate() + days);
  return getLocalDateKey(next);
}

function parseLocalDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return new Date(dateKey);
  return new Date(year, month - 1, day);
}

export function daysUntil(testDate: string, reference = new Date()) {
  const referenceDate = parseLocalDate(getLocalDateKey(reference));
  const diff = parseLocalDate(testDate).getTime() - referenceDate.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
