import { NextResponse } from "next/server";
import { addReview, listApprovedReviews, getReviewStats } from "@/lib/review-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("templateId");

    if (!templateId?.trim()) {
      return NextResponse.json(
        { error: "templateId query parameter is required." },
        { status: 400 }
      );
    }

    const [reviews, stats] = await Promise.all([
      listApprovedReviews(templateId),
      getReviewStats(templateId),
    ]);

    return NextResponse.json({ reviews, stats });
  } catch (err) {
    console.error("[api/reviews] GET:", err);
    return NextResponse.json({ error: "Failed to load reviews." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { templateId, name, rating, text } = body as {
      templateId?: unknown;
      name?: unknown;
      rating?: unknown;
      text?: unknown;
    };

    if (typeof templateId !== "string" || !templateId.trim()) {
      return NextResponse.json(
        { error: "templateId is required." },
        { status: 400 }
      );
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name is required (min 2 characters)." },
        { status: 400 }
      );
    }

    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        { error: "Rating must be a whole number between 1 and 5." },
        { status: 400 }
      );
    }

    if (typeof text !== "string" || text.trim().length < 10) {
      return NextResponse.json(
        { error: "Review must be at least 10 characters." },
        { status: 400 }
      );
    }

    if (text.trim().length > 1000) {
      return NextResponse.json(
        { error: "Review must be under 1000 characters." },
        { status: 400 }
      );
    }

    await addReview({
      templateId: templateId.trim(),
      name: name.trim(),
      rating,
      text: text.trim(),
    });

    return NextResponse.json(
      { ok: true, message: "Thank you! Your review is pending approval." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api/reviews] POST:", err);
    return NextResponse.json({ error: "Failed to submit review." }, { status: 500 });
  }
}
