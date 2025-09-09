// src/contexts/EventsContext.jsx
import { createContext, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext.jsx";
import useEvents from "../hooks/useEvents.js";
import useAdminAlerts from "../hooks/useAdminAlerts.js";

const EventsCtx = createContext({ events: [], connected: false });

export function EventsProvider({ children }) {
  const { user } = useAuth();
  const isAdmin = !!user && user.role === "admin";

  // اتصال واحد فقط، وتعطيل toast في useEvents لكي نتولّى التوست هنا
  const { events, connected } = useEvents({
    enabled: isAdmin,
    max: 200,
    toast: false,
  });

  // شغّل التنبيهات (توست + نوتيفك + صوت)
  useAdminAlerts({ enabled: isAdmin, events, playSound: true });

  const value = useMemo(() => ({ events, connected }), [events, connected]);
  return <EventsCtx.Provider value={value}>{children}</EventsCtx.Provider>;
}

export const useEventsCtx = () => useContext(EventsCtx);
