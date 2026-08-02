import { redirect } from "next/navigation";

/** App entry: send users to login (AuthProvider will bounce authenticated users onward). */
export default function Home() {
  redirect("/auth/login");
}
