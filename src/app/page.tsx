import { redirect } from "next/navigation";

/** Fallback when middleware does not run — always send `/` to Arabic. */
export default function RootPage() {
  redirect("/ar");
}
