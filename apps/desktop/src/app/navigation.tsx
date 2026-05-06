import { BarChart3, Camera, Database, Dumbbell, Home, LibraryBig, type LucideIcon } from "lucide-react";

export type AppScreen = "Command Center" | "Train" | "Exercises" | "Analytics" | "Photos" | "Data & Settings";

export const navigationItems: Array<{ screen: AppScreen; icon: LucideIcon; description: string }> = [
  { screen: "Command Center", icon: Home, description: "Status, weak points, PRs, next actions" },
  { screen: "Train", icon: Dumbbell, description: "Start, log, journal, templates" },
  { screen: "Exercises", icon: LibraryBig, description: "Library and exercise intelligence" },
  { screen: "Analytics", icon: BarChart3, description: "Strength, volume, balance, recovery" },
  { screen: "Photos", icon: Camera, description: "Local progress photos and score trend" },
  { screen: "Data & Settings", icon: Database, description: "Import, export, privacy, preferences" }
];
