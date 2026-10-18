"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Lock page scroll while the slide-in menu is open (links inside it close it).
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <AppSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <AppHeader onMenu={() => setMenuOpen(true)} />
      <div className="min-h-screen bg-background pt-16 lg:pl-72 lg:pt-24">
        <main className="min-w-0 px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12 lg:pt-0">{children}</main>
      </div>
      <MobileNav onMore={() => setMenuOpen(true)} />
    </>
  );
}
