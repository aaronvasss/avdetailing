import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GhlChatWidget } from "@/components/GhlChatWidget";
import { SERVICE_LANDING_PAGES } from "@/data/serviceLandingPages";
import { LOCATION_PAGES } from "@/data/locationPages";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const UnauthorizedPage = lazy(() => import("./pages/UnauthorizedPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const CarDetailingBatonRougePage = lazy(() => import("./pages/CarDetailingBatonRougePage"));
const RVDetailingBatonRougePage = lazy(() => import("./pages/RVDetailingBatonRougePage"));
const BoatDetailingBatonRougePage = lazy(() => import("./pages/BoatDetailingBatonRougePage"));
const AircraftDetailingBatonRougePage = lazy(() => import("./pages/AircraftDetailingBatonRougePage"));
const CeramicCoatingBatonRougePage = lazy(() => import("./pages/CeramicCoatingBatonRougePage"));
const PaintCorrectionBatonRougePage = lazy(() => import("./pages/PaintCorrectionBatonRougePage"));
const ServiceLandingPage = lazy(() => import("./pages/ServiceLandingPage"));
const LocationLandingPage = lazy(() => import("./pages/LocationLandingPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const MembershipsPage = lazy(() => import("./pages/MembershipsPage"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const ReviewsPage = lazy(() => import("./pages/ReviewsPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const ServiceAreasPage = lazy(() => import("./pages/ServiceAreasPage"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const BookingManagePage = lazy(() => import("@/pages/BookingManagePage"));
const BookingCancelPage = lazy(() => import("@/pages/BookingCancelPage"));
const PublicCancelPage = lazy(() => import("@/pages/PublicCancelPage"));
const BookingSuccessPage = lazy(() => import("./pages/BookingSuccessPage"));
const BookingCanceledPage = lazy(() => import("./pages/BookingCanceledPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsAndConditionsPage = lazy(() => import("./pages/TermsAndConditionsPage"));
const WorkerLoginPage = lazy(() => import("./pages/WorkerLoginPage"));
const WorkerDashboardPage = lazy(() => import("./pages/WorkerDashboardPage"));
const WorkerAllJobsPage = lazy(() => import("./pages/WorkerAllJobsPage"));
const WorkerEarningsPage = lazy(() => import("./pages/WorkerEarningsPage"));
const WorkerTimesheetPage = lazy(() => import("./pages/WorkerTimesheetPage"));
const WorkerProfilePage = lazy(() => import("./pages/WorkerProfilePage"));
const WorkerChatPage = lazy(() => import("./pages/WorkerChatPage"));
const RatingPage = lazy(() => import("./pages/RatingPage"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <GhlChatWidget />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/services/car-detailing" element={<Navigate to="/car-detailing-baton-rouge" replace />} />
                <Route path="/services/ceramic-coating" element={<Navigate to="/ceramic-coating-baton-rouge" replace />} />
                <Route path="/services/paint-correction" element={<Navigate to="/paint-correction-baton-rouge" replace />} />
                <Route path="/services/boat-detailing" element={<Navigate to="/boat-detailing-baton-rouge" replace />} />
                <Route path="/services/rv-detailing" element={<Navigate to="/rv-detailing-baton-rouge" replace />} />
                <Route path="/services/aircraft-detailing" element={<Navigate to="/aircraft-detailing-baton-rouge" replace />} />
                <Route path="/car-detailing-baton-rouge" element={<CarDetailingBatonRougePage />} />
                <Route path="/rv-detailing-baton-rouge" element={<RVDetailingBatonRougePage />} />
                <Route path="/boat-detailing-baton-rouge" element={<BoatDetailingBatonRougePage />} />
                <Route path="/aircraft-detailing-baton-rouge" element={<AircraftDetailingBatonRougePage />} />
                <Route path="/ceramic-coating-baton-rouge" element={<CeramicCoatingBatonRougePage />} />
                <Route path="/paint-correction-baton-rouge" element={<PaintCorrectionBatonRougePage />} />
                {SERVICE_LANDING_PAGES.filter((p) => p.slug !== "ceramic-coating-baton-rouge" && p.slug !== "paint-correction-baton-rouge").map((p) => (
                  <Route
                    key={p.slug}
                    path={`/${p.slug}`}
                    element={<ServiceLandingPage slug={p.slug} />}
                  />
                ))}
                {LOCATION_PAGES.map((p) => (
                  <Route
                    key={p.slug}
                    path={`/${p.slug}`}
                    element={<LocationLandingPage slug={p.slug} />}
                  />
                ))}
                <Route path="/about" element={<AboutPage />} />
                <Route path="/memberships" element={<MembershipsPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/reviews" element={<ReviewsPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/service-areas" element={<ServiceAreasPage />} />
                <Route path="/book" element={<BookingPage />} />
                <Route path="/booking/manage" element={<BookingManagePage />} />
                <Route path="/booking/cancel" element={<BookingCancelPage />} />
                <Route path="/cancel/:bookingId" element={<PublicCancelPage />} />
                <Route path="/booking/success" element={<BookingSuccessPage />} />
                <Route path="/booking/canceled" element={<BookingCanceledPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
                <Route path="/rate/:bookingId" element={<RatingPage />} />
                <Route path="/worker/login" element={<WorkerLoginPage />} />

                {/* Protected: Customer + Admin */}
                <Route path="/account" element={
                  <ProtectedRoute requiredRole={["customer", "admin"]}>
                    <AccountPage />
                  </ProtectedRoute>
                } />

                {/* Protected: Admin only */}
                <Route path="/admin" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminPage />
                  </ProtectedRoute>
                } />

                {/* Protected: Worker (staff + admin) */}
                <Route path="/worker" element={
                  <ProtectedRoute requiredRole={["staff", "admin"]}>
                    <WorkerDashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/worker/jobs" element={
                  <ProtectedRoute requiredRole={["staff", "admin"]}>
                    <WorkerAllJobsPage />
                  </ProtectedRoute>
                } />
                <Route path="/worker/chat" element={
                  <ProtectedRoute requiredRole={["staff", "admin"]}>
                    <WorkerChatPage />
                  </ProtectedRoute>
                } />
                <Route path="/worker/earnings" element={
                  <ProtectedRoute requiredRole={["staff", "admin"]}>
                    <WorkerEarningsPage />
                  </ProtectedRoute>
                } />
                <Route path="/worker/timesheet" element={
                  <ProtectedRoute requiredRole={["staff", "admin"]}>
                    <WorkerTimesheetPage />
                  </ProtectedRoute>
                } />
                <Route path="/worker/profile" element={
                  <ProtectedRoute requiredRole={["staff", "admin"]}>
                    <WorkerProfilePage />
                  </ProtectedRoute>
                } />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
