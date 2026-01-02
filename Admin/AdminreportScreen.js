// ReportScreen.js
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// ---------- Mock Data ----------
const STAT_CARDS = [
  { id: "total", label: "Total Reports", value: 6, icon: "document-text-outline" },
  { id: "ready", label: "Ready to Download", value: 5, icon: "download-outline" },
  { id: "generating", label: "Generating", value: 1, icon: "time-outline" },
  { id: "thismonth", label: "This Month", value: 12, sub: "+8 from last month", icon: "calendar-outline" },
];

const REPORTS = [
  {
    id: "r1",
    title: "Monthly Attendance Report",
    subtitle: "Detailed attendance analysis for all employees",
    period: "January 2024",
    generated: "2024-02-01",
    size: "2.3 MB",
    format: "PDF",
    tags: ["Attendance", "ready"],
  },
  {
    id: "r2",
    title: "Payroll Summary Report",
    subtitle: "Comprehensive payroll breakdown by department",
    period: "January 2024",
    generated: "2024-02-01",
    size: "1.8 MB",
    format: "Excel",
    tags: ["Payroll", "ready"],
  },
  {
    id: "r3",
    title: "Performance Analytics",
    subtitle: "KPI tracking and performance metrics analysis",
    period: "Q4 2023",
    generated: "2024-01-31",
    size: "3.1 MB",
    format: "PDF",
    tags: ["Performance", "ready"],
  },
  {
    id: "r4",
    title: "Leave Management Report",
    subtitle: "Leave requests, approvals, and balance summary",
    period: "January 2024",
    generated: "2024-02-01",
    size: "945 KB",
    format: "Excel",
    tags: ["Leave", "ready"],
  },
  {
    id: "r5",
    title: "Task Completion Analysis",
    subtitle: "Project progress and task completion rates",
    period: "January 2024",
    generated: "Generating…",
    size: "—",
    format: "PDF",
    tags: ["Tasks", "generating"],
  },
  {
    id: "r6",
    title: "Employee Directory Report",
    subtitle: "Complete employee information and contact details",
    period: "Current",
    generated: "2024-02-12",
    size: "1.2 MB",
    format: "Excel",
    tags: ["HR", "ready"],
  },
];

const QUICK_GEN = [
  { id: "q1", title: "Custom Attendance Report", desc: "Generate attendance report for specific date range", tag: "Attendance" },
  { id: "q2", title: "Department Performance", desc: "Employee performance metrics by department", tag: "Performance" },
  { id: "q3", title: "Payroll by Location", desc: "Payroll cost summary by office location", tag: "Payroll" },
];

// ---------- Small UI Helpers ----------
const Badge = ({ text, tone = "ready" }) => {
  const colors =
    tone === "ready"
      ? ["#E8FFF3", "#D4FFEA"]
      : tone === "generating"
      ? ["#FFF7E6", "#FFEFD1"]
      : ["#E9F0FF", "#DCE6FF"];
  const textColor =
    tone === "ready" ? "#0B8F5A" : tone === "generating" ? "#A96A00" : "#2746B9";

  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.badge}>
      <Text style={[styles.badgeText, { color: textColor }]}>{text}</Text>
    </LinearGradient>
  );
};

const Chip = ({ label, icon, onPress, active }) => (
  <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
    {!!icon && <Ionicons name={icon} size={16} color={active ? "#fff" : "#3A3F4A"} style={{ marginRight: 6 }} />}
    <Text style={[styles.chipText, active && { color: "#fff" }]}>{label}</Text>
    <MaterialIcons
      name="keyboard-arrow-down"
      size={16}
      color={active ? "#fff" : "#3A3F4A"}
      style={{ marginLeft: 2 }}
    />
  </TouchableOpacity>
);

// ---------- Cards ----------
const StatCard = ({ item }) => (
  <View style={styles.statCard}>
    <View style={styles.statIconWrap}>
      <Ionicons name={item.icon} size={20} color="#3A7AFE" />
    </View>
    <Text style={styles.statLabel}>{item.label}</Text>
    <Text style={styles.statValue}>{item.value}</Text>
    {item.sub ? <Text style={styles.statSub}>{item.sub}</Text> : null}
  </View>
);

