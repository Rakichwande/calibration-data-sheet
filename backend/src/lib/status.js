// Shared bucket logic for instrument due dates — used by both the
// Instrument Directory and the Due Date Tracker so the two pages never disagree.
function computeStatus(dueDate, today = new Date()) {
  if (!dueDate) return 'no_due_date';

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const ref = new Date(today);
  ref.setHours(0, 0, 0, 0);

  const diffDays = (due - ref) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 7) return 'due_soon';
  return 'on_track';
}

module.exports = { computeStatus };
