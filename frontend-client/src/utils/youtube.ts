const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export const getYouTubeVideoId = (url?: string): string | null => {
  if (!url) return null;

  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase();

    if (host === "youtu.be" || host === "www.youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id && VIDEO_ID_PATTERN.test(id) ? id : null;
    }

    if (!YOUTUBE_HOSTS.has(host)) return null;

    const id =
      parsed.pathname === "/watch"
        ? parsed.searchParams.get("v")
        : parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1];

    return id && VIDEO_ID_PATTERN.test(id) ? id : null;
  } catch {
    return null;
  }
};

export const getYouTubeEmbedUrl = (videoId: string): string =>
  `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;

export const getYouTubeWatchUrl = (videoId: string): string =>
  `https://www.youtube.com/watch?v=${videoId}`;
