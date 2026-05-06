// src/features/camera-details/hooks/useCameraActions.ts

import { useState } from "react";
import { toast } from "sonner";
import CameraApi from "@/lib/api/cameraApi";
import { CameraDTO } from "@/types";
import { CameraEditForm } from "@/types";

/**
 * Hook for camera control actions
 * Follows Command Pattern for operations
 */
export function useCameraActions(
  camera: CameraDTO | null,
  onSuccess: () => Promise<void>
) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [form, setForm] = useState<CameraEditForm>({
    name: "",
    rtspUrl: "",
    isActive: true,
    capabilities: 7,
    recognitionMode: 0,
    matchThresholdOverride: null,
    inferenceMode: "full_analytics",
    sourceProfile: "auto",
    expectedWidth: null,
    expectedHeight: null,
    expectedFps: null,
    zoneId: null,
    useFace: true,
    useObject: true,
    useBehavior: true,
  });

  // Initialize form from camera data
  const openEditDialog = () => {
    if (!camera) return;

    setForm({
      name: camera.name,
      rtspUrl: camera.rtspUrl,
      isActive: camera.isActive,
      capabilities: camera.capabilities,
      recognitionMode: camera.recognitionMode,
      matchThresholdOverride: camera.matchThresholdOverride ?? null,
      inferenceMode: camera.inferenceMode ?? "full_analytics",
      sourceProfile: camera.sourceProfile ?? "auto",
      expectedWidth: camera.expectedWidth ?? null,
      expectedHeight: camera.expectedHeight ?? null,
      expectedFps: camera.expectedFps ?? null,
      zoneId: camera.zoneId ?? null,
      useFace: camera.useFace ?? true,
      useObject: camera.useObject ?? true,
      useBehavior: camera.useBehavior ?? true,
    });

    setIsEditOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditOpen(false);
  };

  // Update form field
  const updateForm = (updates: Partial<CameraEditForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  // Save camera changes
  const saveCamera = async () => {
    if (!camera) return;

    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!form.rtspUrl.trim()) {
      toast.error("RTSP URL is required");
      return;
    }

    try {
      await CameraApi.update(camera.id, {
        name: form.name.trim(),
        rtspUrl: form.rtspUrl.trim(),
        isActive: form.isActive,
        capabilities: form.capabilities,
        recognitionMode: form.recognitionMode,
        matchThresholdOverride: form.matchThresholdOverride,
        inferenceMode: form.inferenceMode,
        sourceProfile: form.sourceProfile,
        expectedWidth: form.expectedWidth ?? null,
        expectedHeight: form.expectedHeight ?? null,
        expectedFps: form.expectedFps ?? null,
        zoneId: camera.zoneId ?? form.zoneId ?? null,
        useFace: form.useFace ?? true,
        useObject: form.useObject ?? true,
        useBehavior: form.useBehavior ?? true,
      });

      toast.success("Camera updated successfully");
      setIsEditOpen(false);
      await onSuccess();
    } catch (e: any) {
      toast.error("Failed to save camera", { description: e?.message });
    }
  };

  // Start camera
  const startCamera = async () => {
    if (!camera) return;

    try {
      await CameraApi.start(camera.id);
      toast.success("Camera start requested");
      await onSuccess();
    } catch (e: any) {
      toast.error("Failed to start camera", { description: e?.message });
    }
  };

  // Stop camera
  const stopCamera = async () => {
    if (!camera) return;

    try {
      await CameraApi.stop(camera.id);
      toast.info("Camera stop requested");
      await onSuccess();
    } catch (e: any) {
      toast.error("Failed to stop camera", { description: e?.message });
    }
  };

  // Restart camera
  const restartCamera = async () => {
    if (!camera) return;

    try {
      await CameraApi.restart(camera.id);
      toast.success("Camera restart requested");
      await onSuccess();
    } catch (e: any) {
      toast.error("Failed to restart camera", { description: e?.message });
    }
  };

  return {
    isEditOpen,
    form,
    openEditDialog,
    closeEditDialog,
    updateForm,
    saveCamera,
    startCamera,
    stopCamera,
    restartCamera,
  };
}
