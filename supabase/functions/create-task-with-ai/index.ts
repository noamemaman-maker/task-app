// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import OpenAI from "npm:openai";

// Load environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")?.trim();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      throw new Error("Invalid request body. Expected JSON.");
    }

    const { title, description, status, due_date } = body;

    if (!title || typeof title !== "string") {
      throw new Error("Title is required and must be a string");
    }

    // Validate status if provided
    const validStatuses = ["not_started", "in_progress", "completed"];
    const taskStatus = status && validStatuses.includes(status) 
      ? status 
      : "not_started";

    // Validate due_date if provided (should be a valid date string)
    let dueDateValue: string | null = null;
    if (due_date) {
      if (typeof due_date !== "string") {
        throw new Error("due_date must be a string");
      }
      // Validate it's a valid date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(due_date)) {
        throw new Error("due_date must be in YYYY-MM-DD format");
      }
      dueDateValue = due_date;
    }

    console.log("🔄 Creating task with AI suggestions...");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get user session
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("No user found");

    // Create the task
    const taskData: {
      title: string;
      description?: string;
      completed: boolean;
      status: string;
      user_id: string;
      due_date?: string;
    } = {
      title,
      description,
      completed: false,
      status: taskStatus,
      user_id: user.id,
    };

    if (dueDateValue) {
      taskData.due_date = dueDateValue;
    }

    const { data, error } = await supabaseClient
      .from("tasks")
      .insert(taskData)
      .select()
      .single();

    if (error) throw error;

    // Try to get AI label suggestion, but don't fail if it errors
    let label: string | null = null;
    
    if (!OPENAI_API_KEY) {
      console.warn("⚠️ OPENAI_API_KEY not set, skipping AI label suggestion");
      // Return task without AI label
      return new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    try {
      // Log API key prefix for debugging (first 7 chars only for security)
      console.log(`🔑 Using OpenAI API key: ${OPENAI_API_KEY.substring(0, 7)}...`);
      
      const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
      });

      // Get label suggestion from OpenAI
      const prompt = `Based on this task title: "${title}" and description: "${description}", suggest ONE of these labels: work, personal, priority, shopping, home. Reply with just the label word and nothing else.`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 16,
      });

      const suggestedLabel = completion.choices[0].message.content
        ?.toLowerCase()
        .trim();

      console.log(`✨ AI Suggested Label: ${suggestedLabel}`);

      // Validate the label
      const validLabels = ["work", "personal", "priority", "shopping", "home"];
      label = validLabels.includes(suggestedLabel) ? suggestedLabel : null;

      // Update the task with the suggested label if we got one
      if (label) {
        const { data: updatedTask, error: updateError } = await supabaseClient
          .from("tasks")
          .update({ label })
          .eq("task_id", data.task_id)
          .select()
          .single();

        if (updateError) {
          console.warn("⚠️ Failed to update task with label:", updateError.message);
          // Don't throw - return the task without label
        } else {
          return new Response(JSON.stringify(updatedTask), {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      }
    } catch (openaiError: any) {
      // Log the error but don't fail the request - task was already created
      console.error("⚠️ OpenAI API error (task created without AI label):", {
        message: openaiError.message,
        status: openaiError.status,
        type: openaiError.type,
      });
      // Don't throw - return the task without label
    }

    // Return the task (with or without label)
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error in create-task-with-ai:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
