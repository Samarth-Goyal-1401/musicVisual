import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { videoId, title, channelTitle, youtubeUrl } = await request.json();
    
    if (!videoId || !youtubeUrl) {
      return NextResponse.json(
        { error: 'Video ID and YouTube URL are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    const prompt = `Based on the following YouTube song information, provide a creative and detailed analysis covering:
- Emotions & vibe
- Character (type, state, journey, backstory) 
- Scene & setting (time, location, weather, era)
- Narrative & themes
- Visual parameters (colors, lighting, speed, movement, textures)
- Timeline with timestamps

Write in clear paragraph format with section headers.

Song Information:
- Title: ${title}
- Channel: ${channelTitle}
- Video ID: ${videoId}
- URL: ${youtubeUrl}

Please create an imaginative analysis based on this song title and artist. Use your knowledge about this song (if available) and create a vivid, detailed description that would be suitable for music visualization or creative interpretation.`;

    const result = await model.generateContent(prompt);
    const analysisText = result.response.text();

    return NextResponse.json({ analysis: analysisText });
    
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze song: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
