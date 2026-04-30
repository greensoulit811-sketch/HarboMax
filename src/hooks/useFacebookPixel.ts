import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

let isPixelScriptLoaded = false;
let currentPixelId: string | null = null;

export const useFacebookPixel = () => {
  const location = useLocation();
  const initializedRef = useRef(false);

  useEffect(() => {
    const initPixel = async () => {
      try {
        // 1. Fetch Pixel ID
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "fb_pixel_id")
          .maybeSingle();

        const pixelId = data?.value;
        if (!pixelId) return;

        currentPixelId = pixelId;

        // 2. Load Script if not loaded
        if (!isPixelScriptLoaded) {
          (function (f: any, b: Document, e: string, v: string, n: any, t?: any, s?: any) {
            if (f.fbq) return;
            n = f.fbq = function () {
              n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
            };
            if (!f._fbq) f._fbq = n;
            n.push = n;
            n.loaded = !0;
            n.version = "2.0";
            n.queue = [];
            t = b.createElement(e);
            t.async = !0;
            t.src = v;
            s = b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t, s);
          })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
          
          isPixelScriptLoaded = true;
          window.fbq("init", pixelId);
        }

        // 3. Fire PageView on every route change
        window.fbq("track", "PageView");
        console.log(`[Meta Pixel] PageView tracked: ${location.pathname}`);

      } catch (err) {
        console.error("[Meta Pixel] Error:", err);
      }
    };

    initPixel();
  }, [location.pathname]);
};
