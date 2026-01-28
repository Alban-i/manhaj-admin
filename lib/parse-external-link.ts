import {
  Youtube,
  Twitter,
  Send,
  Facebook,
  Instagram,
  Music2,
  Music,
  Globe,
  type LucideIcon,
} from "lucide-react";

export type ExternalLink = {
  url: string;
  display_name: string;
};

export type Platform = {
  name: string;
  icon: LucideIcon;
};

const PLATFORMS: Record<string, Platform> = {
  "youtube.com": { name: "YouTube", icon: Youtube },
  "youtu.be": { name: "YouTube", icon: Youtube },
  "x.com": { name: "X", icon: Twitter },
  "twitter.com": { name: "X", icon: Twitter },
  "t.me": { name: "Telegram", icon: Send },
  "telegram.me": { name: "Telegram", icon: Send },
  "facebook.com": { name: "Facebook", icon: Facebook },
  "fb.com": { name: "Facebook", icon: Facebook },
  "instagram.com": { name: "Instagram", icon: Instagram },
  "tiktok.com": { name: "TikTok", icon: Music2 },
  "soundcloud.com": { name: "SoundCloud", icon: Music },
};

export function parseExternalLink(url: string): {
  platform: Platform;
  suggestedDisplayName: string;
  url: string;
} {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace("www.", "");

    const platform = PLATFORMS[hostname] || { name: hostname, icon: Globe };

    const pathParts = parsed.pathname.split("/").filter(Boolean);
    let suggestedDisplayName = pathParts[pathParts.length - 1] || hostname;

    // Handle YouTube URLs
    if (hostname.includes("youtube") || hostname === "youtu.be") {
      if (pathParts[0] === "channel" && pathParts[1]) {
        suggestedDisplayName = pathParts[1];
      } else if (pathParts[0]?.startsWith("@")) {
        suggestedDisplayName = pathParts[0];
      } else if (pathParts[0] === "c" && pathParts[1]) {
        suggestedDisplayName = pathParts[1];
      }
    }

    // Handle Twitter/X URLs
    if (hostname.includes("twitter") || hostname.includes("x.com")) {
      if (pathParts[0] && !["i", "intent", "search"].includes(pathParts[0])) {
        suggestedDisplayName = `@${pathParts[0].replace("@", "")}`;
      }
    }

    // Handle Telegram URLs
    if (hostname.includes("t.me") || hostname.includes("telegram")) {
      if (pathParts[0]) {
        suggestedDisplayName = `@${pathParts[0].replace("@", "")}`;
      }
    }

    // Handle Instagram URLs
    if (hostname.includes("instagram")) {
      if (pathParts[0] && !["p", "reel", "stories"].includes(pathParts[0])) {
        suggestedDisplayName = `@${pathParts[0].replace("@", "")}`;
      }
    }

    // Handle Facebook URLs
    if (hostname.includes("facebook") || hostname === "fb.com") {
      if (pathParts[0] && !["watch", "events", "groups"].includes(pathParts[0])) {
        suggestedDisplayName = pathParts[0];
      }
    }

    return { platform, suggestedDisplayName, url };
  } catch {
    return {
      platform: { name: "Lien", icon: Globe },
      suggestedDisplayName: url,
      url,
    };
  }
}

export function getPlatformFromUrl(url: string): Platform {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace("www.", "");
    return PLATFORMS[hostname] || { name: hostname, icon: Globe };
  } catch {
    return { name: "Lien", icon: Globe };
  }
}
