import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { App } from "./app";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { TripInvite } from "./pages/TripInvite";
import { TripDetails } from "./pages/TripDetails";
import { TripSummary } from "./pages/TripSummary";
import { GuestAccess } from "./pages/GuestAccess";
import { PrivateRoute } from "./components/PrivateRoute";
import { NotificationProvider } from "./components/Notification/context";
import { LoadingProvider } from "./components/LoadingContext";
import { ThemeProvider } from "./components/ThemeContext";
import "./index.css";
import "./styles/star-button.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="804681981965-p0i2u26uc2j5qj5pk8che46cidk3i0ik.apps.googleusercontent.com">
      <ThemeProvider>
        <NotificationProvider>
          <LoadingProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/trip/invite/:id" element={<TripInvite />} />
              <Route
                path="/trip/guest/:id/:accessId"
                element={<GuestAccess />}
              />
              <Route
                path="/trip/:id"
                element={
                  <PrivateRoute>
                    <TripDetails />
                  </PrivateRoute>
                }
              />
              <Route
                path="/trip/:id/summary"
                element={
                  <PrivateRoute>
                    <TripSummary />
                  </PrivateRoute>
                }
              />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <App />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </LoadingProvider>
      </NotificationProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
