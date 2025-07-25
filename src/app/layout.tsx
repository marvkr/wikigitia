import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/providers/query-provider";
import { ResponsiveLayout } from "@/components/responsive-layout";

export const metadata: Metadata = {
  title: "Wikigitia",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning={true}>
        <QueryProvider>
          <ResponsiveLayout>{children}</ResponsiveLayout>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
