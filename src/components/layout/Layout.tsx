import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { StickyContactBar } from "./StickyContactBar";
import { useAdminCheck } from "@/hooks/useAdminCheck";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isAdmin } = useAdminCheck();
  const location = useLocation();
  const hideFooter = isAdmin && location.pathname === "/account";

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden max-w-full">
      <Header />
      <main className="flex-1 pt-16 lg:pt-20 pb-16 lg:pb-0">
        {children}
      </main>
      {!hideFooter && <Footer />}
      {!isAdmin && <StickyContactBar />}
    </div>
  );
}
