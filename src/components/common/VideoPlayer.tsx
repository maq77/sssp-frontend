import React, { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Volume2, Maximize } from "lucide-react";
import { VideoContent } from "../../types/video.types";

export const VideoPlayer: React.FC<VideoContent> = ({
  title,
  description,
  videoPlaceholder,
  embedUrl,
  mp4Url,
  posterUrl,
  previewSeconds = 5,
  previewStartSeconds = 0,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [mode, setMode] = useState<"preview" | "full">("preview");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  const hasMp4 = Boolean(mp4Url);
  const hasEmbed = Boolean(embedUrl);

  const previewEnd = useMemo(
    () =>
      Math.max(
        previewStartSeconds + previewSeconds,
        previewStartSeconds + 0.1
      ),
    [previewStartSeconds, previewSeconds]
  );

  const safePlay = async (v: HTMLVideoElement) => {
    try {
      await v.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  // Setup mp4 preview/full behavior
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !mp4Url) return;

    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);

    v.addEventListener("pause", onPause);
    v.addEventListener("play", onPlay);

    if (mode === "preview") {
      v.controls = false;
      v.muted = true;
      v.loop = false; // manual loop for first N seconds

      const onLoaded = () => {
        try {
          v.currentTime = previewStartSeconds;
        } catch {}
        safePlay(v);
      };

      const onTimeUpdate = () => {
        if (v.currentTime >= previewEnd) {
          v.currentTime = previewStartSeconds;
          if (v.paused) safePlay(v);
        }
      };

      v.addEventListener("loadedmetadata", onLoaded);
      v.addEventListener("timeupdate", onTimeUpdate);

      return () => {
        v.removeEventListener("loadedmetadata", onLoaded);
        v.removeEventListener("timeupdate", onTimeUpdate);
        v.removeEventListener("pause", onPause);
        v.removeEventListener("play", onPlay);
      };
    } else {
      // FULL mode
      v.controls = true;
      v.loop = false;
      v.muted = false;

      try {
        v.currentTime = 0;
      } catch {}

      safePlay(v);

      return () => {
        v.removeEventListener("pause", onPause);
        v.removeEventListener("play", onPlay);
      };
    }
  }, [mode, mp4Url, previewStartSeconds, previewEnd]);

  const handleClick = () => {
    // MP4: toggle preview/full
    if (mp4Url) {
      setMode((m) => (m === "preview" ? "full" : "preview"));
      return;
    }

    // Embed: only show on click
    if (embedUrl) setShowEmbed(true);
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
  };

  const handleFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    try {
      await v.requestFullscreen?.();
    } catch {}
  };

  return (
    <div className="bg-slate-900/50 rounded-2xl overflow-hidden border border-slate-700">
      <div
        className="aspect-video bg-slate-800 relative group cursor-pointer"
        onClick={handleClick}
      >
        {/* EMBED (click to show) */}
        {showEmbed && hasEmbed && !hasMp4 ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={embedUrl}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : hasMp4 ? (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            src={mp4Url}
            poster={posterUrl}
            muted
            playsInline
            preload="metadata"
            autoPlay
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-sm text-slate-400 px-6 text-center">
              {videoPlaceholder ?? "[Video Demo - Coming Soon]"}
            </div>
          </div>
        )}

        {/* Overlay (show only when preview, not when full is playing) */}
        {(hasMp4 || hasEmbed) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center px-6">
              <div
                className={`w-20 h-20 rounded-full bg-sky-500/20 backdrop-blur flex items-center justify-center mb-4 mx-auto transition-all ${
                  mode === "preview" ? "group-hover:bg-sky-500/30" : ""
                } ${mode === "full" && isPlaying ? "opacity-0" : ""}`}
              >
                {mode === "full" && isPlaying ? (
                  <Pause className="w-10 h-10 text-sky-400" />
                ) : (
                  <Play className="w-10 h-10 text-sky-400 ml-1" />
                )}
              </div>

              {hasMp4 ? (
                <div className="text-sm text-slate-400">
                  {mode === "preview"
                    ? `Preview (first ${previewSeconds}s) — click for full`
                    : "Full video — click to return to preview"}
                </div>
              ) : (
                <div className="text-sm text-slate-400">{videoPlaceholder}</div>
              )}
            </div>
          </div>
        )}

        {/* Controls (mp4 only) */}
        {hasMp4 && (
          <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              className="p-2 bg-slate-900/80 rounded-lg hover:bg-slate-800"
              onClick={handleMuteToggle}
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 bg-slate-900/80 rounded-lg hover:bg-slate-800"
              onClick={handleFullscreen}
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
    </div>
  );
};
