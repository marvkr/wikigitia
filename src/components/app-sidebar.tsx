"use client";

import { usePathname } from "next/navigation";
import { WikiSidebar } from "@/components/wiki-sidebar";
import { useGetWiki } from "@/hooks/use-get-wiki";

export function AppSidebar() {
  const pathname = usePathname();

  // This component is now only rendered on wiki pages
  // Extract repository ID from the path
  const pathParts = pathname.split("/");
  const repositoryId = pathParts[2];
  
  if (repositoryId) {
    return <WikiSidebarWrapper repositoryId={repositoryId} />;
  }

  return null;
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
      repository={wiki.repository}
      subsystems={wiki.subsystems}
      pages={wiki.pages}
      onPageSelect={(pageId) => {
        if (pageId) {
          const page = wiki.pages.find(p => p.id === pageId);
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