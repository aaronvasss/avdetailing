// Professional HTML receipt generator for AV Detailing
import { format } from "date-fns";

export interface ReceiptBooking {
  id: string;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  vehicle_type?: string | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: number | null;
  service_address?: string | null;
  service_city?: string | null;
  service_state?: string | null;
  service_zip?: string | null;
  custom_service_description?: string | null;
  total_price?: number | null;
  subtotal?: number | null;
  add_ons_total?: number | null;
  tip_amount?: number | null;
  payment_method?: string | null;
  payment_status?: string | null;
  stripe_checkout_session_id?: string | null;
  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  profiles?: { full_name?: string | null; email?: string | null; phone?: string | null } | null;
  services?: { name?: string | null; slug?: string | null } | null;
}

export interface ReceiptPackageInfo {
  name: string;
  price: number;
  slug?: string | null;
}

export interface ReceiptAddOn {
  id?: string;
  name: string;
  description?: string | null;
  price: number;
}

const PACKAGE_INCLUDES: Record<string, { items: string[]; duration: string }> = {
  basic: {
    items: [
      "Hand wash & rinse",
      "Wheel & tire cleaning",
      "Interior vacuum",
      "Dashboard wipe-down",
      "Interior windows",
      "Door jambs",
    ],
    duration: "1h 45min",
  },
  silver: {
    items: [
      "Everything in Basic",
      "Full interior detail",
      "Leather conditioning",
      "Spray wax",
      "Tire shine",
      "Air freshener",
    ],
    duration: "2h 20min",
  },
  gold: {
    items: [
      "Everything in Silver",
      "Paint sealant",
      "Engine bay cleaning",
      "Headlight restoration",
      "Interior shampoo",
      "Premium odor treatment",
    ],
    duration: "3h",
  },
};

const esc = (s: any) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fmtMoney = (n: number | null | undefined) => `$${Number(n || 0).toFixed(2)}`;

const fmtTime = (t: string | null | undefined) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const hh = ((h + 11) % 12) + 1;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${hh}:${String(m || 0).padStart(2, "0")} ${ampm}`;
};

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "";
  try {
    const date = new Date(`${d}T00:00:00`);
    return format(date, "EEEE, MMMM d, yyyy");
  } catch {
    return d || "";
  }
};

const vehicleLabel = (t: string | null | undefined) => {
  if (!t) return "";
  const map: Record<string, string> = {
    sedan: "Sedan",
    "car-sedan": "Car / Sedan",
    car: "Car",
    "suv-5": "SUV (5 seater)",
    "suv-large": "SUV (Large)",
    suv: "SUV",
    truck: "Truck",
    boat: "Boat",
    rv: "RV",
    aircraft: "Aircraft",
  };
  return map[t.toLowerCase()] || t;
};

const findIncludes = (pkg?: ReceiptPackageInfo | null) => {
  if (!pkg) return null;
  const key = (pkg.slug || pkg.name || "").toLowerCase();
  if (key.includes("basic")) return PACKAGE_INCLUDES.basic;
  if (key.includes("silver")) return PACKAGE_INCLUDES.silver;
  if (key.includes("gold")) return PACKAGE_INCLUDES.gold;
  return null;
};

export function generateBookingReceiptHTML(
  booking: ReceiptBooking,
  packageInfo?: ReceiptPackageInfo | null,
  addOns: ReceiptAddOn[] = []
): string {
  const customerName =
    booking.profiles?.full_name || booking.guest_name || "Customer";
  const customerEmail = booking.profiles?.email || booking.guest_email || "";
  const customerPhone = booking.profiles?.phone || booking.guest_phone || "";

  const receiptNo = booking.id.slice(0, 8).toUpperCase();
  const issuedDate = format(new Date(), "MMMM d, yyyy");

  const addOnsTotal =
    booking.add_ons_total != null
      ? Number(booking.add_ons_total)
      : addOns.reduce((s, a) => s + Number(a.price || 0), 0);

  const total = Number(booking.total_price || 0);
  const tip = Number(booking.tip_amount || 0);
  const pkgPrice = packageInfo?.price ?? Math.max(0, total - addOnsTotal - tip);
  const subtotal =
    booking.subtotal != null ? Number(booking.subtotal) : pkgPrice;

  const isPaid = (booking.payment_status || "").toLowerCase() === "paid";
  const includes = findIncludes(packageInfo);
  const packageName = packageInfo?.name || booking.services?.name || booking.custom_service_description || "Detailing Service";

  const vehicleLine = [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model]
    .filter(Boolean)
    .join(" ");

  const addOnsHTML = addOns.length
    ? `
      <div class="addons">
        ${addOns
          .map(
            (a) => `
          <div class="line-item">
            <div>
              <div class="line-name">${esc(a.name)}</div>
              ${a.description ? `<div class="line-desc">${esc(a.description)}</div>` : ""}
            </div>
            <div class="line-price">${fmtMoney(a.price)}</div>
          </div>`
          )
          .join("")}
      </div>`
    : "";

  const includesHTML = includes
    ? `
      <div class="includes">
        <div class="includes-title">What's Included <span class="duration">· ${esc(includes.duration)}</span></div>
        <ul>
          ${includes.items.map((i) => `<li><span class="check">✓</span>${esc(i)}</li>`).join("")}
        </ul>
      </div>`
    : "";

  return `
