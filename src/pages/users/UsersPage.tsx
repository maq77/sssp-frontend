import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Edit3, ImagePlus, ShieldAlert, UserPlus, UserSquare2, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { userApi } from "@/lib/api/userApi";
import { faceApi } from "@/lib/api/faceApi";
import type { CreateUserWithRoleDTO, UpdateUserDTO, User, UserSecurityProfile } from "@/types";
import { UserRole } from "@/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const roleLabels: Record<number, string> = {
  [UserRole.Admin]: "Admin",
  [UserRole.Operator]: "Operator",
  [UserRole.User]: "User",
};

function UserAvatar({ user, size = "md" }: { user: User; size?: "sm" | "md" | "lg" }) {
  const dimensions = size === "lg" ? "h-20 w-20 text-2xl" : size === "sm" ? "h-12 w-12 text-lg" : "h-16 w-16 text-xl";
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-muted ${dimensions}`}>
      <div className="flex h-full w-full items-center justify-center font-semibold text-muted-foreground">
        {user.fullName.slice(0, 1).toUpperCase()}
      </div>
      <img
        src={userApi.getPhotoUrl(user.id)}
        alt={user.fullName}
        className="absolute inset-0 h-full w-full object-cover"
        onError={(event) => {
          (event.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}

function FaceProfilePreview({
  imageUrl,
  alt,
}: {
  imageUrl?: string | null;
  alt: string;
}) {
  return (
    <div className="relative h-10 w-10 overflow-hidden rounded-full border bg-muted">
      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
        {alt.slice(0, 1).toUpperCase()}
      </div>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            (event.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : null}
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [securityProfile, setSecurityProfile] = useState<UserSecurityProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [faceUploading, setFaceUploading] = useState(false);
  const [watchlistReasonDraft, setWatchlistReasonDraft] = useState("");
  const [faceDescription, setFaceDescription] = useState("");
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [createForm, setCreateForm] = useState<CreateUserWithRoleDTO>({
    fullName: "",
    email: "",
    password: "",
    role: UserRole.User,
    operatorId: null,
  });

  const [editForm, setEditForm] = useState<UpdateUserDTO>({});

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users],
  );

  const selectedUserPhotoUrl = selectedUser
    ? `${userApi.getPhotoUrl(selectedUser.id)}?v=${selectedUser.updatedAt ?? selectedUser.createdAt}`
    : null;

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;

    return users.filter((user) =>
      [user.fullName, user.email, user.userName]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [query, users]);

  const watchlistedUsers = useMemo(() => users.filter((user) => user.isWatchlisted).length, [users]);
  const activeUsers = useMemo(() => users.filter((user) => user.isActive).length, [users]);

  useEffect(() => {
    void loadUsers();
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setSecurityProfile(null);
      return;
    }

    void loadSecurityProfile(selectedUserId);
  }, [selectedUserId]);

  useEffect(() => {
    if (!selectedUser) return;
    setEditForm({
      fullName: selectedUser.fullName,
      operatorId: selectedUser.operatorId ?? null,
      isActive: selectedUser.isActive,
      role: selectedUser.role,
      isWatchlisted: selectedUser.isWatchlisted,
      watchlistReason: selectedUser.watchlistReason ?? null,
    });
    setWatchlistReasonDraft(selectedUser.watchlistReason ?? "");
  }, [selectedUser]);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await userApi.getAll();
      setUsers(data);
      if (!selectedUserId && data.length > 0) {
        setSelectedUserId(data[0].id);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function loadSecurityProfile(userId: string) {
    setProfileLoading(true);
    try {
      const data = await userApi.getSecurityProfile(userId);
      setSecurityProfile(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load user security profile");
    } finally {
      setProfileLoading(false);
    }
  }

  async function toggleWatchlist(user: User) {
    const nextState = !user.isWatchlisted;

    try {
      await userApi.updateWatchlist(user.id, {
        isWatchlisted: nextState,
        watchlistReason: nextState
          ? watchlistReasonDraft.trim() || user.watchlistReason || "Added from web security console"
          : null,
      });

      toast.success(nextState ? "User added to watchlist" : "User removed from watchlist");
      await loadUsers();
      if (selectedUserId === user.id) {
        await loadSecurityProfile(user.id);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update watchlist status");
    }
  }

  async function saveUserEdit() {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await userApi.update(selectedUser.id, {
        ...editForm,
        watchlistReason: watchlistReasonDraft.trim() || null,
      });
      toast.success("User updated");
      setEditOpen(false);
      await loadUsers();
      await loadSecurityProfile(selectedUser.id);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
    }
  }

  async function createUser() {
    if (!createForm.fullName.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      toast.error("Full name, email, and password are required");
      return;
    }

    setSaving(true);
    try {
      await userApi.create(createForm);
      toast.success("User created");
      setCreateOpen(false);
      setCreateForm({
        fullName: "",
        email: "",
        password: "",
        role: UserRole.User,
        operatorId: null,
      });
      await loadUsers();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create user");
    } finally {
      setSaving(false);
    }
  }

  async function uploadUserPhoto(file: File) {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await userApi.uploadPhoto(selectedUser.id, file);
      toast.success("User photo uploaded");
      await loadUsers();
      await loadSecurityProfile(selectedUser.id);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload user photo");
    } finally {
      setSaving(false);
    }
  }

  async function enrollFace() {
    if (!selectedUser || !faceImage) {
      toast.error("Choose a face image first");
      return;
    }

    setFaceUploading(true);
    try {
      await faceApi.enroll(selectedUser.id, faceImage, faceDescription);
      toast.success("Face enrolled");
      setFaceImage(null);
      setFaceDescription("");
      await loadSecurityProfile(selectedUser.id);
    } catch (error) {
      console.error(error);
      toast.error("Failed to enroll face");
    } finally {
      setFaceUploading(false);
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
          <h1 className="text-2xl font-bold">Identity & Access</h1>
          <p className="text-muted-foreground">
            Manage people, identity evidence, watchlist status, and zone restrictions from one operational view.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadUsers()} disabled={loading}>
            Refresh
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total People</div>
            <div className="mt-2 text-2xl font-semibold">{users.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Active Accounts</div>
            <div className="mt-2 text-2xl font-semibold">{activeUsers}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Watchlisted</div>
            <div className="mt-2 text-2xl font-semibold">{watchlistedUsers}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Selected Face Profiles</div>
            <div className="mt-2 text-2xl font-semibold">{securityProfile?.faceProfiles.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-2xl">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Users</div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, username, or email"
            />
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUserId(user.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedUserId === user.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <UserAvatar user={user} size="sm" />
                    <div className="space-y-1">
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="text-xs text-muted-foreground">{user.userName}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Badge variant="outline">{roleLabels[user.role ?? UserRole.User] ?? "User"}</Badge>
                    {user.isActive ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                    {user.isWatchlisted ? (
                      <Badge className="bg-amber-500/10 text-amber-700">Watchlist</Badge>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}

            {!loading && filteredUsers.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                No users match the current search.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="font-semibold">Security Profile</div>
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedUser && securityProfile ? (
              <>
                <div className="space-y-2 rounded-2xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-4">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        title="Upload user photo"
                      >
                        <UserAvatar user={selectedUser} size="lg" />
                      </button>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void uploadUserPhoto(file);
                            event.target.value = "";
                          }
                        }}
                      />
                      <div>
                        <div className="font-semibold">{selectedUser.fullName}</div>
                        <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                        <div className="mt-2 flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => photoInputRef.current?.click()}>
                            <ImagePlus className="mr-2 h-4 w-4" />
                            Upload Photo
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            Edit Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant={selectedUser.isWatchlisted ? "destructive" : "outline"}
                      onClick={() => void toggleWatchlist(selectedUser)}
                    >
                      {selectedUser.isWatchlisted ? "Remove Watchlist" : "Add Watchlist"}
                    </Button>
                  </div>

                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <div>Role: {roleLabels[selectedUser.role ?? UserRole.User] ?? "User"}</div>
                    <div>Created: {formatDate(selectedUser.createdAt)}</div>
                    <div>Watchlist reason: {selectedUser.watchlistReason || "None"}</div>
                    <div>Watchlist added: {formatDate(selectedUser.watchlistAddedAt)}</div>
                    <div>Photo: stored at {selectedUserPhotoUrl}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <UserSquare2 className="h-4 w-4" />
                    Face Profiles
                  </div>
                  {securityProfile.faceProfiles.length > 0 ? (
                    <div className="space-y-2">
                      {securityProfile.faceProfiles.map((profile) => (
                        <div key={profile.id} className="rounded-xl border p-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <FaceProfilePreview
                                imageUrl={profile.previewUrl ?? selectedUserPhotoUrl}
                                alt={profile.description || selectedUser.fullName || "Face profile"}
                              />
                              <div>
                                <div className="font-medium">{profile.description || "Face profile"}</div>
                                <div className="text-muted-foreground">{formatDate(profile.createdAt)}</div>
                              </div>
                            </div>
                            {profile.isPrimary ? <Badge>Primary</Badge> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                      No enrolled face profiles yet.
                    </div>
                  )}
                  <div className="rounded-xl border p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Camera className="h-4 w-4" />
                      Enroll Face From Image
                    </div>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => setFaceImage(event.target.files?.[0] ?? null)}
                      />
                      <Input
                        value={faceDescription}
                        onChange={(event) => setFaceDescription(event.target.value)}
                        placeholder="Description, e.g. front-facing profile"
                      />
                      <Button onClick={() => void enrollFace()} disabled={!faceImage || faceUploading}>
                        {faceUploading ? "Enrolling..." : "Enroll Face"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-medium">Zone Restrictions</div>
                  {securityProfile.restrictions.length > 0 ? (
                    <div className="space-y-2">
                      {securityProfile.restrictions.map((restriction) => (
                        <div key={restriction.id} className="rounded-xl border p-3 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium">{restriction.zoneName || `Zone ${restriction.zoneId}`}</div>
                            <Badge variant="destructive">Restricted</Badge>
                          </div>
                          <div className="text-muted-foreground">{restriction.reason}</div>
                          <div className="text-xs text-muted-foreground">
                            Since {formatDate(restriction.restrictedAt)}
                            {restriction.expiresAt ? ` • Expires ${formatDate(restriction.expiresAt)}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                      No active zone restrictions.
                    </div>
                  )}
                </div>
              </>
            ) : profileLoading ? (
              <div className="text-sm text-muted-foreground">Loading security profile...</div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Select a user to inspect watchlist and restriction state.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Security User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input value={createForm.fullName} onChange={(event) => setCreateForm((current) => ({ ...current, fullName: event.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={createForm.email} onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input type="password" value={createForm.password} onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select value={String(createForm.role)} onValueChange={(value) => setCreateForm((current) => ({ ...current, role: Number(value) as UserRole }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(UserRole.Admin)}>Admin</SelectItem>
                  <SelectItem value={String(UserRole.Operator)}>Operator</SelectItem>
                  <SelectItem value={String(UserRole.User)}>User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => void createUser()} disabled={saving}>{saving ? "Creating..." : "Create User"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input
                value={String(editForm.fullName ?? "")}
                onChange={(event) => setEditForm((current) => ({ ...current, fullName: event.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select
                value={String(editForm.role ?? selectedUser?.role ?? UserRole.User)}
                onValueChange={(value) => setEditForm((current) => ({ ...current, role: Number(value) as UserRole }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(UserRole.Admin)}>Admin</SelectItem>
                  <SelectItem value={String(UserRole.Operator)}>Operator</SelectItem>
                  <SelectItem value={String(UserRole.User)}>User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Watchlist / blacklist reason</Label>
              <Input value={watchlistReasonDraft} onChange={(event) => setWatchlistReasonDraft(event.target.value)} placeholder="Wanted person, restricted from zone, VIP monitor, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => void saveUserEdit()} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
