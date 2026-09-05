import "react-native-gesture-handler";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { NavigationBar } from "expo-navigation-bar";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/src/auth-context";
import { PurchasesProvider } from "@/src/purchases-context";
import { AppLockGate, SecurityProvider } from "@/src/security-context";
import { colors } from "@/src/theme";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

function NotificationNavigation() {
  const router = useRouter();

  useEffect(() => {
    function openCase(response: Notifications.NotificationResponse | null) {
      const caseId = response?.notification.request.content.data?.caseId;
      if (typeof caseId === "string" && caseId) {
        router.push(`/case/${caseId}`);
      }
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(openCase);
    void Notifications.getLastNotificationResponseAsync().then(openCase);

    return () => subscription.remove();
  }, [router]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PurchasesProvider>
        <SecurityProvider>
          <AppLockGate>
            <StatusBar style="light" />
            <NavigationBar style="dark" />
            <NotificationNavigation />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: "fade"
              }}
            />
          </AppLockGate>
        </SecurityProvider>
      </PurchasesProvider>
    </AuthProvider>
  );
}
