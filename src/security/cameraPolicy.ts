import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types";

export function useCameraPolicy() {
  const role = useAuthStore((s) => s.user?.role);

  const canView = !!role;
  const canControl = role === UserRole.Admin || role === UserRole.Operator;
  const canCrud = role === UserRole.Admin || role === UserRole.Operator;

  return { canView, canControl, canCrud, role };
}
