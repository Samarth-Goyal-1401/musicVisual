import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "YouTube API key is not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(
        query
      )}&maxResults=10&key=${apiKey}`
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.error?.message || "YouTube API error" }, { status: response.status });
    }

    const data = await response.json();

    const videos = data.items?.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.default.url,
      description: item.snippet.description,
    })) || [];

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("YouTube API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search YouTube" },
      { status: 500 }
    );
  }
}
