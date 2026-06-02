export function getLocalDateKey(reference = new Date()) {
  const year = reference.getFullYear();
  const month = `${reference.getMonth() + 1}`.padStart(2, '0');
  const day = `${reference.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysUntil(testDate: string) {
  const diff = new Date(testDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
