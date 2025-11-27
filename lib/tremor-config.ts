// Custom Tremor color configuration for RushData
export const RUSHDATA_COLORS = {
  primary: "#007BFF",
  secondary: "#284389",
} as const;

// Map Tremor color names to RushData colors
export const CHART_COLORS = {
  blue: RUSHDATA_COLORS.primary,
  indigo: RUSHDATA_COLORS.secondary,
} as const;
