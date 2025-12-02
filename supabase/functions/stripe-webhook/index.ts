import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0";

// Load environment variables
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") as string;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") as string;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    // Verify webhook signature manually for Deno compatibility
    let event: Stripe.Event;
    try {
      // Parse the signature header (format: t=timestamp,v1=signature1,v1=signature2)
      const elements = signature.split(",");
      let timestamp = "";
      const signatures: string[] = [];

      for (const element of elements) {
        const [key, value] = element.split("=");
        if (key === "t") {
          timestamp = value;
        } else if (key === "v1") {
          signatures.push(value);
        }
      }

      if (!timestamp || signatures.length === 0) {
        throw new Error("Invalid signature format");
      }

      // Create signed payload: timestamp.body
      const signedPayload = `${timestamp}.${body}`;

      // Create HMAC signature using Deno's crypto API
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(STRIPE_WEBHOOK_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(signedPayload)
      );

      // Convert to hex
      const signatureArray = Array.from(new Uint8Array(signatureBuffer));
      const computedSignature = signatureArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Verify signature matches any of the provided signatures
      const isValid = signatures.some((sig) => {
        // Use constant-time comparison to prevent timing attacks
        if (sig.length !== computedSignature.length) return false;
        let result = 0;
        for (let i = 0; i < sig.length; i++) {
          // Compare hex characters (case-insensitive)
          const sigChar = sig[i].toLowerCase();
          const computedChar = computedSignature[i].toLowerCase();
          result |= sigChar.charCodeAt(0) ^ computedChar.charCodeAt(0);
        }
        return result === 0;
      });

      if (!isValid) {
        throw new Error("Signature verification failed");
      }

      // Optional: Check timestamp is recent (within 5 minutes)
      const currentTime = Math.floor(Date.now() / 1000);
      const signatureTime = parseInt(timestamp, 10);
      if (Math.abs(currentTime - signatureTime) > 300) {
        console.warn("Webhook timestamp is too old or too far in the future");
      }

      // Parse the event
      event = JSON.parse(body) as Stripe.Event;
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err);
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    console.log(`📦 Received webhook event: ${event.type}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;

        console.log(`✅ Checkout completed for customer: ${customerId}`);

        // Find user by Stripe customer ID and upgrade to premium
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profileError || !profile) {
          throw new Error(`Profile not found for customer ${customerId}`);
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ subscription_plan: "premium" })
          .eq("user_id", profile.user_id);

        if (updateError) {
          throw new Error(`Failed to update subscription: ${updateError.message}`);
        }

        console.log(`✅ Upgraded user ${profile.user_id} to premium`);
        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const isActive = subscription.status === "active";

        console.log(
          `🔄 Subscription ${isActive ? "activated" : "deleted"} for customer: ${customerId}`
        );

        // Find user by Stripe customer ID
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profileError || !profile) {
          throw new Error(`Profile not found for customer ${customerId}`);
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            subscription_plan: isActive ? "premium" : "free",
          })
          .eq("user_id", profile.user_id);

        if (updateError) {
          throw new Error(`Failed to update subscription: ${updateError.message}`);
        }

        console.log(
          `✅ Updated user ${profile.user_id} to ${isActive ? "premium" : "free"}`
        );
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in stripe-webhook:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
