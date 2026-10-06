import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { CopyrightFooter } from "../components/layout/CopyrightFooter";

export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F9FD] dark:bg-[#071521] text-[#17324D] dark:text-[#EAF6FF] transition-colors duration-200">
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)} />

        {/* Page content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6"
        >
          <Outlet />
        </main>
        <CopyrightFooter />
      </div>
    </div>
  );
}