<section class="receipt">
  <header class="r-header">
    <div class="logo">
      <span class="logo-av">AV</span><span class="logo-detailing">DETAILING</span>
    </div>
    <div class="r-title">
      <div class="r-tag">SERVICE RECEIPT</div>
      <div class="r-meta">Receipt #${esc(receiptNo)}</div>
      <div class="r-meta">Issued ${esc(issuedDate)}</div>
    </div>
  </header>
  <div class="r-bar"></div>

  <div class="r-body">
    <div class="row two-col">
      <div>
        <div class="label">Billed To</div>
        <div class="value strong">${esc(customerName)}</div>
        ${customerEmail ? `<div class="value">${esc(customerEmail)}</div>` : ""}
        ${customerPhone ? `<div class="value">${esc(customerPhone)}</div>` : ""}
      </div>
      <div>
        <div class="label">Service Location</div>
        <div class="value">${esc(booking.service_address || "—")}</div>
        <div class="value">${esc([booking.service_city, booking.service_state, booking.service_zip].filter(Boolean).join(", "))}</div>
      </div>
    </div>

    <div class="appt-card">
      <div><div class="label">Date</div><div class="value strong">${esc(fmtDate(booking.scheduled_date))}</div></div>
      <div><div class="label">Time</div><div class="value strong">${esc(fmtTime(booking.scheduled_time))}</div></div>
      <div><div class="label">Vehicle</div><div class="value strong">${esc(vehicleLine || "—")}</div><div class="value muted">${esc(vehicleLabel(booking.vehicle_type))}</div></div>
    </div>

    <div class="section-title">Services Rendered</div>
    <div class="line-item pkg">
      <div class="line-name strong">${esc(packageName)}</div>
      <div class="line-price strong">${fmtMoney(pkgPrice)}</div>
    </div>
    ${includesHTML}
    ${addOns.length ? `<div class="section-subtitle">Add-ons</div>${addOnsHTML}` : ""}

    <div class="totals">
      <div class="t-row"><span>Subtotal</span><span>${fmtMoney(subtotal)}</span></div>
      ${addOnsTotal > 0 ? `<div class="t-row"><span>Add-ons</span><span>${fmtMoney(addOnsTotal)}</span></div>` : ""}
      ${tip > 0 ? `<div class="t-row tip"><span>Tip</span><span>${fmtMoney(tip)}</span></div>` : ""}
      <div class="t-row total"><span>Total Paid</span><span class="amt">${fmtMoney(total)}</span></div>
    </div>

    <div class="payment">
      <div><span class="label">Method</span> <span class="value strong">${esc((booking.payment_method || "—").replace(/_/g, " "))}</span></div>
      <div><span class="label">Status</span> <span class="status ${isPaid ? "paid" : ""}">${esc(booking.payment_status || "unpaid")}</span></div>
      ${booking.stripe_checkout_session_id ? `<div><span class="label">Stripe</span> <span class="value mono">${esc(booking.stripe_checkout_session_id.slice(0, 20))}…</span></div>` : ""}
    </div>

    <footer class="r-footer">
      <div class="contact">
        <div>(225) 521-6264 · avdetailing.net</div>
        <div class="thanks">Thank you for choosing AV Detailing!</div>
      </div>
      <div class="review">⭐ Loved your service? Leave us a Google review!</div>
    </footer>
  </div>