const ReportCard = ({ r }) => {
  const status = r.tags.includes("generating") ? "generating" : r.tags.includes("ready") ? "ready" : "info";
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
        <Text style={styles.cardTitle}>{r.title}</Text>
        <View style={{ flexDirection: "row", marginLeft: 8 }}>
          {r.tags
            .filter((t) => t !== "ready" && t !== "generating")
            .map((t) => (
              <Badge key={t} text={t} tone="info" />
            ))}
          <Badge text={status} tone={status} />
        </View>
      </View>

      <Text style={styles.cardSubtitle} numberOfLines={2}>
        {r.subtitle}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaItem}>Period: <Text style={styles.metaEmph}>{r.period}</Text></Text>
        <Text style={styles.metaDivider}>•</Text>
        <Text style={styles.metaItem}>Generated: <Text style={styles.metaEmph}>{r.generated}</Text></Text>
        <Text style={styles.metaDivider}>•</Text>
        <Text style={styles.metaItem}>Size: <Text style={styles.metaEmph}>{r.size}</Text></Text>
        <Text style={styles.metaDivider}>•</Text>
        <Text style={styles.metaItem}>Format: <Text style={styles.metaEmph}>{r.format}</Text></Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} accessibilityLabel="Preview">
          <Feather name="eye" size={18} color="#4B5563" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} accessibilityLabel="Download">
          <Feather name="download" size={18} color="#4B5563" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} accessibilityLabel="Share">
          <Feather name="share-2" size={18} color="#4B5563" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const QuickCard = ({ q }) => (
  <View style={styles.quickCard}>
    <Text style={styles.quickTitle}>{q.title}</Text>
    <Text style={styles.quickDesc}>{q.desc}</Text>
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
      <Badge text={q.tag} tone="info" />
      <TouchableOpacity style={styles.quickGenerateBtn}>
        <Ionicons name="flash-outline" size={16} color="#fff" />
        <Text style={styles.quickGenerateText}>Generate</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ---------- Main ----------
export default function ReportScreen() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All Categories");
  const [activePeriod, setActivePeriod] = useState("Monthly");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return REPORTS.filter((r) => {
      const text = `${r.title} ${r.subtitle} ${r.tags.join(" ")}`.toLowerCase();
      return !term || text.includes(term);
    });
  }, [search]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      {/* Top bar */}
      <View style={styles.topbar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={20} color="#111827" />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JA</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.h1}>Reports</Text>
            <Text style={styles.h2}>Generate and manage business reports</Text>
          </View>
          <TouchableOpacity style={styles.primaryBtn}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Generate Report</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <FlatList
          data={STAT_CARDS}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item }) => <StatCard item={item} />}
          horizontal
          showsHorizontalScrollIndicator={false}
        />

        {/* Filters */}
        <View style={styles.filtersRow}>
          <Chip
            label={activeCat}
            icon="apps-outline"
            active
            onPress={() => setActiveCat("All Categories")}
          />
          <Chip
            label={activePeriod}
            icon="calendar-outline"
            active={false}
            onPress={() => setActivePeriod("Monthly")}
          />
        </View>

        {/* Available Reports */}
        <Text style={styles.sectionTitle}>Available Reports</Text>
        {filtered.map((r) => (
          <ReportCard key={r.id} r={r} />
        ))}

        {/* Quick Generate */}
        <Text style={[styles.sectionTitle, { marginTop: 6 }]}>Quick Generate</Text>
        <FlatList
          data={QUICK_GEN}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <QuickCard q={item} />}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 6, paddingRight: 8 }}
        />
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F7FB" },

  topbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
    flex: 1,
    marginRight: 12,
  },
  searchInput: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
    color: "#111827",
  },
  iconBtn: {
    padding: 8,
    borderRadius: 10,
  },
  avatar: {
    marginLeft: 8,
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  avatarText: { fontWeight: "700", color: "#374151", fontSize: 12 },

  container: { padding: 16 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  h1: { fontSize: 22, fontWeight: "800", color: "#111827" },
  h2: { color: "#6B7280", marginTop: 2 },

  primaryBtn: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", marginLeft: 6 },

  statCard: {
    width: 180,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statLabel: { fontSize: 12, color: "#6B7280" },
  statValue: { fontSize: 22, fontWeight: "800", color: "#111827", marginTop: 2 },
  statSub: { marginTop: 2, fontSize: 12, color: "#6B7280" },

  filtersRow: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 9,
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  chipText: { color: "#3A3F4A", fontSize: 13, fontWeight: "600" },

  sectionTitle: {
    fontSize: 14,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 10,
    marginBottom: 6,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#111827", marginRight: 8 },
  cardSubtitle: { color: "#4B5563", marginBottom: 8 },

  metaRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginBottom: 8 },
  metaItem: { fontSize: 12, color: "#6B7280", marginRight: 6 },
  metaEmph: { color: "#111827", fontWeight: "600" },
  metaDivider: { color: "#9CA3AF", marginHorizontal: 4 },

  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },

  quickCard: {
    width: 280,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 12,
  },
  quickTitle: { fontSize: 15, fontWeight: "800", color: "#111827" },
  quickDesc: { color: "#4B5563", marginTop: 4 },
  quickGenerateBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  quickGenerateText: { color: "#fff", fontWeight: "700", marginLeft: 6 },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 6,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
});
