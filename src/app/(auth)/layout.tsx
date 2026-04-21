import { GuestGate } from "@/components/guest-gate";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <GuestGate>{children}</GuestGate>;
}
