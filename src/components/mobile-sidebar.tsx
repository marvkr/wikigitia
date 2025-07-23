"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { WikiSidebar } from "@/components/wiki-sidebar";
import { SearchHistorySidebar } from "@/components/search-history-sidebar";
import { useGetWiki } from "@/hooks/use-get-wiki";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileSidebarProps {
  children?: React.ReactNode;
}

export function MobileSidebar({ children }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();

  // Determine sidebar content based on current page
  const getSidebarContent = () => {
    const isWikiPage = pathname.startsWith("/wiki/");

    if (!isWikiPage) {
      return <SearchHistorySidebar />;
    } else {
      const pathParts = pathname.split("/");
      const repositoryId = pathParts[2];

      if (repositoryId) {
        return <WikiSidebarWrapper repositoryId={repositoryId} />;
      } else {
        return <SearchHistorySidebar />;
      }
    }
  };

  const triggerButton = (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden fixed top-4 left-4 z-50 bg-background border shadow-md">
      <Menu className="h-5 w-5" />
      <span className="sr-only">Toggle navigation</span>
    </Button>
  );

  const sidebarContent = getSidebarContent();

  // Mobile: Use Drawer (bottom sheet)
  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
          <DrawerContent className="max-h-[85vh] flex flex-col">
            <DrawerHeader className="flex flex-row items-center justify-between border-b pb-4 flex-shrink-0">
              <DrawerTitle className="text-lg font-semibold">
                Navigation
              </DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </DrawerHeader>
            <div className="overflow-y-auto flex-1 min-h-0 overscroll-contain">
              {sidebarContent}
            </div>
          </DrawerContent>
        </Drawer>
        {children}
      </>
    );
  }

  // Tablet/Desktop: Use Sheet (side panel)
  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{triggerButton}</SheetTrigger>
        <SheetContent side="left" className="w-80 p-0 overflow-y-auto">
          {sidebarContent}
        </SheetContent>
      </Sheet>
      {children}
    </>
  );
}

function WikiSidebarWrapper({ repositoryId }: { repositoryId: string }) {
  const { data: wiki, isLoading } = useGetWiki(repositoryId);

  if (isLoading || !wiki) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-6 bg-muted rounded w-3/4"></div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <WikiSidebar
      repository={{
        name: wiki.repository.name,
        owner: wiki.repository.owner,
        language: wiki.repository.language,
        stars: wiki.repository.stars,
      }}
      subsystems={wiki.subsystems.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
      }))}
      pages={wiki.pages}
      onPageSelect={(pageId) => {
        if (pageId) {
          const page = wiki.pages.find((p) => p.id === pageId);
          if (page) {
            window.location.href = `/wiki/${repositoryId}/${page.subsystem.id}`;
          }
        } else {
          window.location.href = `/wiki/${repositoryId}`;
        }
      }}
    />
  );
}
