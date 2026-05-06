import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, LoginDto, TokenDto, UserRole } from "@/types";
import apiClient from "@/lib/api-client";
import signalRService from "@/lib/signalr-service";
import { toast } from "sonner";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

// Helper to decode JWT
function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

// Helper to map role string/number to UserRole enum
function parseUserRole(roleValue: any): UserRole {
  // JWT might contain role as string ("Admin") or number (1)
  if (typeof roleValue === 'string') {
    const roleLower = roleValue.toLowerCase();
    if (roleLower === 'admin') return UserRole.Admin;
    if (roleLower === 'operator') return UserRole.Operator;
    if (roleLower === 'user') return UserRole.User;
  }
  
  const roleNum = Number(roleValue);
  if (roleNum === 1) return UserRole.Admin;
  if (roleNum === 2) return UserRole.Operator;
  if (roleNum === 3) return UserRole.User;
  
  // Default to Operator if unknown
  return UserRole.Operator;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginDto) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post<TokenDto, LoginDto>("/Auth/login", credentials);
          const token = response.Token;

          if (!token) {
            throw new Error('No token received from server');
          }

          localStorage.setItem("access_token", token);

          // Decode JWT to extract user info
          const decoded = decodeJwt(token);
          
          if (!decoded) {
            throw new Error('Failed to decode authentication token');
          }

          // Extract user data from JWT claims
          // Common JWT claim names (adjust based on your backend)
          const userId = decoded.sub || decoded.nameid || decoded.userId || decoded.UserId;
          const userName = decoded.unique_name || decoded.username || decoded.UserName || credentials.username;
          const email = decoded.email || decoded.Email || credentials.username;
          const fullName = decoded.name || decoded.fullname || decoded.FullName || userName;
          const role = decoded.role || decoded.Role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
          const operatorId = decoded.operatorId || decoded.OperatorId || decoded.operator_id;

          const user: User = {
            id: String(userId || '1'),
            userName: String(userName),
            email: String(email),
            fullName: String(fullName),
            role: parseUserRole(role),
            isActive: true,
            createdAt: new Date().toISOString(),
          };

          // Add operatorId if present
          if (operatorId !== undefined && operatorId !== null) {
            (user as any).operatorId = Number(operatorId);
          }

          set({ user, isAuthenticated: true, isLoading: false });

          // Connect SignalR using a factory so reconnects always read the latest token
          await signalRService.connect(() => localStorage.getItem("access_token") ?? "");

          toast.success("Login successful", {
            description: `Welcome back, ${user.fullName}!`,
          });
        } catch (error: unknown) {
          set({ isLoading: false });
          const errorMessage = error instanceof Error ? error.message : "Login failed";
          toast.error("Login failed", { description: errorMessage });
          throw error;
        }
      },

      logout: () => {
        signalRService.disconnect();
        localStorage.removeItem("access_token");
        set({ user: null, isAuthenticated: false });

        toast.info("Logged out", {
          description: "You have been logged out successfully",
        });
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);