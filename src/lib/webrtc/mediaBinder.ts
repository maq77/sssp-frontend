export class MediaBinder {
  bindVideo(videoEl: HTMLVideoElement, pc: RTCPeerConnection): () => void {
    const ms = new MediaStream();
    videoEl.srcObject = ms;

    const onTrack = (ev: RTCTrackEvent) => {
      // Some servers provide streams[0], but safest: add track
      ms.addTrack(ev.track);
    };

    pc.addEventListener("track", onTrack);

    return () => {
      pc.removeEventListener("track", onTrack);
      try {
        const cur = videoEl.srcObject as MediaStream | null;
        cur?.getTracks().forEach(t => t.stop());
      } catch {}
      videoEl.srcObject = null;
    };
  }

  async ensureAutoplay(videoEl: HTMLVideoElement) {
    // best effort: muted autoplay helps in browsers
    videoEl.muted = true;
    videoEl.playsInline = true;

    try {
      await videoEl.play();
    } catch {
      // ignore: user gesture may be required
    }
  }
}
