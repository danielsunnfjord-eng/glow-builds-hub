import { createFileRoute } from "@tanstack/react-router";
import SafetyPage from "@/components/voyage/SafetyPage";
import { safetyHead } from "@/lib/safetyHead";
import { guardGroupPage } from "@/lib/groupPageGuard";

export const Route = createFileRoute("/{-$locale}/trygghet")({
  beforeLoad: ({ params }) => guardGroupPage("safety", params.locale),
  head: ({ params }) => safetyHead(params.locale),
  component: SafetyPage,
});
