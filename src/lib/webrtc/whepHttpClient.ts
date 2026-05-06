export type WhepPostResult = {
  location: string;   // absolute session URL
  answerSdp: string;
  responseHeaders: Record<string, string>;
};

export class WhepHttpClient {
  constructor(private readonly requestTimeoutMs = 10_000) {}

  private async timeoutFetch(input: RequestInfo | URL, init: RequestInit) {
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), this.requestTimeoutMs);

    try {
      return await fetch(input, { ...init, signal: ctrl.signal });
    } finally {
      window.clearTimeout(t);
    }
  }

  async postOffer(whepUrl: string, offerSdp: string): Promise<WhepPostResult> {
    console.log("[WHEP] POST offer ->", whepUrl, "len", offerSdp.length);
    const res = await this.timeoutFetch(whepUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/sdp",
        Accept: "application/sdp",
      },
      body: offerSdp,
    });
    const answerSdp = await res.text().catch(() => "");
    const headers = Object.fromEntries(res.headers.entries());

    if (!res.ok) {
      throw new Error(`WHEP POST failed: ${res.status} ${res.statusText} ${answerSdp}`);
    }

    const loc = res.headers.get("location") || res.headers.get("Location");
    if (!loc) throw new Error("WHEP: missing Location header (session URL)");

    const absoluteSessionUrl = new URL(loc, whepUrl).toString();
    return { location: absoluteSessionUrl, answerSdp, responseHeaders: headers };
  }

  async deleteSession(sessionUrl: string): Promise<void> {
    await this.timeoutFetch(sessionUrl, { method: "DELETE" }).catch(() => {});
  }
}
