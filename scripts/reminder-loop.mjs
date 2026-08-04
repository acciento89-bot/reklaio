const reminderUrl = process.env.REMINDER_URL ?? "http://reklaio:3000/api/internal/deadline-reminders";
const secret = process.env.CRON_SECRET;
const intervalMs = Number(process.env.REMINDER_INTERVAL_MS ?? 3_600_000);

if (!secret) {
  console.error("CRON_SECRET is required for the reminder worker");
  process.exit(1);
}

if (!Number.isFinite(intervalMs) || intervalMs < 60_000) {
  console.error("REMINDER_INTERVAL_MS must be at least 60000");
  process.exit(1);
}

async function run() {
  try {
    const response = await fetch(reminderUrl, {
      method: "POST",
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(120_000)
    });

    const body = await response.text();
    if (!response.ok) {
      throw new Error(`Reminder endpoint returned ${response.status}: ${body}`);
    }

    console.log(new Date().toISOString(), "Deadline reminder run completed", body);
  } catch (error) {
    console.error(new Date().toISOString(), "Deadline reminder run failed", error);
  }
}

await run();
setInterval(run, intervalMs);
