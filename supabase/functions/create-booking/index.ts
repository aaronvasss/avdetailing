import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateBookingRequest {
  service_id: string;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time: string; // accepts "8:00 AM" or "08:00"/"08:00:00"
  duration_minutes?: number | null;

  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;

  vehicle_type?: string | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;

  service_address?: string | null;
  service_city?: string | null;
  service_zip?: string | null;
  address_notes?: string | null;

  subtotal?: number | null;
  add_ons_total?: number | null;
  total_price?: number | null;
  status?: string | null;
  payment_status?: string | null;
}

function toDbTime(input: string): string {
  const trimmed = String(input || "").trim();
  // 12h: 8:00 AM
  const m12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) {
    let hours = Number(m12[1]);
    const minutes = Number(m12[2]);
    const ampm = m12[3].toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  }

  // 24h: 08:00 or 08:00:00
  const m24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m24) {
    const hours = Number(m24[1]);
    const minutes = Number(m24[2]);
    const seconds = m24[3] ? Number(m24[3]) : 0;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  throw new Error(`Invalid scheduled_time format: "${trimmed}"`);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: CreateBookingRequest = await req.json();

    if (!body.service_id) {
      return new Response(JSON.stringify({ error: "Missing service_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!body.scheduled_date) {
      return new Response(JSON.stringify({ error: "Missing scheduled_date" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!body.scheduled_time) {
      return new Response(JSON.stringify({ error: "Missing scheduled_time" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scheduled_time = toDbTime(body.scheduled_time);

    // Determine authenticated user (if any)
    const authHeader = req.headers.get("Authorization") ?? "";
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });
    const { data: userData } = await anonClient.auth.getUser();
    const userId = userData?.user?.id ?? null;

    // Insert using service role (bypass RLS), but NEVER trust client-provided user_id
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate a secure manage token for guest access
    const manageToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");

    const insertPayload = {
      user_id: userId,
      service_id: body.service_id,
      scheduled_date: body.scheduled_date,
      scheduled_time,
      duration_minutes: body.duration_minutes ?? null,

      guest_name: userId ? null : body.guest_name ?? null,
      guest_email: userId ? null : body.guest_email ?? null,
      guest_phone: userId ? null : body.guest_phone ?? null,

      vehicle_type: body.vehicle_type ?? null,
      vehicle_make: body.vehicle_make ?? null,
      vehicle_model: body.vehicle_model ?? null,

      service_address: body.service_address ?? null,
      service_city: body.service_city ?? null,
      service_zip: body.service_zip ?? null,
      address_notes: body.address_notes ?? null,

      subtotal: body.subtotal ?? null,
      add_ons_total: body.add_ons_total ?? 0,
      total_price: body.total_price ?? null,
      status: body.status ?? "pending",
      payment_status: body.payment_status ?? "unpaid",
      payment_method: (body as any).payment_method ?? "in_person",
      manage_token: manageToken,
    };

    const { data: booking, error } = await serviceClient
      .from("bookings")
      .insert(insertPayload)
      .select("id, manage_token")
      .single();

    if (error) {
      console.error("create-booking insert error:", error);
      return new Response(
        JSON.stringify({
          error: error.message,
          code: (error as any).code,
          details: (error as any).details,
          hint: (error as any).hint,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ booking, manageToken: booking.manage_token }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-booking handler error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
};

serve(handler);
