"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

export function Navbar() {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
        </div>
      </div>
    </div>
  );
}
