export const colors = {
  navy: "#0B1F33",
  navy2: "#132B45",
  navy3: "#1D3A5A",
  mint: "#3DDC97",
  mintSoft: "#E3F9EF",
  turquoise: "#14C8C8",
  turquoiseSoft: "#E0F7F7",
  white: "#FFFFFF",
  bg: "#F5F7FA",
  surface: "#FFFFFF",
  surfaceMuted: "#EEF1F5",
  border: "#E3E8EF",
  text: "#0B1F33",
  textMuted: "#5D6B7E",
  textFaint: "#93A0B1",
  onDark: "#FFFFFF",
  onDarkMuted: "rgba(255,255,255,0.72)",
  success: "#18A16A",
  warning: "#D98A00",
  warningSoft: "#FFF4DC",
  danger: "#E0475B",
  dangerSoft: "#FDE8EB",
  info: "#2C7BE5",
  infoSoft: "#E6F0FD",
} as const;

export const gradient = {
  brand: [colors.mint, colors.turquoise] as const,
  dark: [colors.navy, colors.navy3] as const,
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

export const font = {
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semibold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
} as const;

export const shadow = {
  card: {
    shadowColor: "#0B1F33",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  soft: {
    shadowColor: "#0B1F33",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
} as const;

/** Minimum touch target (Android guideline: 48dp). */
export const HIT = 48;
