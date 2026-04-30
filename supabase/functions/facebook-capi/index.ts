import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get settings
    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["fb_pixel_id", "fb_capi_token"]);

    const pixelId = settings?.find((s: any) => s.key === "fb_pixel_id")?.value;
    const capiToken = settings?.find((s: any) => s.key === "fb_capi_token")?.value;

    if (!pixelId || !capiToken) {
      return new Response(
        JSON.stringify({ error: "Facebook Pixel ID or CAPI token not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      event_name,
      customer_name,
      phone,
      value,
      currency = "BDT",
      content_name,
      source_url,
      fbc,
      fbp,
    } = body;

    if (!event_name) {
      return new Response(
        JSON.stringify({ error: "event_name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash user data for CAPI
    const encoder = new TextEncoder();
    const hashPhone = phone
      ? Array.from(
          new Uint8Array(
            await crypto.subtle.digest("SHA-256", encoder.encode(phone.replace(/\D/g, "")))
          )
        ).map((b) => b.toString(16).padStart(2, "0")).join("")
      : undefined;

    const hashName = customer_name
      ? Array.from(
          new Uint8Array(
            await crypto.subtle.digest("SHA-256", encoder.encode(customer_name.toLowerCase().trim()))
          )
        ).map((b) => b.toString(16).padStart(2, "0")).join("")
      : undefined;

    const eventTime = Math.floor(Date.now() / 1000);
    const eventId = `${event_name}_${eventTime}_${crypto.randomUUID().slice(0, 8)}`;

    const payload = {
      data: [
        {
          event_name,
          event_time: eventTime,
          event_id: eventId,
          event_source_url: source_url,
          action_source: "website",
          user_data: {
            ph: hashPhone ? [hashPhone] : undefined,
            fn: hashName ? [hashName] : undefined,
            fbc: fbc || undefined,
            fbp: fbp || undefined,
            client_ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
            client_user_agent: req.headers.get("user-agent"),
          },
          custom_data: {
            value,
            currency,
            content_name,
          },
        },
      ],
    };

    const fbResponse = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${capiToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const fbResult = await fbResponse.json();

    if (!fbResponse.ok) {
      console.error("Facebook CAPI error:", fbResult);
      return new Response(
        JSON.stringify({ error: "Facebook API error", details: fbResult }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, event_id: eventId, fb_response: fbResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("CAPI function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
