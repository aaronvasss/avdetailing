import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import ServicesPage from "./pages/ServicesPage";
import CarDetailingPage from "./pages/services/CarDetailingPage";
import CeramicCoatingPage from "./pages/services/CeramicCoatingPage";
import PaintCorrectionPage from "./pages/services/PaintCorrectionPage";
import BoatDetailingPage from "./pages/services/BoatDetailingPage";
import RVDetailingPage from "./pages/services/RVDetailingPage";
import AircraftDetailingPage from "./pages/services/AircraftDetailingPage";
import CarDetailingBatonRougePage from "./pages/CarDetailingBatonRougePage";
import AboutPage from "./pages/AboutPage";
import MembershipsPage from "./pages/MembershipsPage";
import GalleryPage from "./pages/GalleryPage";
import ReviewsPage from "./pages/ReviewsPage";
import ContactPage from "./pages/ContactPage";
import ServiceAreasPage from "./pages/ServiceAreasPage";
import BookingPage from "./pages/BookingPage";
import BookingManagePage from "@/pages/BookingManagePage";
import BookingCancelPage from "@/pages/BookingCancelPage";
import PublicCancelPage from "@/pages/PublicCancelPage";
import BookingSuccessPage from "./pages/BookingSuccessPage";
import BookingCanceledPage from "./pages/BookingCanceledPage";
import AuthPage from "./pages/AuthPage";
import AccountPage from "./pages/AccountPage";
import AdminPage from "./pages/AdminPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsAndConditionsPage from "./pages/TermsAndConditionsPage";
import WorkerLoginPage from "./pages/WorkerLoginPage";
import WorkerDashboardPage from "./pages/WorkerDashboardPage";
import WorkerAllJobsPage from "./pages/WorkerAllJobsPage";
import WorkerEarningsPage from "./pages/WorkerEarningsPage";
import WorkerTimesheetPage from "./pages/WorkerTimesheetPage";
import WorkerProfilePage from "./pages/WorkerProfilePage";
import WorkerChatPage from "./pages/WorkerChatPage";
import RatingPage from "./pages/RatingPage";


const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/car-detailing" element={<CarDetailingPage />} />
              <Route path="/services/ceramic-coating" element={<CeramicCoatingPage />} />
              <Route path="/services/paint-correction" element={<PaintCorrectionPage />} />
              <Route path="/services/boat-detailing" element={<BoatDetailingPage />} />
              <Route path="/services/rv-detailing" element={<RVDetailingPage />} />
              <Route path="/services/aircraft-detailing" element={<AircraftDetailingPage />} />
              <Route path="/car-detailing-baton-rouge" element={<CarDetailingBatonRougePage />} />
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

          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
