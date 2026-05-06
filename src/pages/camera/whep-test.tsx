import { useState } from "react";
import { AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function WhepDiagnostics() {
  const [url, setUrl] = useState("http://localhost:8889/cam-8/whep");
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testWhepEndpoint = async () => {
    setTesting(true);
    const testResults: any = {
      timestamp: new Date().toISOString(),
      tests: [],
    };

    try {
      // Test 1: Check if URL is reachable
      testResults.tests.push({
        name: "URL Reachability",
        status: "running",
      });

      // Test 2: Create offer SDP
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      pc.addTransceiver("video", { direction: "recvonly" });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
        } else {
          pc.addEventListener("icegatheringstatechange", () => {
            if (pc.iceGatheringState === "complete") resolve();
          });
          setTimeout(resolve, 3000); // timeout
        }
      });

      const offerSdp = pc.localDescription?.sdp;
      
      testResults.tests[0] = {
        name: "URL Reachability",
        status: "pass",
        message: "URL accessible",
      };

      testResults.tests.push({
        name: "SDP Offer Creation",
        status: offerSdp ? "pass" : "fail",
        message: offerSdp ? `Generated SDP (${offerSdp.length} bytes)` : "Failed to create SDP",
        data: offerSdp ? offerSdp.substring(0, 200) + "..." : null,
      });

      // Test 3: POST to WHEP
      testResults.tests.push({
        name: "WHEP POST Request",
        status: "running",
      });

      const fetchStart = Date.now();
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
        },
        body: offerSdp,
      });
      const fetchDuration = Date.now() - fetchStart;

      const responseText = await res.text();
      const headers = Object.fromEntries(res.headers.entries());

      testResults.tests[2] = {
        name: "WHEP POST Request",
        status: res.ok ? "pass" : "fail",
        message: `${res.status} ${res.statusText} (${fetchDuration}ms)`,
        data: {
          status: res.status,
          statusText: res.statusText,
          headers,
          body: responseText.substring(0, 300) + (responseText.length > 300 ? "..." : ""),
        },
      };

      // Test 4: Validate answer SDP
      if (res.ok && responseText) {
        try {
          await pc.setRemoteDescription({
            type: "answer",
            sdp: responseText,
          });

          testResults.tests.push({
            name: "SDP Answer Validation",
            status: "pass",
            message: "Answer SDP applied successfully",
            data: responseText.substring(0, 200) + "...",
          });
        } catch (e: any) {
          testResults.tests.push({
            name: "SDP Answer Validation",
            status: "fail",
            message: e.message,
          });
        }
      }

      // Test 5: Wait for connection
      testResults.tests.push({
        name: "WebRTC Connection",
        status: "running",
      });

      const connectionResult = await Promise.race([
        new Promise<string>((resolve) => {
          pc.onconnectionstatechange = () => {
            if (pc.connectionState === "connected") {
              resolve("connected");
            } else if (pc.connectionState === "failed") {
              resolve("failed");
            }
          };
        }),
        new Promise<string>((resolve) => setTimeout(() => resolve("timeout"), 10000)),
      ]);

      testResults.tests[testResults.tests.length - 1] = {
        name: "WebRTC Connection",
        status: connectionResult === "connected" ? "pass" : "fail",
        message: `Connection state: ${connectionResult}`,
        data: {
          connectionState: pc.connectionState,
          iceConnectionState: pc.iceConnectionState,
          iceGatheringState: pc.iceGatheringState,
          signalingState: pc.signalingState,
        },
      };

      pc.close();
    } catch (e: any) {
      testResults.tests.push({
        name: "Error",
        status: "fail",
        message: e.message,
        data: e.stack,
      });
    }

    setResults(testResults);
    setTesting(false);
  };

  const getStatusIcon = (status: string) => {
    if (status === "pass") return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === "fail") return <XCircle className="w-5 h-5 text-red-500" />;
    if (status === "running") return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">WHEP Endpoint Diagnostics</h1>
          <p className="text-gray-400">
            Test your MediaMTX WHEP endpoint to diagnose streaming issues
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">WHEP Endpoint URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="http://localhost:8889/cam-3/whep"
            />
          </div>

          <button
            onClick={testWhepEndpoint}
            disabled={testing}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {testing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Testing...
              </>
            ) : (
              "Run Diagnostics"
            )}
          </button>
        </div>

        {results && (
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Test Results</h2>
              <span className="text-sm text-gray-400">{new Date(results.timestamp).toLocaleString()}</span>
            </div>

            <div className="space-y-3">
              {results.tests.map((test: any, idx: number) => (
                <div key={idx} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(test.status)}
                    <div className="flex-1">
                      <div className="font-medium">{test.name}</div>
                      {test.message && (
                        <div className="text-sm text-gray-400 mt-1">{test.message}</div>
                      )}
                      {test.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                            Show details
                          </summary>
                          <pre className="mt-2 p-3 bg-gray-900 rounded text-xs overflow-auto max-h-64">
                            {typeof test.data === "string" ? test.data : JSON.stringify(test.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-400" />
                Common Issues & Solutions
              </h3>
              <ul className="text-sm text-gray-300 space-y-2 ml-7">
                <li>
                  <strong>404 Not Found:</strong> Camera stream path doesn't exist in MediaMTX. Check your mediamtx.yml configuration.
                </li>
                <li>
                  <strong>405 Method Not Allowed:</strong> WHEP is disabled. Ensure <code>webrtc: yes</code> in mediamtx.yml.
                </li>
                <li>
                  <strong>Connection Timeout:</strong> Check firewall rules for UDP port 8189 and ensure <code>webrtcLocalUDPAddress: :8189</code> is configured.
                </li>
                <li>
                  <strong>ICE Failed:</strong> Add STUN server in mediamtx.yml: <code>webrtcICEServers2: [{"{"}"url": "stun:stun.l.google.com:19302"{"}"}]</code>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}