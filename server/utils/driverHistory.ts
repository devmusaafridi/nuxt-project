// Given a truck/excavator's driver rows (any mix of active/inactive), find whichever
// one was actually assigned on a given date — the most recently created row that
// existed by end of that day. Driver replacement never leaves gaps (the old row is
// retired the same moment the new one is created), so this reconstructs history
// exactly even though only created_at is stored, not a validity end date.
export function pickDriverAsOf<T extends { created_at: string }>(rows: T[], dateISO: string): T | null {
  const cutoff = new Date(`${dateISO}T23:59:59.999Z`).getTime()
  let latest: T | null = null
  for (const row of rows) {
    const createdAt = new Date(row.created_at).getTime()
    if (createdAt <= cutoff && (!latest || createdAt > new Date(latest.created_at).getTime())) {
      latest = row
    }
  }
  return latest
}
