import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Clean track/artist names for better API matching
function cleanName(name: string): string {
  return name
    .replace(/\s*\([^)]*\)/g, "") // Remove parentheses content
    .replace(/\s*\[[^\]]*\]/g, "") // Remove brackets content
    .replace(/\s*Official\s*Video/gi, "") // Remove "Official Video"
    .replace(/\s*Official\s*Audio/gi, "") // Remove "Official Audio"
    .replace(/\s*Music\s*Video/gi, "") // Remove "Music Video"
    .replace(/\s*HD/gi, "") // Remove "HD"
    .replace(/\s*MV/gi, "") // Remove "MV"
    .trim();
}

// Extract main track name without featured artists
function getMainTrackName(trackName: string): string {
  // Remove "ft.", "feat.", etc. and everything after
  const mainTrack = trackName
    .replace(/\s*ft\.?\s*.+$/i, "")
    .replace(/\s*feat\.?\s*.+$/i, "")
    .replace(/\s*featuring\s*.+$/i, "")
    .replace(/\s*&.+$/i, "")
    .trim();
  
  return mainTrack || trackName;
}

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

  // Clean the names
  const cleanTrack = cleanName(trackName);
  const cleanArtist = cleanName(artistName);
  const mainTrack = getMainTrackName(cleanTrack);

  // Try multiple variations - prioritize main track name without features
  const variations = [
    { track: mainTrack, artist: cleanArtist }, // Main track without features
    { track: cleanTrack, artist: cleanArtist }, // Cleaned with features
    { track: trackName, artist: artistName }, // Original
    { track: mainTrack, artist: artistName }, // Main track, original artist
  ];

  // Remove duplicates
  const uniqueVariations = variations.filter((v, i, self) => 
    i === self.findIndex(t => t.track === v.track && t.artist === v.artist)
  );

  // Try multiple APIs in order of preference (multilingual support first)
  
  // 1. Try "The Lyrics API" - supports Hindi and English, no rate limit
  for (const variation of uniqueVariations) {
    try {
      const lyricsUrl = `https://the-lyrics-api.herokuapp.com/api/lyrics/${encodeURIComponent(variation.artist)}/${encodeURIComponent(variation.track)}`;
      
      console.log(`Trying The Lyrics API: "${variation.artist}" - "${variation.track}"`);
      
      const response = await fetch(lyricsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.lyrics && data.lyrics.trim() !== "") {
          console.log(`✓ Found lyrics via The Lyrics API: "${variation.artist}" - "${variation.track}"`);
          return NextResponse.json({
            lyrics: data.lyrics,
            copyright: "",
            trackName: variation.track,
            artistName: variation.artist,
          });
        }
      }
    } catch (error) {
      console.error(`Error with The Lyrics API:`, error);
    }
  }

  // 2. Try Lyrics.ovh (English-focused but has some multilingual)
  for (const variation of uniqueVariations) {
    try {
      const lyricsUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(variation.artist)}/${encodeURIComponent(variation.track)}`;
      
      console.log(`Trying Lyrics.ovh: "${variation.artist}" - "${variation.track}"`);
      
      const response = await fetch(lyricsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.lyrics && data.lyrics.trim() !== "" && !data.lyrics.includes("Unfortunately, we don't have the lyrics")) {
          console.log(`✓ Found lyrics via Lyrics.ovh: "${variation.artist}" - "${variation.track}"`);
          return NextResponse.json({
            lyrics: data.lyrics,
            copyright: data.copyright || "",
            trackName: variation.track,
            artistName: variation.artist,
          });
        }
      }
    } catch (error) {
      console.error(`Error with Lyrics.ovh:`, error);
    }
  }

  // 3. Try Le Wagon Lyrics API (educational, multilingual support)
  for (const variation of uniqueVariations) {
    try {
      const lyricsUrl = `https://lyrics.lewagon.ai/search?q=${encodeURIComponent(variation.artist)} ${encodeURIComponent(variation.track)}`;
      
      console.log(`Trying Le Wagon API: "${variation.artist}" - "${variation.track}"`);
      
      const response = await fetch(lyricsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.lyrics && data.lyrics.trim() !== "") {
          console.log(`✓ Found lyrics via Le Wagon: "${variation.artist}" - "${variation.track}"`);
          return NextResponse.json({
            lyrics: data.lyrics,
            copyright: "",
            trackName: variation.track,
            artistName: variation.artist,
          });
        }
      }
    } catch (error) {
      console.error(`Error with Le Wagon API:`, error);
    }
  }

  // 4. Try Lyrist API as final fallback
  try {
    const lyristUrl = `https://lyrist.vercel.app/api/${encodeURIComponent(mainTrack)}?q=${encodeURIComponent(cleanArtist)}`;
    console.log(`Trying Lyrist API fallback: "${cleanArtist}" - "${mainTrack}"`);
    
    const response = await fetch(lyristUrl);

    if (response.ok) {
      const data = await response.json();
      if (data.lyrics && data.lyrics.trim() !== "") {
        console.log(`✓ Found lyrics via Lyrist: "${cleanArtist}" - "${mainTrack}"`);
        return NextResponse.json({
          lyrics: data.lyrics,
          copyright: "",
          trackName: mainTrack,
          artistName: cleanArtist,
        });
      }
    }
  } catch (error) {
    console.error("Lyrist API fallback error:", error);
  }

  // All attempts failed
  console.log(`✗ All attempts failed for: "${artistName}" - "${trackName}"`);
  return NextResponse.json(
    { 
      error: "Lyrics not found for this track. The song might not be in any of the databases, or the track/artist names might not match. Try searching with just the main song name and artist.",
      tried: {
        original: { track: trackName, artist: artistName },
        cleaned: { track: cleanTrack, artist: cleanArtist },
        mainTrack: { track: mainTrack, artist: cleanArtist },
      }
    },
    { status: 404 }
  );
}
