import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Building2,
  Shield,
  Activity,
  UserPlus,
  AlertTriangle,
  BarChart3,
  Plus,
  RefreshCcw,
  Trash2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import apiClient from "@/lib/api-client";
import signalRService from "@/lib/signalr-service";

// ==================== TYPES ====================

type UserRole = 1 | 2 | 3; // Admin, Operator, User
type OperatorType = 1 | 2 | 3 | 4 | 5; // Airport, Hospital, Factory, University, Urban

interface UserDTO {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  role: UserRole;
  operatorId?: number;
  isActive: boolean;
  createdAt: string;
}

interface OperatorDTO {
  id: number;
  name: string;
  type: OperatorType;
  location: string;
  isActive: boolean;
  createdAt: string;
}

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalOperators: number;
  activeOperators: number;
  totalIncidents: number;
  openIncidents: number;
  totalCameras: number;
  activeCameras: number;
}

function normalizeUser(raw: any): UserDTO {
  const id = String(raw?.id ?? raw?.Id ?? "");
  const email = String(raw?.email ?? raw?.Email ?? "");
  const fullName = String(raw?.fullName ?? raw?.FullName ?? "");
  const userName = String(raw?.userName ?? raw?.UserName ?? raw?.UserName ?? "");

  // role often not returned by your /Admin/users response
  // fallback: OperatorId => Operator, else User
  const roleRaw = Number(raw?.role ?? raw?.Role);
  const operatorIdRaw = raw?.operatorId ?? raw?.OperatorId;
  const role: UserRole =
    roleRaw === 1 || roleRaw === 2 || roleRaw === 3
      ? (roleRaw as UserRole)
      : operatorIdRaw != null
      ? 2
      : 3;

  return {
    id: id || email, // ensures stable key even if backend misses Id
    userName: userName || email,
    email,
    fullName,
    role,
    operatorId: operatorIdRaw == null ? undefined : Number(operatorIdRaw),
    isActive: Boolean(raw?.isActive ?? raw?.IsActive ?? true),
    createdAt: String(raw?.createdAt ?? raw?.CreatedAt ?? new Date().toISOString()),
  };
}

function normalizeUsers(list: any): UserDTO[] {
  return Array.isArray(list) ? list.map(normalizeUser) : [];
}

function normalizeOperator(raw: any): OperatorDTO {
  return {
    id: Number(raw?.id ?? raw?.Id ?? 0),
    name: String(raw?.name ?? raw?.Name ?? ""),
    type: Number(raw?.type ?? raw?.Type ?? 1) as OperatorType,
    location: String(raw?.location ?? raw?.Location ?? ""),
    isActive: Boolean(raw?.isActive ?? raw?.IsActive ?? true),
    createdAt: String(raw?.createdAt ?? raw?.CreatedAt ?? new Date().toISOString()),
  };
}

function normalizeOperators(list: any): OperatorDTO[] {
  return Array.isArray(list) ? list.map(normalizeOperator) : [];
}

// ==================== UTILS ====================

const ROLE_LABELS: Record<UserRole, string> = {
  1: "Admin",
  2: "Operator",
  3: "User",
};

const OPERATOR_TYPE_LABELS: Record<OperatorType, string> = {
  1: "Airport",
  2: "Hospital",
  3: "Factory",
  4: "University",
  5: "Urban Area",
};

const ROLE_COLORS: Record<UserRole, string> = {
  1: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  2: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  3: "bg-green-500/20 text-green-400 border-green-500/50",
};

