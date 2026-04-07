"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

export function useHls(
  videoRef: RefObject<HTMLVideoElement | null>,
  src: string | null
) {
  const hlsRef = useRef<import("hls.js").default | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let destroyed = false;

    if (src.endsWith(".m3u8") || src.startsWith("/api/stream/")) {
      // Dynamically import hls.js to avoid SSR "self is not defined"
      import("hls.js").then(({ default: Hls }) => {
        if (destroyed) return;

        if (Hls.isSupported()) {
          const hls = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            xhrSetup: (xhr, url) => {
              // Only add auth header for API requests (playlist fetches).
              // Presigned R2 segment URLs must NOT receive extra headers.
              if (url.startsWith("/api/") || url.startsWith(window.location.origin + "/api/")) {
                const token = localStorage.getItem("token");
                if (token) {
                  xhr.setRequestHeader("Authorization", `Bearer ${token}`);
                }
              }
            },
          });

          hlsRef.current = hls;
          hls.loadSource(src);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
          });

          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal) return;

            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          });
        } else if (
          video.canPlayType("application/vnd.apple.mpegurl")
        ) {
          // Safari native HLS support
          video.src = src;
          video.play().catch(() => {});
        }
      });
    } else {
      // MP4 or other direct source
      video.src = src;
      video.play().catch(() => {});
    }

    return () => {
      destroyed = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoRef, src]);

  return hlsRef;
}
