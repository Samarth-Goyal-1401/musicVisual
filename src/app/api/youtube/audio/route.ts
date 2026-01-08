import { NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json(
      { error: "Video ID is required" },
      { status: 400 }
    );
  }

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Validate that the URL is valid
    if (!ytdl.validateURL(videoUrl)) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // Get basic video info
    const info = await ytdl.getInfo(videoUrl);
    
    // Get the highest quality audio format
    const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
    
    if (!audioFormat) {
      return NextResponse.json(
        { error: "No audio format available for this video" },
        { status: 404 }
      );
    }

    // Return the direct audio URL and video info
    // Note: YouTube URLs might have CORS restrictions, so we'll also provide a fallback
    return NextResponse.json({
      audioUrl: audioFormat.url,
      fallbackUrl: `/api/youtube/audio-proxy?videoId=${videoId}`,
      title: info.videoDetails.title,
      duration: parseInt(info.videoDetails.lengthSeconds),
      thumbnail: info.videoDetails.thumbnails[0]?.url,
    });

  } catch (error) {
    console.error("YouTube audio extraction error:", error);
    
    // Handle specific ytdl errors
    if (error instanceof Error) {
      if (error.message.includes("Video unavailable")) {
        return NextResponse.json(
          { error: "This video is unavailable or private" },
          { status: 404 }
        );
      }
      if (error.message.includes("copyright")) {
        return NextResponse.json(
          { error: "This video cannot be accessed due to copyright restrictions" },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Failed to extract audio from YouTube video" },
      { status: 500 }
    );
  }
}
