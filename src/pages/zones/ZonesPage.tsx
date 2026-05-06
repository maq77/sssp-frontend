import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Link2, MapPinned, Plus, ShieldCheck, ShieldQuestion, UserRoundX } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zoneApi } from "@/lib/api/zoneApi";
import { userApi } from "@/lib/api/userApi";
import type { CameraDTO, RoleSummary, User, UserZoneRestriction, Zone, ZonePolicy } from "@/types";
import { AccessType, ZoneType } from "@/types";

const zoneTypeLabel: Record<number, string> = {
  [ZoneType.Public]: "Public",
  [ZoneType.Restricted]: "Restricted",
  [ZoneType.Private]: "Private",
  [ZoneType.Closed]: "Closed",
};

const accessTypeLabel: Record<number, string> = {
  [AccessType.Allow]: "Allow",
  [AccessType.Deny]: "Deny",
};

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

export function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [allCameras, setAllCameras] = useState<CameraDTO[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [zoneCameras, setZoneCameras] = useState<CameraDTO[]>([]);
  const [zonePolicies, setZonePolicies] = useState<ZonePolicy[]>([]);
  const [zoneRestrictions, setZoneRestrictions] = useState<UserZoneRestriction[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [restrictionOpen, setRestrictionOpen] = useState(false);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [policyTarget, setPolicyTarget] = useState<"user" | "role">("user");
  const [assignmentCameraId, setAssignmentCameraId] = useState<string>("");
  const [accessCheckUserId, setAccessCheckUserId] = useState<string>("");
  const [accessDecision, setAccessDecision] = useState<{ isAllowed: boolean; reason: string } | null>(null);

  const [createForm, setCreateForm] = useState({
    zoneCode: "",
    name: "",
    description: "",
    zoneType: String(ZoneType.Restricted),
  });

  const [policyForm, setPolicyForm] = useState({
    targetId: "",
    accessType: String(AccessType.Allow),
    priority: "100",
    description: "",
  });

  const [restrictionForm, setRestrictionForm] = useState({
    userId: "",
    reason: "",
    notes: "",
  });

  const selectedZone = useMemo(
    () => zones.find((zone) => zone.id === selectedZoneId) ?? null,
    [selectedZoneId, zones],
  );

  const availableCameras = useMemo(
    () => allCameras.filter((camera) => camera.zoneId !== selectedZoneId),
    [allCameras, selectedZoneId],
  );

  const activeZones = useMemo(() => zones.filter((zone) => zone.isActive).length, [zones]);

  useEffect(() => {
    void loadBase();
  }, []);

  useEffect(() => {
    if (!selectedZoneId) return;
    void loadZoneDetails(selectedZoneId);
  }, [selectedZoneId]);

  async function loadBase() {
    try {
      const [zonesData, usersData, rolesData, camerasData] = await Promise.all([
        zoneApi.list(false),
        userApi.getAll(),
        zoneApi.listRoles(),
        zoneApi.listAssignableCameras(),
      ]);

      setZones(Array.isArray(zonesData) ? zonesData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setAllCameras(Array.isArray(camerasData) ? camerasData : []);

      if (!selectedZoneId && zonesData.length > 0) {
        setSelectedZoneId(zonesData[0].id);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load zones");
    }
  }

  async function loadZoneDetails(zoneId: number) {
    try {
      const [cameras, policies, restrictions] = await Promise.all([
        zoneApi.listCameras(zoneId),
        zoneApi.listPolicies(zoneId),
        zoneApi.listRestrictions(zoneId),
      ]);

      setZoneCameras(Array.isArray(cameras) ? cameras : []);
      setZonePolicies(Array.isArray(policies) ? policies : []);
      setZoneRestrictions(Array.isArray(restrictions) ? restrictions : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load zone details");
    }
  }

  async function handleCreateZone() {
    try {
      await zoneApi.create({
        zoneCode: createForm.zoneCode.trim(),
        name: createForm.name.trim(),
        description: createForm.description.trim() || null,
        zoneType: Number(createForm.zoneType) as ZoneType,
      });

      toast.success("Zone created");
      setCreateOpen(false);
      setCreateForm({ zoneCode: "", name: "", description: "", zoneType: String(ZoneType.Restricted) });
      await loadBase();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create zone");
    }
  }

  async function handleCreatePolicy() {
    if (!selectedZoneId || !policyForm.targetId) return;

    try {
      if (policyTarget === "user") {
        await zoneApi.addUserPolicy({
          zoneId: selectedZoneId,
          userId: policyForm.targetId,
          accessType: Number(policyForm.accessType) as AccessType,
          priority: Number(policyForm.priority),
          description: policyForm.description || null,
        });
      } else {
        await zoneApi.addRolePolicy({
          zoneId: selectedZoneId,
          roleId: policyForm.targetId,
          accessType: Number(policyForm.accessType) as AccessType,
          priority: Number(policyForm.priority),
          description: policyForm.description || null,
        });
      }

      toast.success("Zone policy added");
      setPolicyOpen(false);
      setPolicyForm({ targetId: "", accessType: String(AccessType.Allow), priority: "100", description: "" });
      await loadZoneDetails(selectedZoneId);
    } catch (error) {
      console.error(error);
      toast.error("Failed to add zone policy");
    }
  }

  async function handleRestrictUser() {
    if (!selectedZoneId || !restrictionForm.userId || !restrictionForm.reason.trim()) return;

    try {
      await zoneApi.restrictUser({
        zoneId: selectedZoneId,
        userId: restrictionForm.userId,
        reason: restrictionForm.reason.trim(),
        notes: restrictionForm.notes.trim() || null,
      });

      toast.success("User restricted from zone");
      setRestrictionOpen(false);
      setRestrictionForm({ userId: "", reason: "", notes: "" });
      await loadZoneDetails(selectedZoneId);
    } catch (error) {
      console.error(error);
      toast.error("Failed to restrict user");
    }
  }

  async function assignCameraToZone() {
    if (!selectedZoneId || !assignmentCameraId) return;

    try {
      await zoneApi.assignCamera(Number(assignmentCameraId), selectedZoneId);
      toast.success("Camera assigned to zone");
      setAssignmentOpen(false);
      setAssignmentCameraId("");
      await loadBase();
      await loadZoneDetails(selectedZoneId);
    } catch (error) {
      console.error(error);
      toast.error("Failed to assign camera");
    }
  }

  async function runAccessCheck() {
    if (!selectedZoneId || !accessCheckUserId) return;

    try {
      const result = await zoneApi.checkAccess(accessCheckUserId, selectedZoneId);
      setAccessDecision(result);
      toast.success(result.isAllowed ? "Access allowed" : "Access denied");
    } catch (error) {
      console.error(error);
      toast.error("Failed to check access");
    }
  }

  async function removePolicy(policyId: number) {
    if (!selectedZoneId) return;

    try {
      await zoneApi.removePolicy(policyId);
      toast.success("Policy removed");
      await loadZoneDetails(selectedZoneId);
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove policy");
    }
  }

  async function removeRestriction(restrictionId: number) {
    if (!selectedZoneId) return;

    try {
      await zoneApi.removeRestriction(restrictionId);
      toast.success("Restriction removed");
      await loadZoneDetails(selectedZoneId);
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove restriction");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Zones & Access Control</h1>
          <p className="text-muted-foreground">
            Manage physical zones, assign cameras, preview access decisions, and apply allow or deny security policies with clear site context.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadBase()}>
            Refresh
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Zone
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Zones</div>
            <div className="mt-2 text-2xl font-semibold">{zones.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Active Zones</div>
            <div className="mt-2 text-2xl font-semibold">{activeZones}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Cameras</div>
            <div className="mt-2 text-2xl font-semibold">{allCameras.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Policies In View</div>
            <div className="mt-2 text-2xl font-semibold">{zonePolicies.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr]">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="font-semibold">Zones</div>
            <MapPinned className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {zones.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => setSelectedZoneId(zone.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  zone.id === selectedZoneId
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{zone.name}</div>
                    <div className="text-sm text-muted-foreground">{zone.zoneCode}</div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Badge variant="outline">{zoneTypeLabel[zone.zoneType] ?? "Zone"}</Badge>
                    {zone.isActive ? <Badge>Active</Badge> : <Badge variant="destructive">Inactive</Badge>}
                  </div>
                </div>
                {zone.description ? (
                  <div className="mt-2 text-sm text-muted-foreground">{zone.description}</div>
                ) : null}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="font-semibold">Zone Overview</div>
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedZone ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xl font-semibold">{selectedZone.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedZone.zoneCode}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setAssignmentOpen(true)}>
                      Assign Camera
                    </Button>
                    <Button variant="outline" onClick={() => setPolicyOpen(true)}>
                      Add Policy
                    </Button>
                    <Button variant="outline" onClick={() => setRestrictionOpen(true)}>
                      Restrict User
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border p-4">
                    <div className="text-sm text-muted-foreground">Type</div>
                    <div className="mt-1 font-medium">{zoneTypeLabel[selectedZone.zoneType]}</div>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <div className="text-sm text-muted-foreground">Assigned Cameras</div>
                    <div className="mt-1 font-medium">{zoneCameras.length}</div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-medium">
                      <Camera className="h-4 w-4" />
                      Cameras
                    </div>
                    {zoneCameras.length > 0 ? (
                      <div className="space-y-2">
                        {zoneCameras.map((camera) => (
                          <div key={camera.id} className="rounded-xl border p-3 text-sm">
                            <div className="font-medium">{camera.name}</div>
                            <div className="text-muted-foreground">{camera.rtspUrl}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                        No cameras are assigned to this zone yet.
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium">Policies</div>
                    {zonePolicies.length > 0 ? (
                      <div className="space-y-2">
                        {zonePolicies.map((policy) => (
                          <div key={policy.id} className="rounded-xl border p-3 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-medium">
                                {policy.user?.fullName || policy.role?.name || "Policy"}
                              </div>
                              <Badge variant="outline">{accessTypeLabel[policy.accessType]}</Badge>
                            </div>
                            <div className="text-muted-foreground">
                              Priority {policy.priority}
                              {policy.description ? ` • ${policy.description}` : ""}
                            </div>
                            <div className="mt-2 flex justify-end">
                              <Button variant="ghost" size="sm" onClick={() => void removePolicy(policy.id)}>
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                        No zone policies yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2 rounded-2xl border p-4">
                    <div className="flex items-center gap-2 font-medium">
                      <ShieldQuestion className="h-4 w-4" />
                      Access Check Preview
                    </div>
                    <Select value={accessCheckUserId} onValueChange={setAccessCheckUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user to simulate zone access" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => void runAccessCheck()} disabled={!accessCheckUserId}>
                      Check Access
                    </Button>
                    {accessDecision ? (
                      <div className={`rounded-xl border p-3 text-sm ${accessDecision.isAllowed ? "border-emerald-500/40 bg-emerald-500/5" : "border-red-500/40 bg-red-500/5"}`}>
                        <div className="font-medium">{accessDecision.isAllowed ? "Allowed" : "Denied"}</div>
                        <div className="text-muted-foreground">{accessDecision.reason}</div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                        Run a preview check to see how the backend evaluates this zone for a person.
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 rounded-2xl border p-4">
                    <div className="flex items-center gap-2 font-medium">
                      <Link2 className="h-4 w-4" />
                      Zone Summary
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground">
                      <div>Policies: {zonePolicies.length}</div>
                      <div>Restrictions: {zoneRestrictions.length}</div>
                      <div>Assigned cameras: {zoneCameras.length}</div>
                      <div>Type: {zoneTypeLabel[selectedZone.zoneType]}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <UserRoundX className="h-4 w-4" />
                    Restrictions
                  </div>
                  {zoneRestrictions.length > 0 ? (
                    <div className="space-y-2">
                      {zoneRestrictions.map((restriction) => (
                        <div key={restriction.id} className="rounded-xl border p-3 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium">{restriction.user?.fullName || restriction.userId}</div>
                            <Badge variant="destructive">Restricted</Badge>
                          </div>
                          <div className="text-muted-foreground">{restriction.reason}</div>
                          <div className="text-xs text-muted-foreground">
                            Since {formatDate(restriction.restrictedAt)}
                          </div>
                          <div className="mt-2 flex justify-end">
                            <Button variant="ghost" size="sm" onClick={() => void removeRestriction(restriction.id)}>
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                      No active restrictions for this zone.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Select a zone to inspect details.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Zone</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              value={createForm.zoneCode}
              onChange={(event) => setCreateForm((current) => ({ ...current, zoneCode: event.target.value }))}
              placeholder="Zone code"
            />
            <Input
              value={createForm.name}
              onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Zone name"
            />
            <Input
              value={createForm.description}
              onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Description"
            />
            <Select value={createForm.zoneType} onValueChange={(value) => setCreateForm((current) => ({ ...current, zoneType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Zone type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={String(ZoneType.Public)}>Public</SelectItem>
                <SelectItem value={String(ZoneType.Restricted)}>Restricted</SelectItem>
                <SelectItem value={String(ZoneType.Private)}>Private</SelectItem>
                <SelectItem value={String(ZoneType.Closed)}>Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreateZone()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignmentOpen} onOpenChange={setAssignmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Camera To Zone</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Select value={assignmentCameraId} onValueChange={setAssignmentCameraId}>
              <SelectTrigger>
                <SelectValue placeholder="Select camera" />
              </SelectTrigger>
              <SelectContent>
                {availableCameras.map((camera) => (
                  <SelectItem key={camera.id} value={String(camera.id)}>
                    {camera.name} {camera.zoneName ? `(${camera.zoneName})` : "(Unassigned)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignmentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void assignCameraToZone()} disabled={!assignmentCameraId}>
              Assign Camera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Zone Policy</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Select value={policyTarget} onValueChange={(value) => setPolicyTarget(value as "user" | "role")}>
              <SelectTrigger>
                <SelectValue placeholder="Policy target" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User Policy</SelectItem>
                <SelectItem value="role">Role Policy</SelectItem>
              </SelectContent>
            </Select>
            <Select value={policyForm.targetId} onValueChange={(value) => setPolicyForm((current) => ({ ...current, targetId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder={policyTarget === "user" ? "Select user" : "Select role"} />
              </SelectTrigger>
              <SelectContent>
                {(policyTarget === "user" ? users : roles).map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {"fullName" in entry ? entry.fullName : entry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={policyForm.accessType} onValueChange={(value) => setPolicyForm((current) => ({ ...current, accessType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Access type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={String(AccessType.Allow)}>Allow</SelectItem>
                <SelectItem value={String(AccessType.Deny)}>Deny</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={policyForm.priority}
              onChange={(event) => setPolicyForm((current) => ({ ...current, priority: event.target.value }))}
              placeholder="Priority"
            />
            <Input
              value={policyForm.description}
              onChange={(event) => setPolicyForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Description"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPolicyOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreatePolicy()}>Save Policy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={restrictionOpen} onOpenChange={setRestrictionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restrict User From Zone</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Select value={restrictionForm.userId} onValueChange={(value) => setRestrictionForm((current) => ({ ...current, userId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={restrictionForm.reason}
              onChange={(event) => setRestrictionForm((current) => ({ ...current, reason: event.target.value }))}
              placeholder="Restriction reason"
            />
            <Input
              value={restrictionForm.notes}
              onChange={(event) => setRestrictionForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Notes"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestrictionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleRestrictUser()}>Restrict User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
