import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackName = searchParams.get("track");
  const artistName = searchParams.get("artist");

  if (!trackName || !artistName) {
    return NextResponse.json(
      { error: "Track name and artist name are required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.MUSIXMATCH_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Musixmatch API key is not configured" },
      { status: 500 }
    );
  }

  try {
    // Step 1: Search for the track using track.search (as per official docs)
    const searchUrl = new URL("https://api.musixmatch.com/ws/1.1/track.search");
    searchUrl.searchParams.append("apikey", apiKey);
    searchUrl.searchParams.append("q_track", trackName);
    searchUrl.searchParams.append("q_artist", artistName);
    searchUrl.searchParams.append("page_size", "1");
    searchUrl.searchParams.append("page", "1");
    searchUrl.searchParams.append("s_track_rating", "desc");
    searchUrl.searchParams.append("f_has_lyrics", "1"); // Only get tracks with lyrics

    const searchResponse = await fetch(searchUrl.toString());

    if (!searchResponse.ok) {
      return NextResponse.json(
        { error: `Musixmatch API error: ${searchResponse.status}` },
        { status: searchResponse.status }
      );
    }

    const searchData = await searchResponse.json();

    // Check API response structure (Musixmatch wraps responses in 'message')
    if (searchData.message?.header?.status_code !== 200) {
      const statusCode = searchData.message?.header?.status_code || 500;
      const hint = searchData.message?.header?.hint || "Unknown error";
      return NextResponse.json(
        { error: `Musixmatch API error: ${hint}` },
        { status: statusCode === 200 ? 500 : statusCode }
      );
    }

    // Check if tracks were found
    if (
      !searchData.message?.body?.track_list ||
      searchData.message.body.track_list.length === 0
    ) {
      return NextResponse.json(
        { error: "Track not found in Musixmatch database" },
        { status: 404 }
      );
    }

    const trackId = searchData.message.body.track_list[0].track.track_id;

    // Step 2: Get lyrics using track.lyrics.get (as per official docs)
    const lyricsUrl = new URL("https://api.musixmatch.com/ws/1.1/track.lyrics.get");
    lyricsUrl.searchParams.append("apikey", apiKey);
    lyricsUrl.searchParams.append("track_id", trackId.toString());

    const lyricsResponse = await fetch(lyricsUrl.toString());

    if (!lyricsResponse.ok) {
      return NextResponse.json(
        { error: `Failed to get lyrics: ${lyricsResponse.status}` },
        { status: lyricsResponse.status }
      );
    }

    const lyricsData = await lyricsResponse.json();

    // Check API response status
    if (lyricsData.message?.header?.status_code !== 200) {
      const statusCode = lyricsData.message?.header?.status_code || 500;
      const hint = lyricsData.message?.header?.hint || "Unknown error";
      return NextResponse.json(
        { error: `Musixmatch API error: ${hint}` },
        { status: statusCode === 200 ? 500 : statusCode }
      );
    }

    // Check if lyrics exist
    if (
      !lyricsData.message?.body?.lyrics ||
      !lyricsData.message.body.lyrics.lyrics_body ||
      lyricsData.message.body.lyrics.lyrics_body.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Lyrics not available for this track" },
        { status: 404 }
      );
    }

    const lyrics = lyricsData.message.body.lyrics.lyrics_body;
    const lyricsCopyright = lyricsData.message.body.lyrics.lyrics_copyright || "";
    const trackInfo = searchData.message.body.track_list[0].track;

    return NextResponse.json({
      lyrics,
      copyright: lyricsCopyright,
      trackId,
      trackName: trackInfo.track_name,
      artistName: trackInfo.artist_name,
      albumName: trackInfo.album_name,
    });
  } catch (error) {
    console.error("Musixmatch API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get lyrics" },
      { status: 500 }
    );
  }
}
