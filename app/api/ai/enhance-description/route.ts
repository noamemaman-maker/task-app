import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    // Check for API key first
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please set OPENAI_API_KEY in your environment variables." },
        { status: 500 }
      );
    }

    const { description } = await request.json();

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    // Skip if description is too short
    if (description.trim().length < 10) {
      return NextResponse.json(
        { error: "Description is too short" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that rewrites task descriptions to be clearer and more actionable. Keep the same meaning but make it more professional and concise.",
        },
        {
          role: "user",
          content: `Rewrite this task description to be clearer and more actionable: ${description}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const enhancedText =
      completion.choices[0]?.message?.content?.trim() || description;

    if (!enhancedText) {
      return NextResponse.json(
        { error: "No enhanced text received from OpenAI" },
        { status: 500 }
      );
    }

    return NextResponse.json({ text: enhancedText });
  } catch (error: any) {
    console.error("Error enhancing description:", error);
    
    // Provide more specific error messages
    let errorMessage = "Failed to enhance description";
    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.response?.status === 401) {
      errorMessage = "Invalid OpenAI API key";
    } else if (error?.response?.status === 429) {
      errorMessage = "OpenAI API rate limit exceeded";
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

