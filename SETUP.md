# Music Visualizer Setup Guide

## Required API Keys

To run this application, you need to set up the following API keys in your `.env.local` file:

### 1. YouTube Data API v3 (Required)

**Purpose:** Search for music videos and embed them for playback

**How to get it:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or select existing)
3. Enable "YouTube Data API v3"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

**Free Tier:** 10,000 units/day

**Add to `.env.local`:**
```
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### 2. Musixmatch API (Required)

**Purpose:** Fetch song lyrics

**How to get it:**
1. Go to [Musixmatch Developer Portal](https://developer.musixmatch.com/)
2. Sign up for a free account
3. Go to "My Apps" → "Register a new application"
4. Copy your API key

**Free Tier:** 2,000 requests/day

**Add to `.env.local`:**
```
MUSIXMATCH_API_KEY=your_musixmatch_api_key_here
```

### 3. Spotify API (Optional)

**Purpose:** Better metadata and search results

**How to get it:**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create an app
3. Copy Client ID and Client Secret

**Add to `.env.local`:**
```
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
```

## Setup Steps

1. **Create `.env.local` file** in the root directory:
   ```bash
   cp .env.local.example .env.local
   ```

2. **Add your API keys** to `.env.local`:
   ```
   YOUTUBE_API_KEY=your_key_here
   MUSIXMATCH_API_KEY=your_key_here
   ```

3. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000) in your browser

## Features

- ✅ Search for music videos on YouTube
- ✅ Play music with hidden video (audio-only experience)
- ✅ Display synchronized lyrics
- ✅ Audio visualizer with frequency bars
- ✅ Modern, responsive UI

## Troubleshooting

### YouTube API Errors
- Make sure YouTube Data API v3 is enabled in Google Cloud Console
- Check your API key is correct
- Verify you haven't exceeded the daily quota

### Musixmatch API Errors
- Ensure your API key is valid
- Check you haven't exceeded the 2,000 requests/day limit
- Some songs may not have lyrics available

### Audio Not Playing
- Check browser console for errors
- Ensure YouTube video is not blocked in your region
- Try a different song

## Notes

- The app uses YouTube embeds with hidden video for audio playback
- Lyrics are fetched from Musixmatch API
- The visualizer works best with the YouTube IFrame API (can be enhanced)
