import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  Play,
  Square,
  Maximize2,
  Activity,
  Eye,
  Zap,
  MapPin,
  Signal,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CameraDTO, FaceRecognizedPayload } from '@/types';
import apiClient from '@/lib/api-client';
import cameraApi from '@/lib/api/cameraApi';
import signalRService from '@/lib/signalr-service';
import { getDefaultCameraExecutionMode } from '@/lib/camera-execution-mode';
import { toast } from 'sonner';

interface CameraWithDetection extends CameraDTO {
  isMonitoring: boolean;
  fps?: number;
  latency?: number;
  lastDetection?: FaceRecognizedPayload;
  status: 'active' | 'offline' | 'error';
}

interface BoundingBoxProps {
  detection: FaceRecognizedPayload;
  videoWidth: number;
  videoHeight: number;
}

const BoundingBox = ({ detection, videoWidth, videoHeight }: BoundingBoxProps) => {
  const { BBox, DisplayName, Confidence, Similarity, UserId, SourceWidth, SourceHeight } = detection;

  if (!SourceWidth || !SourceHeight) return null;

  const x = (BBox.X / SourceWidth) * videoWidth;
  const y = (BBox.Y / SourceHeight) * videoHeight;
  const width = (BBox.Width / SourceWidth) * videoWidth;
  const height = (BBox.Height / SourceHeight) * videoHeight;

  const isRecognized = !!UserId;
  const color = isRecognized ? 'border-green-400' : 'border-red-400';
  const bgColor = isRecognized ? 'bg-green-400' : 'bg-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`absolute border-2 ${color} pointer-events-none`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {/* Label */}
      <div className={`absolute -top-8 left-0 ${bgColor} text-white px-2 py-1 rounded text-xs font-bold shadow-lg`}>
        <div className="flex items-center gap-1">
          {isRecognized ? <Eye className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
          <span>{DisplayName || 'Unknown'}</span>
        </div>
        <div className="text-[10px] opacity-90">
          {(Confidence * 100).toFixed(1)}% • {(Similarity * 100).toFixed(1)}%
        </div>
      </div>

      {/* Corner indicators */}
      <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${color}`} />
      <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${color}`} />
      <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${color}`} />
      <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${color}`} />
    </motion.div>
  );
};

