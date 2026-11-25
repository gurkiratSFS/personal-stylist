import { redirect } from "next/navigation";

export default function NewAnalyzeRedirectPage() {
  redirect("/analyze?new=1");
}
