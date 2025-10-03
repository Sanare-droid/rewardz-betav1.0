import "./global.css";
import { useEffect } from "react";
import "@/lib/fetchPatch";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Alerts from "./pages/Alerts";
import Search from "./pages/Search";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Splash from "./pages/Splash";
import Onboarding from "./pages/Onboarding";
import GetStarted from "./pages/GetStarted";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Notifications from "./pages/NotificationsEnhanced";
import ResetPassword from "./pages/ResetPassword";
import RequireAuth from "@/components/RequireAuth";
import ReportLost from "./pages/ReportLost";
import ReportFound from "./pages/ReportFound";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import ReportSubmitted from "./pages/ReportSubmitted";
import ConfirmReunion from "./pages/ConfirmReunion";
import ClaimReward from "./pages/ClaimReward";
import Match from "./pages/Match";
import OwnerContact from "./pages/OwnerContact";
import ReportView from "./pages/ReportView";
import Poster from "./pages/PosterEnhanced";
import Dialer from "./pages/Dialer";
import AlertsMap from "./pages/AlertsMapEnhanced";
import Saved from "./pages/Saved";
import EditReport from "./pages/EditReportEnhanced";
import Messages from "./pages/MessagesEnhanced";
import NotificationSettings from "./pages/NotificationSettings";
import MessageSettings from "./pages/MessageSettings";
import Account from "./pages/Account";
import Help from "./pages/Help";
import Privacy from "./pages/Privacy";
import SavedSearches from "./pages/SavedSearchesEnhanced";
import Pets from "./pages/Pets";
import PetEdit from "./pages/PetEdit";
import PetView from "./pages/PetView";
import Admin from "./pages/Admin";
import PetOnboarding from "./pages/PetOnboarding";
import { UserProvider } from "./context/UserContext";
import GlobalErrors from "@/components/GlobalErrors";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
        <GlobalErrors />
      <Toaster />
      <Sonner />
      <UserProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/alerts/map" element={<AlertsMap />} />
            <Route path="/search" element={<Search />} />
            <Route path="/community" element={<Community />} />
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/saved"
              element={
                <RequireAuth>
                  <Saved />
                </RequireAuth>
              }
            />
            <Route
              path="/messages"
              element={
                <RequireAuth>
                  <Messages />
                </RequireAuth>
              }
            />

            <Route path="/splash" element={<Splash />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/get-started" element={<GetStarted />} />
            <Route path="/pet-onboarding" element={<PetOnboarding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/settings/notifications"
              element={<NotificationSettings />}
            />
            <Route path="/settings/messages" element={<MessageSettings />} />
            <Route
              path="/report-lost"
              element={
                <RequireAuth>
                  <ReportLost />
                </RequireAuth>
              }
            />
            <Route
              path="/report-found"
              element={
                <RequireAuth>
                  <ReportFound />
                </RequireAuth>
              }
            />
            <Route path="/payment" element={<Payment />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/report-submitted" element={<ReportSubmitted />} />
            <Route path="/confirm-reunion" element={<ConfirmReunion />} />
            <Route
              path="/report/:id/confirm-reunion"
              element={<ConfirmReunion />}
            />
            <Route path="/claim-reward" element={<ClaimReward />} />
            <Route path="/report/:id/claim-reward" element={<ClaimReward />} />
            <Route path="/match" element={<Match />} />
            <Route path="/owner" element={<OwnerContact />} />
            <Route path="/owner/:id" element={<OwnerContact />} />
            <Route path="/report/:id" element={<ReportView />} />
            <Route
              path="/report/:id/edit"
              element={
                <RequireAuth>
                  <EditReport />
                </RequireAuth>
              }
            />
            <Route path="/poster/:id?" element={<Poster />} />
            <Route path="/dialer" element={<Dialer />} />
            <Route
              path="/account"
              element={
                <RequireAuth>
                  <Account />
                </RequireAuth>
              }
            />
            <Route path="/help" element={<Help />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/saved-searches" element={<SavedSearches />} />
            <Route
              path="/pets"
              element={
                <RequireAuth>
                  <Pets />
                </RequireAuth>
              }
            />
            <Route
              path="/pets/new"
              element={
                <RequireAuth>
                  <PetEdit />
                </RequireAuth>
              }
            />
            <Route path="/pets/:id" element={<PetView />} />
            <Route
              path="/pets/:id/edit"
              element={
                <RequireAuth>
                  <PetEdit />
                </RequireAuth>
              }
            />
            <Route path="/admin" element={<Admin />} />

            {/* Aliases for Builder preview deep-links */}
            <Route path="/Index" element={<Index />} />
            <Route path="/index" element={<Index />} />
            <Route path="/GetStarted" element={<GetStarted />} />
            <Route path="/getstarted" element={<GetStarted />} />
            <Route path="/ClaimReward" element={<ClaimReward />} />
            <Route path="/claimreward" element={<ClaimReward />} />
            <Route path="/ConfirmReunion" element={<ConfirmReunion />} />
            <Route path="/confirmreunion" element={<ConfirmReunion />} />
            <Route path="/OwnerContact" element={<OwnerContact />} />
            <Route path="/ownercontact" element={<OwnerContact />} />
            <Route path="/PaymentSuccess" element={<PaymentSuccess />} />
            <Route path="/paymentsuccess" element={<PaymentSuccess />} />
            <Route path="/NotFound" element={<NotFound />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

const rootEl = document.getElementById("root");
if (rootEl) {
  // Prevent creating multiple roots during HMR or repeated module evaluation
  const win = window as any;
  if (!win.__APP_ROOT__) {
    win.__APP_ROOT__ = createRoot(rootEl);
  }
  try {
    win.__APP_ROOT__.render(<App />);
  } catch (e) {
    console.error("Failed to render React app", e);
  }
} else {
  // If root is missing, log an error but don't throw so the page can still show
  // server-rendered or static content.
  console.error("Root element not found: #root");
}

export default App;
