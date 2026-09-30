import { redirect } from "next/navigation";

// Legacy route — redirect to canonical /style-profile
export default function LegacyProfilePage() {
  redirect("/style-profile");
}
