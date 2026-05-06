import { Loader2, WifiOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cameraApi } from '@/lib/api/cameraApi';
import { useWhepStream } from '@/hooks/useWhepStream';

interface Props {
  streamKey: string;
}

export function LiveFeedPlayer({ streamKey }: Props) {
  const cameraId = parseInt(streamKey.replace('cam-', ''), 10);

  const { data: streamStatus } = useQuery({
    queryKey: ['camera', cameraId, 'stream-status'],
    queryFn: () => cameraApi.streamStatus(cameraId),
    enabled: !isNaN(cameraId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const whepUrl = streamStatus?.whepUrl ?? null;
  const { videoRef, status: whepStatus, error: whepError } = useWhepStream(whepUrl, {
    staleMs: 6000,
    pauseWhenHidden: false,
  });

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />

      {whepStatus === 'starting' || whepStatus === 'reconnecting' ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      ) : whepStatus === 'error' || whepError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-slate-400 text-xs gap-2">
          <WifiOff className="w-6 h-6 opacity-60" />
          <span>{whepError ?? 'Stream unavailable'}</span>
        </div>
      ) : null}
    </div>
  );
}