function formatRelativeTime(iso?: string): string {
  if (!iso) return "—";
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return "—";

  const diff = Math.floor((Date.now() - parsed) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}


// ==================== MAIN COMPONENT ====================

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalOperators: 0,
    activeOperators: 0,
    totalIncidents: 0,
    openIncidents: 0,
    totalCameras: 0,
    activeCameras: 0,
  });

  const [users, setUsers] = useState<UserDTO[]>([]);
  const [operators, setOperators] = useState<OperatorDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createOperatorOpen, setCreateOperatorOpen] = useState(false);

  useEffect(() => {
    void loadDashboardData();

    const onIncident = () => {
      // Refresh stats when incidents come in
      void loadStats();
    };

    signalRService.on("ReceiveIncident", onIncident);

    return () => {
      // IMPORTANT: must pass the SAME function reference
      signalRService.off("ReceiveIncident", onIncident);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadUsers(), loadOperators(), loadStats()]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
  try {
    const raw = await apiClient.get<any[]>("/Admin/users");
    setUsers(normalizeUsers(raw));
  } catch (error) {
    console.error("Failed to load users:", error);
    setUsers([]);
    toast.error("Failed to load users");
  }
};

const loadOperators = async () => {
  try {
    const raw = await apiClient.get<any[]>("/Operator");
    setOperators(normalizeOperators(raw));
  } catch (error) {
    console.error("Failed to load operators:", error);
    setOperators([]);
    toast.error("Failed to load operators");
  }
};


  const isOpenStatus = (s: any) => s === 0 || s === 1 || s === 2; // Open/Assigned/InProgress

  const loadStats = async () => {
    try {
        const [uRaw, oRaw, iRaw, cRaw] = await Promise.all([
        apiClient.get<any[]>("/Admin/users").catch(() => []),
        apiClient.get<any[]>("/Operator").catch(() => []),
        apiClient.get<any[]>("/Incident/open").catch(() => []),
        apiClient.get<any[]>("/Camera").catch(() => []),
        ]);

        const usersData = normalizeUsers(uRaw);
        const operatorsData = normalizeOperators(oRaw);

        // incidents here are PascalCase too, but for counts we can safely read both
        const incidents = Array.isArray(iRaw) ? iRaw : [];
        const cameras = Array.isArray(cRaw) ? cRaw : [];

        setStats({
        totalUsers: usersData.length,
        activeUsers: usersData.filter((u) => u.isActive).length,
        totalOperators: operatorsData.length,
        activeOperators: operatorsData.filter((o) => o.isActive).length,
        totalIncidents: incidents.length,
        openIncidents: incidents.filter((i) => isOpenStatus(i?.status ?? i?.Status)).length,
        totalCameras: cameras.length,
        activeCameras: cameras.filter((c) => Boolean(c?.isActive ?? c?.IsActive)).length,
        });
    } catch (error) {
        console.error("Failed to load stats:", error);
        toast.error("Failed to load dashboard stats");
    }
    };


  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.userName?.toLowerCase().includes(q)
    );
  }, [users, searchTerm]);

  // Chart data
  const roleDistribution = useMemo(
    () => [
      { name: "Admins", value: users.filter((u) => u.role === 1).length },
      { name: "Operators", value: users.filter((u) => u.role === 2).length },
      { name: "Users", value: users.filter((u) => u.role === 3).length },
    ],
    [users]
  );

  const operatorTypeDistribution = useMemo(() => {
    return operators.reduce((acc, op) => {
      const typeName = OPERATOR_TYPE_LABELS[op.type];
      const existing = acc.find((x) => x.name === typeName);
      if (existing) existing.value++;
      else acc.push({ name: typeName, value: 1 });
      return acc;
    }, [] as { name: string; value: number }[]);
  }, [operators]);

  const activityData = useMemo(
    () => [
      { name: "Users", total: stats.totalUsers, active: stats.activeUsers },
      {
        name: "Operators",
        total: stats.totalOperators,
        active: stats.activeOperators,
      },
      { name: "Cameras", total: stats.totalCameras, active: stats.activeCameras },
      {
        name: "Incidents",
        total: stats.totalIncidents,
        active: stats.openIncidents,
      },
    ],
    [stats]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-purple-400" />
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              System-wide management and analytics
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDashboardData} disabled={loading}>
            <RefreshCcw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle={`${stats.activeUsers} active`}
          icon={<Users className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Operators"
          value={stats.totalOperators}
          subtitle={`${stats.activeOperators} active`}
          icon={<Building2 className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Incidents"
          value={stats.totalIncidents}
          subtitle={`${stats.openIncidents} open`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="orange"
        />
        <StatCard
          title="Cameras"
          value={stats.totalCameras}
          subtitle={`${stats.activeCameras} active`}
          icon={<Activity className="w-5 h-5" />}
          color="green"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              System Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="total" fill="#8b5cf6" name="Total" />
                <Bar dataKey="active" fill="#22c55e" name="Active" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {roleDistribution.map((_, index) => (
                    <Cell
                      key={`role-cell-${index}`}
                      fill={["#a855f7", "#3b82f6", "#22c55e"][index]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Operator Types
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={operatorTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {operatorTypeDistribution.map((_, index) => (
                    <Cell
                      key={`op-cell-${index}`}
                      fill={["#60a5fa", "#a78bfa", "#34d399", "#fbbf24", "#fb7185"][
                        index % 5
                      ]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management ({filteredUsers.length})
            </CardTitle>
            <Button onClick={() => setCreateUserOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredUsers.slice(0, 10).map((user, idx) => (
              <UserCard
                key={user.id}
                user={user}
                index={idx}
                onUpdate={async () => {
                  await loadUsers();
                  await loadStats();
                }}
              />
            ))}

            {filteredUsers.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p>No users found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Operator Management */}
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Operator Management ({operators.length})
            </CardTitle>
            <Button onClick={() => setCreateOperatorOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Operator
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operators.map((operator, idx) => (
              <OperatorCard key={operator.id} operator={operator} index={idx} />
            ))}

            {operators.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p>No operators found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateUserModal
        open={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
        operators={operators}
        onCreated={async () => {
          await loadUsers();
          await loadStats();
        }}
      />

      <CreateOperatorModal
        open={createOperatorOpen}
        onClose={() => setCreateOperatorOpen(false)}
        onCreated={async () => {
          await loadOperators();
          await loadStats();
        }}
      />
    </motion.div>
  );
}

// ==================== SUB COMPONENTS ====================

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = "blue",
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
  color?: "purple" | "blue" | "orange" | "green";
}) {
  const colorClasses: Record<string, string> = {
    purple: "text-purple-400",
    blue: "text-blue-400",
    orange: "text-orange-400",
    green: "text-green-400",
  };

  return (
    <Card className="glass">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">{title}</div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          </div>
          <div className={colorClasses[color]}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function UserCard({
  user,
  index,
  onUpdate,
}: {
  user: UserDTO;
  index: number;
  onUpdate: () => void | Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete user ${user.fullName}?`)) return;

    setDeleting(true);
    try {
      await apiClient.delete(
        `/Admin/delete-user?userEmail=${encodeURIComponent(user.email)}`
      );
      toast.success("User deleted successfully");
      await onUpdate();
    } catch (error: any) {
      toast.error("Failed to delete user", { description: error?.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.2) }}
      className="rounded-xl border border-border/60 bg-card/40 hover:bg-card/60 transition p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold shrink-0">
            {user.fullName?.charAt(0) || "U"}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-semibold truncate">{user.fullName}</div>
              <Badge className={ROLE_COLORS[user.role]}>{ROLE_LABELS[user.role]}</Badge>
              {!user.isActive && (
                <Badge variant="outline" className="text-red-400 border-red-500/50">
                  Inactive
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground truncate">{user.email}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Created {formatRelativeTime(user.createdAt)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            disabled={deleting}
            onClick={handleDelete}
            title="Delete user"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function OperatorCard({ operator, index }: { operator: OperatorDTO; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
      className="rounded-xl border border-border/60 bg-card/40 hover:bg-card/60 transition p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
          <Building2 className="w-6 h-6 text-white" />
        </div>

        {operator.isActive ? (
          <Badge variant="outline" className="text-green-400 border-green-500/50 bg-green-500/10">
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="text-red-400 border-red-500/50 bg-red-500/10">
            Inactive
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <div className="font-semibold text-lg">{operator.name}</div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{OPERATOR_TYPE_LABELS[operator.type]}</Badge>
          {operator.location && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {operator.location}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          Created {formatRelativeTime(operator.createdAt)}
        </div>
      </div>
    </motion.div>
  );
}

function CreateUserModal({
  open,
  onClose,
  operators,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  operators: OperatorDTO[];
  onCreated: () => void | Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "2" as string, // default Operator
    operatorId: "",
  });

  useEffect(() => {
    if (!open) {
      setFormData({
        fullName: "",
        email: "",
        password: "",
        role: "2",
        operatorId: "",
      });
    }
  }, [open]);

  // If role changes away from Operator, clear operatorId
  useEffect(() => {
    if (formData.role !== "2" && formData.operatorId) {
      setFormData((p) => ({ ...p, operatorId: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.role]);

  const handleSubmit = async () => {
    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: Number(formData.role),
        operatorId: formData.operatorId ? Number(formData.operatorId) : undefined,
      };

      await apiClient.post("/Admin/users", payload);
      toast.success("User created successfully");
      await onCreated();
      onClose();
    } catch (error: any) {
      toast.error("Failed to create user", { description: error?.message });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Password *</Label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <Label>Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(v) => setFormData({ ...formData, role: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Admin</SelectItem>
                <SelectItem value="2">Operator</SelectItem>
                <SelectItem value="3">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Operator (Optional)</Label>
            <Select
              value={formData.operatorId}
              onValueChange={(v) => setFormData({ ...formData, operatorId: v })}
              disabled={formData.role !== "2"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select operator..." />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op.id} value={String(op.id)}>
                    {op.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.role !== "2" && (
              <div className="text-xs text-muted-foreground">
                Operator assignment is only for role = Operator.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Creating..." : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateOperatorModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "1" as string,
    location: "",
  });

  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        type: "1",
        location: "",
      });
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Operator name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        type: Number(formData.type),
        location: formData.location.trim() || "",
        isActive: true,
      };

      await apiClient.post("/Operator", payload);
      toast.success("Operator created successfully");
      await onCreated();
      onClose();
    } catch (error: any) {
      toast.error("Failed to create operator", { description: error?.message });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Operator</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Operator Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., JFK Airport, City Hospital"
            />
          </div>

          <div className="space-y-2">
            <Label>Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(v) => setFormData({ ...formData, type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Airport</SelectItem>
                <SelectItem value="2">Hospital</SelectItem>
                <SelectItem value="3">Factory</SelectItem>
                <SelectItem value="4">University</SelectItem>
                <SelectItem value="5">Urban Area</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Location (Optional)</Label>
            <Input
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="e.g., Abu Dhabi, Cairo, Dubai"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Creating..." : "Create Operator"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
