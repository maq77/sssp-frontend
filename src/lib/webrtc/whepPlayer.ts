export type WhepStatus = "idle" | "starting" | "negotiating" | "connecting" | "playing" | "stopping" | "stopped" | "error";

export type WhepPlayerOptions = {
  whepUrl: string;
  videoEl: HTMLVideoElement;
  audio?: boolean;
  rtcConfig?: RTCConfiguration;
  waitForIceGathering?: boolean;
  iceGatheringTimeoutMs?: number;
  requestTimeoutMs?: number;
  onStatus?: (s: WhepStatus) => void;
  onDebug?: (m: string, extra?: unknown) => void;
  onError?: (e: Error) => void;
};

function toAbsoluteUrl(u: string) {
  const absolute = new URL(u, window.location.href).toString();
  console.log('[WhepPlayer] URL Resolution:', { input: u, absolute });
  return absolute;
}

function timeoutFetch(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => {
    console.warn('[WhepPlayer] Fetch timeout triggered:', timeoutMs, 'ms');
    ctrl.abort();
  }, timeoutMs);
  
  return fetch(input, { ...init, signal: ctrl.signal })
    .finally(() => window.clearTimeout(t));
}

async function waitIceComplete(pc: RTCPeerConnection, timeoutMs: number) {
  if (pc.iceGatheringState === "complete") {
    console.log('[WhepPlayer] ICE gathering already complete');
    return;
  }

  console.log('[WhepPlayer] Waiting for ICE gathering...', { timeout: timeoutMs });

  await new Promise<void>((resolve, reject) => {
    const t = window.setTimeout(() => {
      cleanup();
      console.error('[WhepPlayer] ICE gathering timeout');
      reject(new Error("ICE gathering timeout"));
    }, timeoutMs);

    const onState = () => {
      console.log('[WhepPlayer] ICE gathering state changed:', pc.iceGatheringState);
      if (pc.iceGatheringState === "complete") {
        cleanup();
        console.log('[WhepPlayer] ✅ ICE gathering complete');
        resolve();
      }
    };

    function cleanup() {
      window.clearTimeout(t);
      pc.removeEventListener("icegatheringstatechange", onState);
    }

    pc.addEventListener("icegatheringstatechange", onState);
  });
}

export class WhepPlayer {
  private opts: WhepPlayerOptions;
  private pc: RTCPeerConnection | null = null;
  private sessionUrl: string | null = null;
  private stopped = false;
  private startTime: number = 0;

  constructor(opts: WhepPlayerOptions) {
    this.opts = {
      waitForIceGathering: true,
      iceGatheringTimeoutMs: 2500,
      requestTimeoutMs: 10000,
      audio: false,
      ...opts,
    };
    
    console.log('[WhepPlayer] 🎬 Constructor called', {
      whepUrl: opts.whepUrl,
      audio: this.opts.audio,
      waitForIceGathering: this.opts.waitForIceGathering,
    });
    
    this.debug("Constructor initialized", this.opts);
  }

  private status(s: WhepStatus) {
    const elapsed = this.startTime ? Date.now() - this.startTime : 0;
    console.log(`[WhepPlayer] 📊 Status: ${s} (${elapsed}ms elapsed)`);
    this.opts.onStatus?.(s);
  }

  private debug(m: string, extra?: unknown) {
    console.log(`[WhepPlayer] 🔍 ${m}`, extra || '');
    this.opts.onDebug?.(m, extra);
  }

  private fail(e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error('[WhepPlayer] ❌ FAILURE:', err.message, err);
    this.opts.onError?.(err);
    this.status("error");
    throw err;
  }

