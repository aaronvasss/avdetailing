import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WorkerLayout } from "@/components/worker/WorkerLayout";
import { TeamChat } from "@/components/chat/TeamChat";

export default function WorkerChatPage() {
  return (
    <WorkerLayout>
      <TeamChat />
    </WorkerLayout>
  );
}
