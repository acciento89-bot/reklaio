import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { MobileDeadline } from "@/src/api";

const CHANNEL_ID = "reklaio-deadlines";
const SOURCE = "reklaio-deadline";
const MAX_DEADLINES = 30;

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Fristerinnerungen",
    description: "Erinnerungen an offene Fristen in Reklaio-Fallakten",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 200, 250]
  });
}

function intendedCalendarDate(value: string) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return { year, month, day };
}

function reminderDate(value: string, dayOffset: number) {
  const { year, month, day } = intendedCalendarDate(value);
  return new Date(year, month - 1, day + dayOffset, 9, 0, 0, 0);
}

async function cancelReklaioDeadlineNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => request.content.data?.source === SOURCE)
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier))
  );
}

export async function requestDeadlineReminderPermission() {
  await ensureAndroidChannel();

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function clearDeadlineReminders() {
  await cancelReklaioDeadlineNotifications();
}

export async function syncDeadlineReminders(deadlines: MobileDeadline[]) {
  await ensureAndroidChannel();
  await cancelReklaioDeadlineNotifications();

  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) return 0;

  const now = Date.now() + 60_000;
  const openDeadlines = deadlines
    .filter((item) => item.state !== "completed" && !item.completedAt)
    .sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime())
    .slice(0, MAX_DEADLINES);

  let scheduledCount = 0;

  for (const deadline of openDeadlines) {
    const reminders = [
      {
        date: reminderDate(deadline.dueAt, -1),
        title: "Frist morgen",
        body: `${deadline.title} · ${deadline.caseTitle}`
      },
      {
        date: reminderDate(deadline.dueAt, 0),
        title: "Frist heute",
        body: `${deadline.title} · ${deadline.caseTitle}`
      }
    ];

    for (const reminder of reminders) {
      if (reminder.date.getTime() <= now) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
          sound: "default",
          data: {
            source: SOURCE,
            caseId: deadline.caseId,
            deadlineId: deadline.id
          }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminder.date,
          channelId: Platform.OS === "android" ? CHANNEL_ID : undefined
        }
      });
      scheduledCount += 1;
    }
  }

  return scheduledCount;
}