const CameraCard = ({
  camera,
  onStart,
  onStop,
  onSelect,
}: {
  camera: CameraWithDetection;
  onStart: () => void;
  onStop: () => void;
  onSelect: () => void;
}) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (videoRef.current) {
      const rect = videoRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{camera.name}</h3>
            </div>
            <Badge
              variant="outline"
              className={`gap-2 ${
                camera.status === 'active'
                  ? 'border-green-500 text-green-500'
                  : 'border-red-500 text-red-500'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  camera.status === 'active' ? 'bg-green-500 animate-pulse-glow' : 'bg-red-500'
                }`}
              />
              {camera.isMonitoring ? 'Live' : 'Offline'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pb-4">
          {/* Video Feed Area */}
          <div
            ref={videoRef}
            className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden group"
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />

            {/* Camera placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              {camera.isMonitoring ? (
                <div className="text-center">
                  <Activity className="w-12 h-12 text-primary animate-pulse mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Streaming...</p>
                </div>
              ) : (
                <Camera className="w-12 h-12 text-muted-foreground" />
              )}
            </div>

            {/* Bounding boxes overlay */}
            {camera.lastDetection && camera.isMonitoring && (
              <BoundingBox
                detection={camera.lastDetection}
                videoWidth={dimensions.width}
                videoHeight={dimensions.height}
              />
            )}

            {/* Threat alert banner */}
            {camera.lastDetection && !camera.lastDetection.UserId && camera.isMonitoring && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-2 shadow-lg"
              >
                <Zap className="w-3 h-3 animate-pulse" />
                UNKNOWN PERSON DETECTED
              </motion.div>
            )}

            {/* Fullscreen button */}
            <button
              onClick={onSelect}
              className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Camera Info */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Signal className="w-3 h-3" />
              <span>FPS: {camera.fps || '--'}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Activity className="w-3 h-3" />
              <span>{camera.latency || '--'}ms</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>Zone {camera.id}</span>
            </div>
          </div>

          {/* Last Detection Info */}
          {camera.lastDetection && (
            <div className="p-2 bg-muted/50 rounded text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Detection:</span>
                <span className="font-medium text-foreground">
                  {camera.lastDetection.DisplayName || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confidence:</span>
                <span className={`font-medium ${camera.lastDetection.UserId ? 'text-green-500' : 'text-red-500'}`}>
                  {(camera.lastDetection.Confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2">
            {!camera.isMonitoring ? (
              <Button onClick={onStart} className="flex-1" size="sm">
                <Play className="w-4 h-4 mr-2" />
                Start
              </Button>
            ) : (
              <Button onClick={onStop} variant="destructive" className="flex-1" size="sm">
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export function CameraMonitoringPage() {
  const [cameras, setCameras] = useState<CameraWithDetection[]>([]);
  const [, setSelectedCamera] = useState<CameraWithDetection | null>(null);

  useEffect(() => {
    loadCameras();

    // Subscribe to face recognition events
    const onFace = (envelope: Parameters<typeof signalRService.on<"ReceiveFaceRecognized">>[1] extends (e: infer T) => any ? T : never) => {
      handleFaceDetection(envelope.Data);
    };
    // Subscribe to camera status events
    const onStatus = (envelope: Parameters<typeof signalRService.on<"ReceiveCameraStatus">>[1] extends (e: infer T) => any ? T : never) => {
      const { CameraId, IsOnline, Fps } = envelope.Data;
      updateCameraStatus(CameraId, IsOnline ? 'active' : 'offline', Fps || 0);
    };

    signalRService.on('ReceiveFaceRecognized', onFace);
    signalRService.on('ReceiveCameraStatus', onStatus);

    return () => {
      signalRService.off('ReceiveFaceRecognized', onFace);
      signalRService.off('ReceiveCameraStatus', onStatus);
    };
  }, []);

  const loadCameras = async () => {
    try {
      const data = await apiClient.get<CameraDTO[]>('/Camera');
      setCameras(
        data.map((cam) => ({
          ...cam,
          isMonitoring: false,
          status: 'offline' as const,
          fps: 0,
          latency: 0,
        }))
      );
    } catch (error) {
      console.error('Failed to load cameras:', error);
      toast.error('Failed to load cameras');
      
      // Mock data for demo
      setCameras([
        {
          id: 1,
          name: 'Main Entrance',
          rtspUrl: 'rtsp://demo',
          isActive: true,
          capabilities: 7,
          recognitionMode: 0,
          isMonitoring: false,
          status: 'offline',
        },
        {
          id: 2,
          name: 'Parking Area',
          rtspUrl: 'rtsp://demo',
          isActive: true,
          capabilities: 7,
          recognitionMode: 0,
          isMonitoring: false,
          status: 'offline',
        },
      ] as CameraWithDetection[]);
    }
  };

  const handleFaceDetection = (detection: FaceRecognizedPayload) => {
    setCameras((prev) =>
      prev.map((cam) =>
        cam.id.toString() === detection.CameraId
          ? { ...cam, lastDetection: detection }
          : cam
      )
    );

    if (detection.UserId) {
      toast.success(`Person recognized: ${detection.DisplayName || 'Unknown'}`, {
        description: `Confidence: ${(detection.Confidence * 100).toFixed(1)}% | Camera ${detection.CameraId}`,
      });
    } else {
      toast.warning(`Unknown person detected`, {
        description: `Camera ${detection.CameraId} | Similarity: ${(detection.Similarity * 100).toFixed(1)}%`,
      });
    }
  };

  const updateCameraStatus = (cameraId: string, status: string, fps: number) => {
    setCameras((prev) =>
      prev.map((cam) =>
        cam.id.toString() === cameraId
          ? { ...cam, status: status as 'active' | 'offline' | 'error', fps}
          : cam
      )
    );
  };

  const startMonitoring = async (camera: CameraWithDetection) => {
    try {
      const mode = getDefaultCameraExecutionMode();
      await cameraApi.start(camera.id, camera.rtspUrl, mode);

      await signalRService.subscribeCamera(camera.id.toString());

      setCameras((prev) =>
        prev.map((cam) =>
          cam.id === camera.id ? { ...cam, isMonitoring: true, status: 'active' } : cam
        )
      );

      toast.success(`Monitoring started for ${camera.name}`, {
        description: `Mode: ${mode}`,
      });
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      toast.error('Failed to start monitoring');
    }
  };

  const stopMonitoring = async (camera: CameraWithDetection) => {
    try {
      const mode = getDefaultCameraExecutionMode();
      await cameraApi.stop(camera.id, mode);

      await signalRService.unsubscribeCamera(camera.id.toString());

      setCameras((prev) =>
        prev.map((cam) =>
          cam.id === camera.id
            ? { ...cam, isMonitoring: false, status: 'offline', lastDetection: undefined }
            : cam
        )
      );

      toast.info(`Monitoring stopped for ${camera.name}`, {
        description: `Mode: ${mode}`,
      });
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-foreground mb-2"
          >
            Camera Monitoring
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground"
          >
            Live camera feeds with real-time face recognition and threat detection
          </motion.p>
        </div>

        <div className="flex gap-2">
          <Button onClick={loadCameras} variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Camera Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cameras.map((camera, index) => (
          <motion.div
            key={camera.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <CameraCard
              camera={camera}
              onStart={() => startMonitoring(camera)}
              onStop={() => stopMonitoring(camera)}
              onSelect={() => setSelectedCamera(camera)}
            />
          </motion.div>
        ))}
      </div>

      {cameras.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No cameras configured</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