  async start() {
    this.startTime = Date.now();
    console.log('[WhepPlayer] 🚀 START SEQUENCE INITIATED');
    
    try {
      this.stopped = false;
      this.status("starting");

      const { rtcConfig, audio } = this.opts;
      
      console.log('[WhepPlayer] Creating RTCPeerConnection...', { rtcConfig });
      const pc = new RTCPeerConnection(rtcConfig);
      this.pc = pc;

      console.log('[WhepPlayer] Creating MediaStream...');
      const stream = new MediaStream();
      this.opts.videoEl.srcObject = stream;
      console.log('[WhepPlayer] ✅ Video srcObject set');

      // Track event - critical for receiving video
      pc.addEventListener("track", (ev) => {
        console.log('[WhepPlayer] 🎥 TRACK EVENT:', {
          kind: ev.track.kind,
          id: ev.track.id,
          enabled: ev.track.enabled,
          muted: ev.track.muted,
          readyState: ev.track.readyState,
          streams: ev.streams.length,
        });
        
        stream.addTrack(ev.track);
        this.debug("Track added to stream", { kind: ev.track.kind });
        
        // Monitor track state changes
        ev.track.onmute = () => console.warn('[WhepPlayer] Track muted:', ev.track.kind);
        ev.track.onunmute = () => console.log('[WhepPlayer] Track unmuted:', ev.track.kind);
        ev.track.onended = () => console.warn('[WhepPlayer] Track ended:', ev.track.kind);
      });

      // Connection state monitoring
      pc.addEventListener("iceconnectionstatechange", () => {
        console.log('[WhepPlayer] 🧊 ICE Connection State:', pc.iceConnectionState);
        this.debug("iceConnectionState", pc.iceConnectionState);
        
        if (pc.iceConnectionState === 'failed') {
          console.error('[WhepPlayer] ICE connection failed - may need TURN server');
        }
      });

      pc.addEventListener("connectionstatechange", () => {
        console.log('[WhepPlayer] 🔌 Connection State:', pc.connectionState);
        this.debug("connectionState", pc.connectionState);
        
        if (pc.connectionState === 'connected') {
          console.log('[WhepPlayer] ✅ WebRTC connection established!');
        } else if (pc.connectionState === 'failed') {
          console.error('[WhepPlayer] Connection failed');
        }
      });

      pc.addEventListener("signalingstatechange", () => {
        console.log('[WhepPlayer] 📡 Signaling State:', pc.signalingState);
        this.debug("signalingState", pc.signalingState);
      });

      pc.addEventListener("icegatheringstatechange", () => {
        console.log('[WhepPlayer] 🧊 ICE Gathering State:', pc.iceGatheringState);
        this.debug("iceGatheringState", pc.iceGatheringState);
      });

      // ICE candidate monitoring
      pc.addEventListener("icecandidate", (ev) => {
        if (ev.candidate) {
          console.log('[WhepPlayer] 🧊 ICE Candidate:', {
            type: ev.candidate.type,
            protocol: ev.candidate.protocol,
            address: ev.candidate.address,
          });
        } else {
          console.log('[WhepPlayer] 🧊 ICE gathering completed (null candidate)');
        }
      });

      // Add transceivers
      console.log('[WhepPlayer] Adding transceivers...', { video: true, audio });
      pc.addTransceiver("video", { direction: "recvonly" });
      if (audio) pc.addTransceiver("audio", { direction: "recvonly" });

      this.status("negotiating");

      console.log('[WhepPlayer] Creating offer...');
      const offer = await pc.createOffer();
      console.log('[WhepPlayer] Offer created:', {
        type: offer.type,
        sdpLength: offer.sdp?.length,
      });

      console.log('[WhepPlayer] Setting local description...');
      await pc.setLocalDescription(offer);
      console.log('[WhepPlayer] ✅ Local description set');

      if (this.opts.waitForIceGathering) {
        await waitIceComplete(pc, this.opts.iceGatheringTimeoutMs!);
      }

      const sdp = pc.localDescription?.sdp;
      if (!sdp) throw new Error("No local SDP");

      const whepUrlAbs = toAbsoluteUrl(this.opts.whepUrl);
      console.log('[WhepPlayer] 📤 Posting offer to WHEP endpoint...', { url: whepUrlAbs });

      this.debug("POST offer", { url: whepUrlAbs, sdpLength: sdp.length });

      console.log('[WhepPlayer] 🌐 Sending POST request...');
      const res = await timeoutFetch(
        whepUrlAbs,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/sdp",
            Accept: "application/sdp",
          },
          body: sdp,
        },
        this.opts.requestTimeoutMs!
      );
      console.log('[WhepPlayer] 📥 Received response from WHEP endpoint');

