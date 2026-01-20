import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { StickyContactBar } from "./StickyContactBar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16 lg:pt-20 pb-16 lg:pb-0">
        {children}
      </main>
      <Footer />
      <StickyContactBar />
    </div>
  );
}
