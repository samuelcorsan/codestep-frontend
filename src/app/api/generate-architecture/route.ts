import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const apiUrl = process.env.API_URL!;

    console.log("Calling backend:", `${apiUrl}/generate-architecture`);
    console.log("Request body:", JSON.stringify(body, null, 2));

    const response = await fetch(`${apiUrl}/generate-architecture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error response:", errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: "Unknown error", message: errorText };
      }

      return NextResponse.json(
        {
          error: errorData.error || "Failed to generate architecture",
          message: errorData.message || errorText,
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
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack });

    return NextResponse.json(
      {
        error: "Internal server error",
        message: errorMessage,
        details: errorStack,
      },
      { status: 500 }
    );
  }
}
