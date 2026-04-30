import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.40.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch Pixel ID and CAPI Token from site_settings
    const { data: settings, error: settingsError } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["fb_pixel_id", "fb_capi_token", "fb_test_event_code"]);

    if (settingsError) throw settingsError;

    const pixelId = settings?.find((s) => s.key === "fb_pixel_id")?.value;
    const capiToken = settings?.find((s) => s.key === "fb_capi_token")?.value;
    const testEventCode = settings?.find((s) => s.key === "fb_test_event_code")?.value;

    if (!pixelId || !capiToken) {
      console.error("Missing Meta configuration:", { pixelId: !!pixelId, capiToken: !!capiToken });
      return new Response(
        JSON.stringify({ error: "Meta Pixel or CAPI token not configured in site_settings" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parse Request Body
    const body = await req.json();
    const {
      event_name,
      customer_name,
      phone,
      email,
      value,
      currency = "BDT",
      content_name,
      content_ids,
      source_url,
      fbc,
      fbp,
      user_agent,
    } = body;

    if (!event_name) {
      return new Response(
        JSON.stringify({ error: "event_name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Hash Sensitive Data (SHA-256)
    const encoder = new TextEncoder();
    const hash = async (text: string) => {
      const data = encoder.encode(text.trim().toLowerCase());
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    };

    const userData: any = {
      client_ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      client_user_agent: user_agent || req.headers.get("user-agent"),
      fbc: fbc || undefined,
      fbp: fbp || undefined,
    };

    if (phone) userData.ph = [await hash(phone.replace(/\D/g, ""))];
    if (email) userData.em = [await hash(email)];
    if (customer_name) userData.fn = [await hash(customer_name)];

    // 4. Construct CAPI Payload
    const eventTime = Math.floor(Date.now() / 1000);
    const eventId = `capi_${event_name}_${eventTime}_${crypto.randomUUID().slice(0, 4)}`;

    const payload = {
      data: [
        {
          event_name,
          event_time: eventTime,
          event_id: eventId,
          event_source_url: source_url,
          action_source: "website",
          user_data: userData,
          custom_data: {
            value: value ? Number(value) : undefined,
            currency: value ? currency : undefined,
            content_name,
            content_ids,
          },
        },
      ],
      ...(testEventCode ? { test_event_code: testEventCode } : {}),
    };

    // 5. Send to Facebook
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
      console.error("Meta CAPI Error Response:", fbResult);
      return new Response(
        JSON.stringify({ error: "Meta API error", details: fbResult }),
        { status: fbResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, event_id: eventId, fb_response: fbResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("CAPI Edge Function Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
