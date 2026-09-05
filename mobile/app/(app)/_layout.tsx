import Ionicons from "@expo/vector-icons/Ionicons";
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
        sceneStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.panelSoft },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "900", letterSpacing: -0.2 },
        tabBarStyle: {
          backgroundColor: colors.panelSoft,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: 72,
          paddingTop: 7,
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
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "folder-open" : "folder-open-outline"} size={size} color={color} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Fälle" />
        }}
      />
      <Tabs.Screen
        name="deadlines"
        options={{
          title: "Fristen",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={size} color={color} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Fristen" />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Konto",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person-circle" : "person-circle-outline"} size={size} color={color} />
          ),
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
  tabLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  tabLabelActive: { color: colors.accentSoft }
});
