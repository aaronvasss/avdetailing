import { Phone, MessageCircle } from "lucide-react";

export function StickyContactBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-md border-t border-border safe-area-inset-bottom">
      <div className="grid grid-cols-2 divide-x divide-border">
        <a
          href="tel:+12255551234"
          className="flex items-center justify-center gap-2 py-4 text-foreground hover:bg-secondary transition-colors"
        >
          <Phone className="h-5 w-5 text-primary" />
          <span className="font-medium">Call Now</span>
        </a>
        <a
          href="sms:+12255551234"
          className="flex items-center justify-center gap-2 py-4 text-foreground hover:bg-secondary transition-colors"
        >
          <MessageCircle className="h-5 w-5 text-primary" />
          <span className="font-medium">Text Us</span>
        </a>
      </div>
    </div>
  );
}