</section>`;
}

const RECEIPT_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #111827; }
  .receipt { max-width: 760px; margin: 0 auto 32px; background: #fff; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 8px; overflow: hidden; page-break-after: always; }
  .receipt:last-child { page-break-after: auto; }
  .r-header { background: #000; color: #fff; padding: 28px 36px; display: flex; justify-content: space-between; align-items: center; }
  .logo { font-size: 28px; font-weight: 900; letter-spacing: 1px; }
  .logo-av { color: #dc2626; }
  .logo-detailing { color: #fff; margin-left: 6px; }
  .r-title { text-align: right; }
  .r-tag { color: #dc2626; font-weight: 800; letter-spacing: 2px; font-size: 13px; margin-bottom: 6px; }
  .r-meta { color: #d1d5db; font-size: 12px; }
  .r-bar { height: 4px; background: #dc2626; }
  .r-body { padding: 32px 36px; }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 4px; font-weight: 600; }
  .value { font-size: 14px; color: #1f2937; line-height: 1.5; }
  .value.muted { color: #6b7280; font-size: 12px; }
  .strong { font-weight: 700; color: #111827; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 24px; }
  .appt-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 18px 20px; display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 24px; margin-bottom: 28px; }
  .section-title { font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #111827; font-weight: 800; border-bottom: 2px solid #111827; padding-bottom: 8px; margin-bottom: 14px; }
  .section-subtitle { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin: 16px 0 8px; font-weight: 700; }
  .line-item { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 0; gap: 16px; }
  .line-item.pkg { border-bottom: 1px solid #f3f4f6; }
  .line-name { font-size: 14px; }
  .line-desc { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .line-price { font-size: 14px; white-space: nowrap; }
  .includes { background: #f9fafb; border-radius: 6px; padding: 14px 18px; margin: 8px 0 16px; }
  .includes-title { font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  .includes-title .duration { color: #6b7280; font-weight: 500; text-transform: none; letter-spacing: 0; }
  .includes ul { list-style: none; margin: 0; padding: 0; columns: 2; column-gap: 24px; }
  .includes li { font-size: 13px; color: #1f2937; padding: 3px 0; break-inside: avoid; }
  .check { color: #dc2626; font-weight: 800; margin-right: 8px; }
  .addons .line-item { border-bottom: 1px dashed #e5e7eb; }
  .addons .line-item:last-child { border-bottom: none; }
  .totals { margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 14px; }
  .t-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #374151; }
  .t-row.tip { color: #059669; font-weight: 600; }
  .t-row.total { background: #000; color: #fff; padding: 14px 18px; margin: 12px -18px 0; border-radius: 4px; font-size: 16px; font-weight: 700; }
  .t-row.total .amt { color: #dc2626; font-size: 18px; }
  .payment { display: flex; gap: 28px; flex-wrap: wrap; padding: 18px 0; border-top: 1px solid #e5e7eb; margin-top: 18px; font-size: 13px; }
  .payment .label { display: inline; margin-right: 6px; }
  .status { display: inline-block; padding: 2px 10px; border-radius: 999px; background: #f3f4f6; color: #374151; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .status.paid { background: #d1fae5; color: #065f46; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: #4b5563; }
  .r-footer { margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
  .contact { font-size: 13px; color: #4b5563; }
  .thanks { font-weight: 700; color: #111827; margin-top: 4px; }
  .review { background: #fee2e2; color: #991b1b; padding: 10px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; }
  @media print {
    body { background: #fff; padding: 0; }
    .receipt { box-shadow: none; border-radius: 0; max-width: 100%; margin: 0; }
    .no-print { display: none !important; }
  }
`;

export function openReceiptPrintWindow(html: string, title = "AV Detailing Receipt") {
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${RECEIPT_CSS}</style></head><body>${html}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));<\/script></body></html>`);
  win.document.close();
}
