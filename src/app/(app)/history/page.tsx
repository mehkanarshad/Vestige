import { redirect } from "next/navigation";

// Legacy route — redirect to canonical /journey
export default function LegacyHistoryPage() {
  redirect("/journey");
}
