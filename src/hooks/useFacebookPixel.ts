import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

let pixelInitialized = false;

export const useFacebookPixel = () => {
  const [pixelId, setPixelId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPixelId = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "fb_pixel_id")
        .single();
      if (data?.value) setPixelId(data.value);
    };
    fetchPixelId();
  }, []);

  useEffect(() => {
    if (!pixelId || pixelInitialized) return;

    // Load Facebook Pixel script
    const script = document.createElement("script");
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window,document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    // Add noscript fallback to body
    const noscript = document.createElement("noscript");
    const img = document.createElement("img");
    img.height = 1;
    img.width = 1;
    img.style.display = "none";
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);

    pixelInitialized = true;
  }, [pixelId]);

  return pixelId;
};

export const trackFBEvent = (eventName: string, params?: Record<string, unknown>) => {
  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq("track", eventName, params);
  }
};

export const sendServerEvent = async (eventData: {
  event_name: string;
  customer_name: string;
  phone: string;
  value: number;
  currency?: string;
  content_name?: string;
}) => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    await fetch(`${supabaseUrl}/functions/v1/facebook-capi`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        ...eventData,
        source_url: window.location.href,
        fbc: getCookie("_fbc") || undefined,
        fbp: getCookie("_fbp") || undefined,
      }),
    });
  } catch (err) {
    console.error("CAPI event failed:", err);
  }
};

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}
