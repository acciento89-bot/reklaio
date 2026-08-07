import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/src/auth-context";
import { colors } from "@/src/theme";

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>;
}

export default function AppTabsLayout() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accentSoft} />
      </View>
    );
  }

  if (status !== "authenticated") return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.panelSoft },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "800" },
        tabBarStyle: {
          backgroundColor: colors.panelSoft,
          borderTopColor: colors.line,
          height: 70,
          paddingTop: 8,
          paddingBottom: 10
        },
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.accentSoft,
        tabBarInactiveTintColor: colors.muted
      }}
    >
      <Tabs.Screen
        name="cases"
        options={{
          title: "Meine Fälle",
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Fälle" />
        }}
      />
      <Tabs.Screen
        name="deadlines"
        options={{
          title: "Fristen",
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Fristen" />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Konto",
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Konto" />
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background
  },
  tabLabel: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  tabLabelActive: { color: colors.accentSoft }
});