      console.log('[WhepPlayer] 📥 WHEP response:', {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error('[WhepPlayer] WHEP POST failed:', {
          status: res.status,
          statusText: res.statusText,
          body: text,
        });
        throw new Error(`WHEP POST failed: ${res.status} ${res.statusText} ${text}`);
      }

      const location = res.headers.get("location") || res.headers.get("Location");
      if (!location) {
        console.error('[WhepPlayer] Missing Location header in response');
        throw new Error("WHEP: missing Location header (session URL)");
      }

      this.sessionUrl = new URL(location, whepUrlAbs).toString();
      console.log('[WhepPlayer] ✅ Session URL obtained:', this.sessionUrl);
      this.debug("sessionUrl", this.sessionUrl);

      const answerSdp = await res.text();
      console.log('[WhepPlayer] 📥 Answer SDP received:', { length: answerSdp.length });

      console.log('[WhepPlayer] Setting remote description...');
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
      console.log('[WhepPlayer] ✅ Remote description set');

      this.status("connecting");

      // Attempt autoplay
      console.log('[WhepPlayer] Attempting video autoplay...');
      try {
        await this.opts.videoEl.play();
        console.log('[WhepPlayer] ✅ Video playback started');
      } catch (e: any) {
        console.warn('[WhepPlayer] Autoplay failed (expected):', e.message);
      }

      this.status("playing");
      
      const totalTime = Date.now() - this.startTime;
      console.log(`[WhepPlayer] 🎉 START SEQUENCE COMPLETE in ${totalTime}ms`);

    } catch (e) {
      console.error('[WhepPlayer] 💥 START SEQUENCE FAILED:', e);
      this.fail(e);
    }
  }

  async stop() {
    if (this.stopped) {
      console.log('[WhepPlayer] Already stopped, ignoring');
      return;
    }
    
    this.stopped = true;
    console.log('[WhepPlayer] 🛑 STOP SEQUENCE INITIATED');

    this.status("stopping");

    const pc = this.pc;
    const sessionUrl = this.sessionUrl;

    this.sessionUrl = null;
    this.pc = null;

    try {
      if (sessionUrl) {
        console.log('[WhepPlayer] Sending DELETE to session URL:', sessionUrl);
        this.debug("DELETE session", sessionUrl);
        
        await timeoutFetch(
          sessionUrl,
          { method: "DELETE" },
          this.opts.requestTimeoutMs!
        ).catch((e) => {
          console.warn('[WhepPlayer] DELETE request failed:', e);
        });
        
        console.log('[WhepPlayer] ✅ Session deleted');
      }
    } finally {
      try {
        if (pc) {
          console.log('[WhepPlayer] Cleaning up peer connection...');
          
          pc.getSenders().forEach((s) => {
            if (s.track) {
              console.log('[WhepPlayer] Stopping sender track:', s.track.kind);
              s.track.stop();
            }
          });
          
          pc.getReceivers().forEach((r) => {
            if (r.track) {
              console.log('[WhepPlayer] Stopping receiver track:', r.track.kind);
              r.track.stop();
            }
          });
          
          pc.close();
          console.log('[WhepPlayer] ✅ Peer connection closed');
        }
      } catch (e) {
        console.error('[WhepPlayer] Error during cleanup:', e);
      }
      
      this.status("stopped");
      console.log('[WhepPlayer] 🛑 STOP SEQUENCE COMPLETE');
    }
  }
}