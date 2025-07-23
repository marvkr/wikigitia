"use client";

import { usePathname } from "next/navigation";
import { WikiSidebar } from "@/components/wiki-sidebar";
import { SearchHistorySidebar } from "@/components/search-history-sidebar";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { useGetWiki } from "@/hooks/use-get-wiki";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Check if we're on a wiki page
  const isWikiPage = pathname.startsWith("/wiki/");

  let sidebarContent;

  if (!isWikiPage) {
    // Home page - show search history
    sidebarContent = <SearchHistorySidebar />;
  } else {
    // Wiki page - show wiki navigation
    const pathParts = pathname.split("/");
    const repositoryId = pathParts[2];

    if (repositoryId) {
      sidebarContent = <WikiSidebarWrapper repositoryId={repositoryId} />;
    } else {
      sidebarContent = <SearchHistorySidebar />;
    }
  }

  // Mobile layout: Use MobileSidebar with overlay
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen">
        <MobileSidebar>
          <main className="flex-1 pt-16 px-4 pb-4">{children}</main>
        </MobileSidebar>
      </div>
    );
  }

  // Desktop layout: Traditional sidebar + main content
  return (
    <div className="flex h-screen">
      <div className="w-80 flex-shrink-0 border-r bg-background overflow-y-auto overflow-x-hidden">
        <div className="max-w-full">{sidebarContent}</div>
      </div>
      <main className="flex-1 overflow-auto min-w-0">{children}</main>
    </div>
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
