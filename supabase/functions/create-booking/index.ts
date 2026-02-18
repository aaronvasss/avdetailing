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
  scheduled_date: string;
  scheduled_time: string;
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
  payment_method?: string | null;

  // Add-on IDs from service_add_ons table
  add_on_ids?: string[];
}

function toDbTime(input: string): string {
  const trimmed = String(input || "").trim();
  const m12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) {
    let hours = Number(m12[1]);
    const minutes = Number(m12[2]);
    const ampm = m12[3].toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  }

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

    // Server-side input validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?$/i;

    if (!body.service_id || !uuidRegex.test(body.service_id)) {
      return new Response(JSON.stringify({ error: "Invalid service" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!body.scheduled_date || !dateRegex.test(body.scheduled_date)) {
      return new Response(JSON.stringify({ error: "Invalid date" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!body.scheduled_time || !timeRegex.test(body.scheduled_time)) {
      return new Response(JSON.stringify({ error: "Invalid time" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate add_on_ids format
    const addOnIds = (body.add_on_ids || []).filter(id => uuidRegex.test(id));

    // Sanitize and validate optional text fields
    const sanitize = (val: string | null | undefined, maxLen: number): string | null => {
      if (!val) return null;
      return String(val).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').slice(0, maxLen);
    };
    const validateEmail = (email: string | null | undefined): string | null => {
      if (!email) return null;
      const trimmed = String(email).trim().slice(0, 255);
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : null;
    };
    const validatePhone = (phone: string | null | undefined): string | null => {
      if (!phone) return null;
      const trimmed = String(phone).trim().slice(0, 20);
      return /^[\d\s()+-]{10,20}$/.test(trimmed) ? trimmed : null;
    };

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

    // Insert using service role (bypass RLS)
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate a secure manage token for guest access
    const manageToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");

    const insertPayload = {
      user_id: userId,
      service_id: body.service_id,
      scheduled_date: body.scheduled_date,
      scheduled_time,
      duration_minutes: body.duration_minutes != null ? Math.min(Math.max(0, Number(body.duration_minutes)), 1440) : null,

      guest_name: userId ? null : sanitize(body.guest_name, 100),
      guest_email: userId ? null : validateEmail(body.guest_email),
      guest_phone: userId ? null : validatePhone(body.guest_phone),

      vehicle_type: sanitize(body.vehicle_type, 50),
      vehicle_make: sanitize(body.vehicle_make, 50),
      vehicle_model: sanitize(body.vehicle_model, 50),

      service_address: sanitize(body.service_address, 200),
      service_city: sanitize(body.service_city, 100),
      service_zip: sanitize(body.service_zip, 10),
      address_notes: sanitize(body.address_notes, 500),

      subtotal: body.subtotal != null ? Math.max(0, Number(body.subtotal)) : null,
      add_ons_total: body.add_ons_total != null ? Math.max(0, Number(body.add_ons_total)) : 0,
      total_price: body.total_price != null ? Math.max(0, Number(body.total_price)) : null,
      status: body.status ?? "pending",
      payment_status: body.payment_status ?? "unpaid",
      payment_method: body.payment_method ?? "in_person",
      manage_token: manageToken,
    };

    const { data: booking, error } = await serviceClient
      .from("bookings")
      .insert(insertPayload)
      .select("id, manage_token")
      .single();

    if (error) {
      const errorId = crypto.randomUUID();
      console.error(`create-booking error ${errorId}:`, error);
      return new Response(
        JSON.stringify({ error: "Failed to create booking. Please try again.", errorId }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create booking_add_ons records if add-on IDs provided
    if (addOnIds.length > 0 && booking?.id) {
      // Look up add-on details from service_add_ons table
      const { data: addOns } = await serviceClient
        .from("service_add_ons")
        .select("id, name, price")
        .in("id", addOnIds)
        .eq("is_active", true);

      if (addOns && addOns.length > 0) {
        const addOnRecords = addOns.map(addon => ({
          booking_id: booking.id,
          add_on_id: addon.id,
          name: addon.name,
          price: Number(addon.price),
        }));

        const { error: addOnError } = await serviceClient
          .from("booking_add_ons")
          .insert(addOnRecords);

        if (addOnError) {
          console.error("Error creating booking_add_ons:", addOnError);
        } else {
          console.log(`Created ${addOnRecords.length} booking_add_ons for booking ${booking.id}`);
        }
      }
    }

    return new Response(JSON.stringify({ booking, manageToken: booking.manage_token }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorId = crypto.randomUUID();
    console.error(`create-booking handler error ${errorId}:`, err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again.", errorId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
};

serve(handler);
