import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  StatusBar
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { getEmployeeId } from "../utils/storage";
import { useNavigation } from "@react-navigation/native";

export default function EmpPerformanceDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCount, setLoadingCount] = useState(0);
  const [attendance, setAttendance] = useState(null);
  const [leaveSummary, setLeaveSummary] = useState(null);

  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH > 800;

  // Loading counter
  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingCount(0);
      interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [loading]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const id = await getEmployeeId();
        if (!id) {
          setLoading(false);
          return;
        }

        const tasksResponse = await fetch(`https://hospitaldatabasemanagement.onrender.com/task/employee/${id}`);
        const tasksData = await tasksResponse.json();
        if (tasksData.success && Array.isArray(tasksData.tasks)) {
          const uniqueTasks = Array.from(new Map(tasksData.tasks.map((task) => [task.id, task])).values());
          setTasks(uniqueTasks);
        }

        const attendanceResponse = await fetch(`https://hospitaldatabasemanagement.onrender.com/employeekpi/attendancesummary/${id}`);
        const attendanceData = await attendanceResponse.json();
        if (attendanceData.success && attendanceData.summary) setAttendance(attendanceData.summary);

        const leaveResponse = await fetch(`https://hospitaldatabasemanagement.onrender.com/employeekpi/leavessummary/${id}`);
        const leaveData = await leaveResponse.json();
        if (leaveData.success && leaveData.summary) setLeaveSummary(leaveData.summary);
      } catch (error) {
        console.error("❌ Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // KPI calculations
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const attendanceRate = attendance ? Math.round((attendance.total_present / attendance.total_days) * 100) : 0;
  const leaveUsage = leaveSummary && leaveSummary.total_annual_paid_leaves > 0
      ? Math.round((leaveSummary.annual_used_leaves / leaveSummary.total_annual_paid_leaves) * 100) : 0;

  // ✅ Overall Performance calculation (weighted)
  const overallPerformance = Math.round(
    (completionRate * 0.5) +        // 50% weight
    (attendanceRate * 0.3) +        // 30% weight
    ((100 - leaveUsage) * 0.2)      // 20% weight
  );

  // Grade based on score
  const getPerformanceGrade = (score) => {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Average";
    return "Needs Improvement";
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0D6EFD" />
        <Text style={{ marginTop: 10, color: '#6c757d' }}>Syncing performance data... {loadingCount}s</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={[styles.mainWrapper, { flexDirection: isDesktop ? 'row' : 'column' }]}>

        {/* LEFT BRANDING SIDE */}
        {isDesktop && (
          <View style={styles.brandingSide}>
            <View style={styles.brandOverlay}>
              <View style={styles.heroLogoBox}>
                <Ionicons name="analytics" size={32} color="#fff" />
              </View>
              <Text style={styles.heroTitle}>Performance Insights</Text>
              <Text style={styles.heroSubtitle}>Your growth, tracked.</Text>
              <View style={styles.dividerLight} />
              <Text style={styles.heroDescription}>
                Review your tasks, attendance consistency, and leave balances in one place. Your efficiency helps us provide better care.
              </Text>
              <TouchableOpacity style={styles.actionBtnOutline} onPress={() => navigation.goBack()}>
                <Text style={styles.actionBtnOutlineText}>Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* RIGHT DASHBOARD CONTENT */}
        <View style={[styles.dashboardSide, { width: isDesktop ? '65%' : '100%' }]}>
          <FlatList
            style={styles.flatList}
            contentContainerStyle={styles.scrollContent}
            data={tasks}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={
              <>
                <View style={styles.headerRow}>
                  <View>
                    <Text style={styles.welcomeText}>Employee Performance</Text>
                    <Text style={styles.dateSubtitle}>Reporting Period: Current Month</Text>
                  </View>
                </View>

                {/* Top Metrics Row */}
                <View style={styles.metricsGrid}>
                  <MetricCard 
                    title="Task Completion" 
                    value={`${completionRate}%`} 
                    subtext={`${completedCount}/${tasks.length} Done`}
                    icon="checkbox-outline" 
                    color="#E7F1FF" 
                    textColor="#0D6EFD"
                  />
                  <MetricCard 
                    title="Attendance" 
                    value={`${attendanceRate}%`} 
                    subtext="Overall Ratio"
                    icon="calendar-outline" 
                    color="#E8F9F1" 
                    textColor="#198754"
                  />
                  <MetricCard 
                    title="Leave Balance" 
                    value={`${leaveSummary?.remaining_annual_paid_leaves || 0}d`} 
                    subtext="Available"
                    icon="time-outline" 
                    color="#FFF8E6" 
                    textColor="#FFC107"
                  />
                </View>

                <View style={styles.sectionRow}>
                  <View style={styles.blockCard}>
                    <Text style={styles.blockTitle}>Attendance Breakdown</Text>
                    <View style={styles.statsContainer}>
                        <StatItem label="Present" value={attendance?.total_present || 0} color="#198754" />
                        <StatItem label="Late" value={attendance?.total_late || 0} color="#FFC107" />
                        <StatItem label="Absent" value={attendance?.total_absent || 0} color="#DC3545" />
                    </View>
                  </View>

                  <View style={styles.blockCard}>
                    <Text style={styles.blockTitle}>Efficiency Score</Text>
                    <View style={styles.scoreContainer}>
                        <Text style={styles.scoreValue}>{overallPerformance}</Text>
                        <Text style={styles.scoreMax}>/ 100</Text>
                    </View>
                    <Text style={styles.scoreLabel}>{getPerformanceGrade(overallPerformance)}</Text>
                  </View>
                </View>

                <Text style={styles.listHeader}>Assignment Log</Text>
              </>
            }
            renderItem={({ item }) => (
              <View style={styles.taskCard}>
                <View style={styles.taskIconBox}>
                  <MaterialIcons 
                    name={item.status === "completed" ? "check-circle" : "pending-actions"} 
                    size={22} 
                    color={item.status === "completed" ? "#198754" : "#6c757d"} 
                  />
                </View>
                <View style={{flex: 1, marginLeft: 12}}>
                  <Text style={styles.taskTitle}>{item.title}</Text>
                  <Text style={[styles.taskStatus, { color: item.status === "completed" ? "#198754" : "#DC3545" }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                  <Text style={styles.priorityText}>{item.priority}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No assignments found for this period.</Text>}
          />
        </View>
      </View>
    </View>
  );
}

/* Helper for Priority Colors */
const getPriorityColor = (p) => {
  if (p === "High") return "#FDEDEE";
  if (p === "Medium") return "#FFF8E6";
  return "#E8F9F1";
};

/* MetricCard Component */
const MetricCard = ({ title, value, subtext, icon, color, textColor }) => (
  <View style={[styles.metricCard, { backgroundColor: color }]}>
    <Ionicons name={icon} size={20} color={textColor} />
    <Text style={[styles.metricValue, { color: textColor }]}>{value}</Text>
    <Text style={styles.metricTitle}>{title}</Text>
    <Text style={styles.metricSubtext}>{subtext}</Text>
  </View>
);

/* StatItem Component */
const StatItem = ({ label, value, color }) => (
  <View style={styles.statBox}>
    <Text style={[styles.statNum, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  mainWrapper: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  // LEFT BRANDING
  brandingSide: { flex: 1, backgroundColor: '#0D6EFD', padding: 40, justifyContent: 'center' },
  brandOverlay: { maxWidth: 400, alignSelf: 'center' },
  heroLogoBox: { width: 60, height: 60, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: '#fff' },
  heroSubtitle: { fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  dividerLight: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 25 },
  heroDescription: { fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 24, marginBottom: 40 },
  actionBtnOutline: { borderWidth: 1, borderColor: '#fff', paddingVertical: 12, borderRadius: 10, alignItems: 'center', width: 180 },
  actionBtnOutlineText: { color: '#fff', fontWeight: '700' },

  // RIGHT CONTENT
  dashboardSide: { flex: 1, backgroundColor: '#F8F9FA' },
  flatList: { flex: 1 },
  scrollContent: { paddingHorizontal: '6%', paddingVertical: 40 },
  headerRow: { marginBottom: 30 },
  welcomeText: { fontSize: 28, fontWeight: '800', color: '#1A1A1A' },
  dateSubtitle: { fontSize: 14, color: '#6c757d', marginTop: 4 },

  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 12 },
  metricCard: { flex: 1, padding: 20, borderRadius: 20, minHeight: 140, justifyContent: 'center' },
  metricValue: { fontSize: 24, fontWeight: '800', marginVertical: 4 },
  metricTitle: { fontSize: 13, fontWeight: '700', opacity: 0.8 },
  metricSubtext: { fontSize: 11, fontWeight: '600', opacity: 0.6, marginTop: 2 },

  sectionRow: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  blockCard: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  blockTitle: { fontSize: 14, fontWeight: '800', color: '#495057', marginBottom: 15 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#adb5bd', fontWeight: '700', marginTop: 2 },

  scoreContainer: { flexDirection: 'row', alignItems: 'baseline' },
  scoreValue: { fontSize: 32, fontWeight: '900', color: '#198754' },
  scoreMax: { fontSize: 16, color: '#adb5bd', fontWeight: '700' },
  scoreLabel: { fontSize: 12, color: '#6c757d', marginTop: 5, fontWeight: '600' },

  listHeader: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 15 },
  taskCard: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, 
    borderRadius: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03 
  },
  taskIconBox: { width: 44, height: 44, backgroundColor: '#F8F9FA', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  taskTitle: { fontSize: 15, fontWeight: '700', color: '#212529' },
  taskStatus: { fontSize: 11, fontWeight: '800', marginTop: 2 },
  priorityBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  priorityText: { fontSize: 11, fontWeight: '800', color: '#495057' },
  emptyText: { textAlign: 'center', color: '#adb5bd', marginTop: 20, fontStyle: 'italic' }
});