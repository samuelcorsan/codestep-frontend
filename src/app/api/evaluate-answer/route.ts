import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const apiUrl = process.env.API_URL!;
    const response = await fetch(`${apiUrl}/evaluate-answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: errorData.error || "Failed to evaluate answer",
          message: errorData.message,
        },
        { status: response.status }
      );
    }

    const responseText = await response.text();
    let data;

    try {
      // Try to parse as JSON
      data = JSON.parse(responseText);

      // If the parsed data is a string (double-encoded JSON), parse again
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          // If second parse fails, use the first parsed result
        }
      }
    } catch (parseError) {
      // If parse fails, return error
      console.error("Failed to parse response:", parseError);
      return NextResponse.json(
        { error: "Invalid response format", raw: responseText },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Failed to process request" },
      { status: 500 }
    );
  }
}
