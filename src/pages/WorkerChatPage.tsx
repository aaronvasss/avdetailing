import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WorkerLayout } from "@/components/worker/WorkerLayout";
import { TeamChat } from "@/components/chat/TeamChat";
import { SEOHead } from "@/components/seo/SEOHead";

export default function WorkerChatPage() {
  return (
    <WorkerLayout>
      <SEOHead title="Worker Chat" description="Private page." path="/worker/chat" noIndex />
      <TeamChat />
    </WorkerLayout>
  );
}
