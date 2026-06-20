export type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as
  | string
  | undefined;

export function getPaymentsEnvironment(): StripeEnv {
  if (clientToken?.startsWith("pk_live_")) return "live";
  return "sandbox";
}
