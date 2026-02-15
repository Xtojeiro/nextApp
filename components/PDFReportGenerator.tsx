import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from "react-native";

interface ReportData {
  title: string;
  period: string;
  athletes: {
    name: string;
    workouts: number;
    games: number;
    points: number;
    assists: number;
    efficiency: number;
  }[];
  summary: {
    totalWorkouts: number;
    totalGames: number;
    averageEfficiency: number;
    topPerformer: string;
  };
}

interface PDFReportGeneratorProps {
  data: ReportData;
  onExport?: (format: "pdf" | "csv") => void;
}

export default function PDFReportGenerator({ data, onExport }: PDFReportGeneratorProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [showPreview, setShowPreview] = useState(false);

  const formatValue = (value: number) => {
    return value.toLocaleString("pt-PT");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Gerar Relatório</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {data.period}
        </Text>
      </View>

      <View style={styles.options}>
        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: colors.primary + "15" }]}
          onPress={() => onExport?.("pdf")}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="document-text" size={24} color="white" />
          </View>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>PDF</Text>
            <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
              Relatório completo formatado
            </Text>
          </View>
          <Ionicons name="download" size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: colors.success + "15" }]}
          onPress={() => onExport?.("csv")}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.success }]}>
            <Ionicons name="code-slash" size={24} color="white" />
          </View>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>CSV</Text>
            <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
              Dados para Excel/Numbers
            </Text>
          </View>
          <Ionicons name="download" size={20} color={colors.success} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: colors.warning + "15" }]}
          onPress={() => setShowPreview(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.warning }]}>
            <Ionicons name="eye" size={24} color="white" />
          </View>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>Pré-visualizar</Text>
            <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
              Ver antes de exportar
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.warning} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>Incluir no relatório:</Text>
        <View style={styles.checklist}>
          {[
            "Resumo da equipa",
            "Estatísticas individuais",
            "Comparação de desempenho",
            "Gráficos de evolução",
            "Top 10 atletas",
          ].map((item, index) => (
            <View key={index} style={styles.checkItem}>
              <Ionicons name="checkbox" size={18} color={colors.success} />
              <Text style={[styles.checkText, { color: colors.text }]}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <Modal visible={showPreview} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Pré-visualização do Relatório
              </Text>
              <TouchableOpacity onPress={() => setShowPreview(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.previewContent}>
              <View style={styles.previewPage}>
                <Text style={styles.previewTitle}>{data.title}</Text>
                <Text style={styles.previewPeriod}>{data.period}</Text>

                <View style={styles.previewSection}>
                  <Text style={styles.previewSectionTitle}>Resumo da Equipa</Text>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Total de Treinos:</Text>
                    <Text style={styles.previewValue}>{formatValue(data.summary.totalWorkouts)}</Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Total de Jogos:</Text>
                    <Text style={styles.previewValue}>{formatValue(data.summary.totalGames)}</Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Eficiência Média:</Text>
                    <Text style={styles.previewValue}>{data.summary.averageEfficiency}%</Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Melhor Atleta:</Text>
                    <Text style={styles.previewValue}>{data.summary.topPerformer}</Text>
                  </View>
                </View>

                <View style={styles.previewSection}>
                  <Text style={styles.previewSectionTitle}>Top 5 Atletas</Text>
                  {data.athletes.slice(0, 5).map((athlete, index) => (
                    <View key={index} style={styles.previewAthlete}>
                      <Text style={styles.previewRank}>#{index + 1}</Text>
                      <Text style={styles.previewName}>{athlete.name}</Text>
                      <Text style={styles.previewStats}>
                        {athlete.workouts} | {athlete.efficiency}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.danger }]}
                onPress={() => setShowPreview(false)}
              >
                <Text style={styles.modalBtnText}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setShowPreview(false);
                  onExport?.("pdf");
                }}
              >
                <Text style={styles.modalBtnText}>Exportar PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

import { useState } from "react";

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  options: {
    gap: 12,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  optionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  infoSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  checklist: {
    gap: 8,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkText: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  previewContent: {
    padding: 16,
  },
  previewPage: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 8,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  previewPeriod: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
  },
  previewSection: {
    marginBottom: 20,
  },
  previewSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  previewValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  previewAthlete: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  previewRank: {
    width: 30,
    fontSize: 13,
    fontWeight: "600",
    color: "#3B82F6",
  },
  previewName: {
    flex: 1,
    fontSize: 13,
  },
  previewStats: {
    fontSize: 12,
    color: "#64748B",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
