import { Redirect, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/src/auth-context";
import { RemedyTrackerScreen } from "@/src/remedy-tracker-screen";
import { colors } from "@/src/theme";

export default function RemediesRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const caseID = Array.isArray(id) ? id[0] : id;
  const { status, token, user, logout } = useAuth();
  if (status === "loading") return <View style={{ flex: 1,backgroundColor: colors.background }}><ActivityIndicator color={colors.accentSoft} /></View>;
  if (status !== "authenticated" || !token || !user) return <Redirect href="/login" />;
  if (!caseID) return <Redirect href="/cases" />;
  return <RemedyTrackerScreen key={`${user.id}:${caseID}`} ownerID={user.id} token={token} caseID={caseID} onUnauthorized={logout} />;
}
