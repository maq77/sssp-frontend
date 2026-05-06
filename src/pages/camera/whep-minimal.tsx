import { useEffect, useRef, useState } from "react";
import { WhepPlayer } from "@/lib/webrtc/whepPlayer";

export default function WhepTestMinimal() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<WhepPlayer | null>(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const whepUrl = "http://localhost:8889/cam-8/whep";

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${msg}`, ...prev].slice(0, 50));
    console.log(`[WhepTest] ${msg}`);
  };

  const startStream = async () => {
    if (!videoRef.current) {
      addLog("❌ No video element");
      return;
    }

    addLog("🚀 Starting stream...");
    setStatus("starting");
    setError(null);

    const player = new WhepPlayer({
      whepUrl,
      videoEl: videoRef.current,
      audio: false,
      onStatus: (s) => {
        addLog(`📡 Status: ${s}`);
        setStatus(s);
      },
      onDebug: (msg, extra) => {
        addLog(`🔍 ${msg}${extra ? ": " + JSON.stringify(extra) : ""}`);
      },
      onError: (err) => {
        addLog(`❌ Error: ${err.message}`);
        setError(err.message);
      },
    });

    playerRef.current = player;

    try {
      await player.start();
      addLog("✅ Player started");
    } catch (e: any) {
      addLog(`❌ Start failed: ${e.message}`);
      setError(e.message);
    }
  };

  const stopStream = async () => {
    if (!playerRef.current) return;
    addLog("🛑 Stopping stream...");
    await playerRef.current.stop();
    playerRef.current = null;
    addLog("✅ Stopped");
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTimeUpdate = () => {
      if (v.currentTime > 0) {
        addLog(`⏱️ Video playing: ${v.currentTime.toFixed(2)}s`);
      }
    };

    const onLoadedData = () => {
      addLog(`📹 Video data loaded (readyState: ${v.readyState})`);
    };

    const onPlaying = () => {
      addLog("▶️ Video playing event");
    };

    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("loadeddata", onLoadedData);
    v.addEventListener("playing", onPlaying);

    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("loadeddata", onLoadedData);
      v.removeEventListener("playing", onPlaying);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Minimal WHEP Test</h1>
          <p className="text-gray-400">Bare-bones WHEP player test</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Panel */}
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <div className="font-semibold">Stream URL</div>
                  <div className="text-sm text-gray-400 font-mono break-all">{whepUrl}</div>
                </div>
              </div>

              <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  playsInline
                  muted
                  autoPlay
                />
                <div className="absolute top-2 left-2 px-3 py-1 bg-black/60 rounded text-sm">
                  Status: <span className="font-mono">{status}</span>
                </div>
                {error && (
                  <div className="absolute bottom-2 left-2 right-2 px-3 py-2 bg-red-500/80 rounded text-sm">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={startStream}
                  disabled={status === "playing" || status === "starting"}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  Start
                </button>
                <button
                  onClick={stopStream}
                  disabled={status === "idle" || status === "stopped"}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  Stop
                </button>
              </div>
            </div>

            {/* Video Element Stats */}
            {videoRef.current && (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="font-semibold mb-3">Video Element Stats</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ready State:</span>
                    <span className="font-mono">{videoRef.current.readyState}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Time:</span>
                    <span className="font-mono">{videoRef.current.currentTime.toFixed(2)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Paused:</span>
                    <span className="font-mono">{String(videoRef.current.paused)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Muted:</span>
                    <span className="font-mono">{String(videoRef.current.muted)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Src Object:</span>
                    <span className="font-mono">{videoRef.current.srcObject ? "set" : "null"}</span>
                  </div>
                  {videoRef.current.srcObject && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tracks:</span>
                      <span className="font-mono">
                        {(videoRef.current.srcObject as MediaStream).getTracks().length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Logs Panel */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Event Logs</div>
              <button
                onClick={() => setLogs([])}
                className="text-sm text-gray-400 hover:text-white"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1 max-h-[600px] overflow-auto">
              {logs.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-8">No logs yet</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="text-xs font-mono bg-gray-900 rounded px-3 py-2">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}