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
  vehicle_year?: number | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;

  // Boat-specific fields
  boat_type?: string | null;
  boat_length?: string | null;
  boat_brand?: string | null;

  // Aircraft-specific fields
  aircraft_type?: string | null;
  tail_number?: string | null;

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

  assigned_worker_id?: string | null;

  // Add-on IDs from service_add_ons table
  add_on_ids?: string[];

  // Skip notifications for past-date bookings created by admin
  skip_notifications?: boolean;

  // Direct client linkage from admin search
  client_id?: string | null;

  // Per-booking worker pay rate override
  worker_pay_type?: string | null;
  worker_pay_rate?: number | null;

  // Tip amount for cash/in-person payments
  tip_amount?: number | null;

  // Custom service description (when "Custom Service" is selected)
  custom_service_description?: string | null;
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

    // Look up service base price and name from DB
    const { data: service, error: serviceError } = await serviceClient
      .from("services")
      .select("base_price, name")
      .eq("id", body.service_id)
      .single();

    if (serviceError || !service) {
      return new Response(JSON.stringify({ error: "Invalid service" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate add-on total from DB prices (not client-supplied values)
    let serverAddOnsTotal = 0;
    if (addOnIds.length > 0) {
      const { data: addOnsData } = await serviceClient
        .from("service_add_ons")
        .select("id, price")
        .in("id", addOnIds)
        .eq("is_active", true);
      if (addOnsData) {
        serverAddOnsTotal = addOnsData.reduce((sum, a) => sum + Number(a.price), 0);
      }
    }

    // Check if caller is admin/staff — if so, trust their supplied pricing (package-based)
    const isCallerStaff = userId ? await (async () => {
      const { data } = await serviceClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["admin", "staff"]);
      return data && data.length > 0;
    })() : false;

    // Determine pricing: admin-supplied values take priority if caller is staff
    let finalSubtotal: number;
    let finalAddOnsTotal: number;
    let finalTotal: number;

    if (isCallerStaff && body.total_price != null && body.total_price > 0) {
      // Admin/staff supplied specific pricing (from package selection or custom)
      finalSubtotal = body.subtotal != null ? Number(body.subtotal) : Number(body.total_price);
      finalAddOnsTotal = body.add_ons_total != null ? Number(body.add_ons_total) : serverAddOnsTotal;
      finalTotal = Number(body.total_price);
    } else {
      // Default: calculate from service base_price
      finalSubtotal = Number(service.base_price);
      finalAddOnsTotal = serverAddOnsTotal;
      finalTotal = finalSubtotal + finalAddOnsTotal;
    }

    // Determine status: admin can set custom status for past bookings
    let finalStatus = "pending";
    let finalPaymentStatus = "unpaid";
    let finalPaymentMethod = body.payment_method === "online" ? "online" : "in_person";

    if (isCallerStaff) {
      // Admin can set status, payment_status, and payment_method
      if (body.status) finalStatus = body.status;
      if (body.payment_status) finalPaymentStatus = body.payment_status;
      if (body.payment_method) finalPaymentMethod = body.payment_method;
    }

    const insertPayload = {
      user_id: userId,
      service_id: body.service_id,
      scheduled_date: body.scheduled_date,
      scheduled_time,
      duration_minutes: body.duration_minutes != null ? Math.min(Math.max(0, Number(body.duration_minutes)), 1440) : null,

      // Always store guest fields when provided — admin may create bookings on behalf of customers
      guest_name: sanitize(body.guest_name, 100),
      guest_email: validateEmail(body.guest_email),
      guest_phone: validatePhone(body.guest_phone),

      vehicle_type: sanitize(body.vehicle_type, 50),
      vehicle_year: body.vehicle_year != null ? Math.min(Math.max(1900, Number(body.vehicle_year)), 2100) : null,
      vehicle_make: sanitize(body.vehicle_make, 50),
      vehicle_model: sanitize(body.vehicle_model, 50),

      service_address: sanitize(body.service_address, 200),
      service_city: sanitize(body.service_city, 100),
      service_zip: sanitize(body.service_zip, 10),
      address_notes: sanitize(body.address_notes, 500),

      subtotal: finalSubtotal,
      add_ons_total: finalAddOnsTotal,
      total_price: finalTotal,
      status: finalStatus,
      payment_status: finalPaymentStatus,
      payment_method: finalPaymentMethod,
      manage_token: manageToken,
      assigned_worker_id: body.assigned_worker_id && uuidRegex.test(body.assigned_worker_id) ? body.assigned_worker_id : null,
      worker_pay_type: body.worker_pay_type === "percentage" || body.worker_pay_type === "flat" ? body.worker_pay_type : null,
      worker_pay_rate: body.worker_pay_rate != null ? Math.min(Math.max(0, Number(body.worker_pay_rate)), 100000) : null,
      tip_amount: body.tip_amount != null ? Math.min(Math.max(0, Number(body.tip_amount)), 10000) : null,
      custom_service_description: sanitize(body.custom_service_description, 500),
    };

    // ── Upsert client record ──
    let clientId: string | null = null;
    const guestEmail = validateEmail(body.guest_email);
    const guestPhone = validatePhone(body.guest_phone);
    const guestName = sanitize(body.guest_name, 100);

    if (guestEmail || guestPhone) {
      // Try to find existing client by email or phone
      let existingClient = null;
      if (guestEmail) {
        const { data } = await serviceClient
          .from("clients")
          .select("id")
          .eq("email", guestEmail)
          .limit(1)
          .maybeSingle();
        existingClient = data;
      }
      if (!existingClient && guestPhone) {
        const { data } = await serviceClient
          .from("clients")
          .select("id")
          .eq("phone", guestPhone)
          .limit(1)
          .maybeSingle();
        existingClient = data;
      }

      if (existingClient) {
        clientId = existingClient.id;
        // Update client with latest info
        const updatePayload: Record<string, unknown> = {};
        if (guestName) {
          const parts = guestName.split(" ");
          updatePayload.full_name = guestName;
          updatePayload.first_name = parts[0] || null;
          updatePayload.last_name = parts.slice(1).join(" ") || null;
        }
        if (guestEmail) updatePayload.email = guestEmail;
        if (guestPhone) updatePayload.phone = guestPhone;
        if (insertPayload.service_address) updatePayload.address_line1 = insertPayload.service_address;
        if (insertPayload.service_city) updatePayload.city = insertPayload.service_city;
        if (insertPayload.service_zip) updatePayload.zip = insertPayload.service_zip;
        if (Object.keys(updatePayload).length > 0) {
          await serviceClient.from("clients").update(updatePayload).eq("id", clientId);
        }
      } else {
        // Create new client
        const nameParts = (guestName || "").split(" ");
        const { data: newClient } = await serviceClient
          .from("clients")
          .insert({
            full_name: guestName,
            first_name: nameParts[0] || null,
            last_name: nameParts.slice(1).join(" ") || null,
            email: guestEmail,
            phone: guestPhone,
            address_line1: insertPayload.service_address,
            city: insertPayload.service_city,
            zip: insertPayload.service_zip,
            source: "booking",
          })
          .select("id")
          .single();
        if (newClient) clientId = newClient.id;
      }
    }

    // If client_id was passed directly (from admin search), use it
    if (body.client_id && uuidRegex.test(body.client_id)) {
      clientId = body.client_id;
    }

    const { data: booking, error } = await serviceClient
      .from("bookings")
      .insert({ ...insertPayload, client_id: clientId })
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

    // Skip notifications for past-date bookings (admin creating historical records)
    if (!body.skip_notifications) {
      // Notify workers about new booking
      try {
        const formatTime12 = (t: string) => {
          const [h, m] = t.split(":");
          const hour = parseInt(h);
          return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
        };
        await fetch(`${SUPABASE_URL}/functions/v1/notify-workers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            type: "new_booking",
            booking_id: booking.id,
            service_name: service.name,
            customer_name: insertPayload.guest_name || "Customer",
            scheduled_date: body.scheduled_date,
            scheduled_time: formatTime12(scheduled_time),
            address: insertPayload.service_address || "",
          }),
        });
      } catch (notifyErr) {
        console.error("Failed to notify workers:", notifyErr);
      }

      // Send booking confirmation emails (customer + admin)
      try {
        console.log(`Triggering notifications for booking ${booking.id}...`);
        const notifRes = await fetch(`${SUPABASE_URL}/functions/v1/process-booking-notifications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            booking_id: booking.id,
            mode: "auto",
          }),
        });
        const notifData = await notifRes.json().catch(() => ({}));
        console.log(`Notification response ${notifRes.status}:`, JSON.stringify(notifData));
        if (!notifRes.ok) {
          console.error(`Notification function returned ${notifRes.status}:`, notifData);
        }
      } catch (emailErr) {
        console.error("Failed to send booking notifications:", emailErr);
      }
    } else {
      console.log(`Skipping notifications for past-date booking ${booking.id}`);
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
