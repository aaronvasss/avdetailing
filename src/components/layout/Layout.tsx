import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { StickyContactBar } from "./StickyContactBar";
import { useAdminCheck } from "@/hooks/useAdminCheck";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isAdmin } = useAdminCheck();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16 lg:pt-20 pb-16 lg:pb-0">
        {children}
      </main>
      <Footer />
      {!isAdmin && <StickyContactBar />}
    </div>
  );
}
