type CreatePeerArgs = {
  rtcConfig?: RTCConfiguration;
  audio?: boolean;
};

export class PeerConnectionFactory {
  create({ rtcConfig, audio }: CreatePeerArgs) {
    const pc = new RTCPeerConnection(rtcConfig);

    // WHEP is typically recvonly
    pc.addTransceiver("video", { direction: "recvonly" });
    if (audio) pc.addTransceiver("audio", { direction: "recvonly" });

    return pc;
  }
}
