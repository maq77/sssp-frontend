import apiClient from "@/lib/api-client";

export const faceApi = {
  async enroll(userId: string, image: File, description?: string) {
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("image", image);
    if (description?.trim()) {
      formData.append("description", description.trim());
    }
    return apiClient.postFormData(`/face/enroll`, formData);
  },
};
