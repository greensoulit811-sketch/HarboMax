import { supabase } from "@/integrations/supabase/client";

// --- Types ---
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

interface FBEventParams {
  content_ids?: string[] | number[];
  content_name?: string;
  content_type?: string;
  contents?: Array<{ id: string | number; quantity: number }>;
  currency?: string;
  value?: number;
  [key: string]: any;
}

// --- Cookie Helpers ---
export const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
};

// --- Browser Tracking ---
export const trackFBEvent = (eventName: string, params?: FBEventParams) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, params);
    console.log(`[Meta Pixel] Event: ${eventName}`, params);
  } else {
    console.warn(`[Meta Pixel] fbq not found. Failed to track: ${eventName}`);
  }
};

// --- CAPI Tracking ---
interface CAPIEventData {
  event_name: string;
  customer_name?: string;
  phone?: string;
  email?: string;
  value?: number;
  currency?: string;
  content_name?: string;
  content_ids?: string[];
  [key: string]: any;
}

export const sendServerEvent = async (eventData: CAPIEventData) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Using Supabase Edge Function to proxy CAPI requests securely
    const { data, error } = await supabase.functions.invoke("facebook-capi", {
      body: {
        ...eventData,
        source_url: window.location.href,
        fbc: getCookie("_fbc"),
        fbp: getCookie("_fbp"),
        user_agent: navigator.userAgent,
      },
    });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("[Meta CAPI] Event failed:", err);
    return null;
  }
};
