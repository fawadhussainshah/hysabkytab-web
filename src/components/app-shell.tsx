import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppSidebar />
      <AppHeader />
      <div className="min-h-screen bg-background pl-72 pt-24">
        <main className="px-8 pb-12">{children}</main>
      </div>
    </>
  );
}
