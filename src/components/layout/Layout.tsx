import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useAuth } from "@/hooks/useAuth";
import { ServicePageExtras } from "@/components/services/ServicePageExtras";
import { CORE_FAQ_PATHS } from "@/lib/page-faqs";
import { jobForPage } from "@/lib/job-gallery";
import { approvedPhotosForPage } from "@/lib/approved-job-photos";
import { SERVICE_EXPECTATIONS } from "@/lib/service-expectations";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const hideFooter = isAdmin && location.pathname === "/account";

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden max-w-full">
      <Header />
      <main className={`flex-1 pt-16 lg:pt-20 pb-16 lg:pb-0 ${location.pathname === "/" ? "max-lg:pt-[var(--site-header-height)]" : ""}`}>
        {children}
        {(SERVICE_EXPECTATIONS[location.pathname] || CORE_FAQ_PATHS.some(path => path === location.pathname) || jobForPage(location.pathname) || approvedPhotosForPage(location.pathname).length > 0) && <ServicePageExtras path={location.pathname} />}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
