import { redirect } from "next/navigation";

/** Canonical URL for “open login”; actual form lives under `/auth/login`. */
export default function LoginEntryPage() {
  redirect("/auth/login");
}
