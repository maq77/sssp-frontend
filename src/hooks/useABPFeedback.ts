import { useCallback, useState } from "react";
import { toast } from "sonner";
import abpApi from "@/lib/api/abpApi";

/**
 * Hook for submitting operator feedback on ABP (Abnormal Behavior Prediction)
 * suspicion events. Used to label events as suspicious / normal so the online
 * learner can update its weights.
 */
export function useABPFeedback() {
  const [submitting, setSubmitting] = useState(false);

  const submitFeedback = useCallback(
    async (eventId: string, isSuspicious: boolean): Promise<boolean> => {
      setSubmitting(true);
      try {
        await abpApi.submitFeedback(eventId, isSuspicious);
        toast.success(isSuspicious ? "Marked as suspicious" : "Marked as normal");
        return true;
      } catch {
        toast.error("Failed to submit feedback");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  return { submitFeedback, submitting };
}

export default useABPFeedback;
