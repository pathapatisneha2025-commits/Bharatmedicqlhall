// kpiscreen.js
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const KPIScreen = () => {
  const [period, setPeriod] = useState("Monthly");
  const [department, setDepartment] = useState("All Departments");

  const kpis = [
    {
      id: 1,
      title: "Employee Productivity",
      value: "87%",
      target: "90%",
      previous: "82%",
      change: "+5.0%",
      type: "Performance",
      status: "good",
    },
    {
      id: 2,
      title: "Task Completion Rate",
      value: "94%",
      target: "95%",
      previous: "91%",
      change: "+1.0%",
      type: "Efficiency",
      status: "good",
    },
    {
      id: 3,
      title: "Employee Satisfaction",
      value: "78%",
      target: "85%",
      previous: "80%",
      change: "-2.0%",
      type: "Culture",
      status: "bad",
    },
    {
      id: 4,
      title: "Average Response Time",
      value: "2.3hours",
      target: "2hours",
      previous: "2.8hours",
      change: "-0.5hours",
      type: "Service",
      status: "bad",
    },
    {
      id: 5,
      title: "Training Completion",
      value: "88%",
      target: "100%",
      previous: "85%",
      change: "+3.0%",
      type: "Development",
      status: "good",
    },
    {
      id: 6,
      title: "Attendance Rate",
      value: "96%",
      target: "98%",
      previous: "94%",
      change: "+2.0%",
      type: "Attendance",
      status: "good",
    },
  ];

  const deptPerformance = [
    { id: "eng", dept: "Engineering", score: 92, change: "+5%", label: "excellent" },
    { id: "mkt", dept: "Marketing", score: 88, change: "+2%", label: "good" },
    { id: "sales", dept: "Sales", score: 85, change: "+1%", label: "good" },
    { id: "hr", dept: "HR", score: 90, change: "+3%", label: "excellent" },
    { id: "fin", dept: "Finance", score: 87, change: "+1%", label: "good" },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Topbar */}
        <View style={styles.topBar}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <Text style={styles.placeholder}>Search...</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JA</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>KPI Tracker</Text>
        <Text style={styles.subtitle}>
          Monitor key performance indicators across the organization
        </Text>

        {/* Filters */}
        <View style={styles.filters}>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="calendar-outline" size={16} color="#111" />
            <Text style={styles.filterText}>{period}</Text>
            <Ionicons name="chevron-down" size={16} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="layers-outline" size={16} color="#111" />
            <Text style={styles.filterText}>{department}</Text>
            <Ionicons name="chevron-down" size={16} color="#111" />
          </TouchableOpacity>
        </View>

        {/* Overall Score */}
        <LinearGradient
          colors={["#4F46E5", "#3B82F6"]}
          style={styles.overallCard}
        >
          <Text style={styles.overallTitle}>Overall Performance Score</Text>
          <Text style={styles.overallScore}>89.2</Text>
          <Text style={styles.overallChange}>+3.5% from last month</Text>
          <Ionicons
            name="stats-chart-outline"
            size={28}
            color="#fff"
            style={styles.overallIcon}
          />
        </LinearGradient>

        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          {kpis.map((kpi) => (
            <View key={kpi.id} style={styles.kpiCard}>
              <Text style={styles.kpiTitle}>{kpi.title}</Text>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              <Text style={styles.kpiTarget}>Target: {kpi.target}</Text>
              <Text style={styles.kpiPrev}>Previous: {kpi.previous}</Text>
              <Text
                style={[
                  styles.kpiChange,
                  kpi.status === "good"
                    ? { color: "#059669" }
                    : { color: "#DC2626" },
                ]}
              >
                {kpi.change}
              </Text>
            </View>
          ))}
        </View>

        {/* Department Performance */}
        <Text style={styles.sectionTitle}>Department Performance</Text>
        <View style={styles.deptGrid}>
          {deptPerformance.map((d) => (
            <View key={d.id} style={styles.deptCard}>
              <Text style={styles.deptName}>{d.dept}</Text>
              <Text style={styles.deptScore}>{d.score}</Text>
              <Text style={styles.deptChange}>{d.change}</Text>
              <Text style={styles.deptLabel}>{d.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default KPIScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { padding: 16,marginTop: 30 },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 12,
  },
  placeholder: { color: "#9CA3AF", marginLeft: 6 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "700", color: "#374151" },

  title: { fontSize: 22, fontWeight: "800", color: "#111827" },
  subtitle: { color: "#6B7280", marginBottom: 16 },

  filters: { flexDirection: "row", marginBottom: 16 },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterText: { marginHorizontal: 6, fontWeight: "600", color: "#111827" },

  overallCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    position: "relative",
  },
  overallTitle: { color: "#fff", fontSize: 14 },
  overallScore: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 8 },
  overallChange: { color: "#fff", fontSize: 12, marginTop: 4 },
  overallIcon: { position: "absolute", right: 16, top: 16 },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  kpiCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  kpiTitle: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  kpiValue: { fontSize: 22, fontWeight: "800", color: "#111827" },
  kpiTarget: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  kpiPrev: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  kpiChange: { marginTop: 2, fontWeight: "700" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginVertical: 12,
  },
  deptGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  deptCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  deptName: { fontWeight: "700", fontSize: 14, marginBottom: 4 },
  deptScore: { fontSize: 22, fontWeight: "800", color: "#111827" },
  deptChange: { fontSize: 12, color: "#059669", marginTop: 2 },
  deptLabel: { fontSize: 12, color: "#6B7280", marginTop: 2 },
});
