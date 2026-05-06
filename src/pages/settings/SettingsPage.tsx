import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Database, Radar, RefreshCw, Save, ServerCog, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { systemControlApi } from "@/lib/api/systemControlApi";
import { platformDataApi } from "@/lib/api/platformDataApi";
import apiClient from "@/lib/api-client";
import type {
  AiControlDocument,
  AiControlField,
  AiControlSnapshot,
  PlatformDataSummary,
} from "@/types";

type CapabilityState = "active" | "experimental" | "placeholder" | "disabled";

type Capability = {
  key: string;
  name: string;
  state: CapabilityState;
  owner: string;
  description: string;
};

type SettingsSection = "all" | "platform" | "deepstream" | "legacy-ai";

const stateStyles: Record<CapabilityState, string> = {
  active: "bg-emerald-500/10 text-emerald-700",
  experimental: "bg-amber-500/10 text-amber-700",
  placeholder: "bg-slate-500/10 text-slate-700",
  disabled: "bg-rose-500/10 text-rose-700",
};

function documentKey(scopeId: string, kind: string) {
  return `${scopeId}:${kind}`;
}

function normalizeFieldValue(field: AiControlField) {
  if (field.type === "boolean") return Boolean(field.value);
  if (field.type === "number") return Number(field.value ?? 0);
  return String(field.value ?? "");
}

function buildDrafts(snapshot: AiControlSnapshot | null) {
  const drafts: Record<string, Record<string, unknown>> = {};
  snapshot?.scopes.forEach((scope) => {
    scope.documents.forEach((document) => {
      const key = documentKey(scope.id, document.kind);
      drafts[key] = {};
      document.groups.forEach((group) => {
        group.fields.forEach((field) => {
          drafts[key][field.key] = normalizeFieldValue(field);
        });
      });
    });
  });
  return drafts;
}

function formatDocumentTone(document: AiControlDocument) {
  return document.requiresRestart ? "Applies on next restart" : "Applies live";
}

function formatFrontendCopy(value: string) {
  if (value.toLowerCase() === "deepstream") return "Horus Plus";

  return value
    .replace(/\bLegacy MTCNN\b/g, "Legacy Horus")
    .replace(/\bLegacy AI\b/g, "Legacy Horus")
    .replace(/\blegacy AI\b/g, "Legacy Horus")
    .replace(/\bDeepStream\b/g, "Horus Plus");
}

export function SettingsPage() {
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [deepStreamHealth, setDeepStreamHealth] = useState<any | null>(null);
  const [platformSummary, setPlatformSummary] = useState<PlatformDataSummary | null>(null);
  const [controlSnapshot, setControlSnapshot] = useState<AiControlSnapshot | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, unknown>>>({});
  const [loading, setLoading] = useState(false);
  const [initializingData, setInitializingData] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSection>("all");

  const summaryCards = useMemo(
    () => [
      { label: "Users", value: platformSummary?.users ?? 0 },
      { label: "Zones", value: platformSummary?.zones ?? 0 },
      { label: "Cameras", value: platformSummary?.cameras ?? 0 },
      { label: "Incidents", value: platformSummary?.incidents ?? 0 },
      { label: "Face Profiles", value: platformSummary?.faceProfiles ?? 0 },
      { label: "Restrictions", value: platformSummary?.restrictions ?? 0 },
    ],
    [platformSummary],
  );

  const visibleScopes = useMemo(() => {
    if (!controlSnapshot) return [];
    if (activeSection === "all" || activeSection === "platform") {
      return controlSnapshot.scopes;
    }
    return controlSnapshot.scopes.filter((scope) => scope.id === activeSection);
  }, [activeSection, controlSnapshot]);

  useEffect(() => {
    void loadPage();
  }, []);

  async function loadPage() {
    setLoading(true);
    try {
      const [capabilityData, health, summary, snapshot] = await Promise.all([
        apiClient.get<Capability[]>("/deepstream/capabilities"),
        apiClient.get<any>("/deepstream/health", undefined, { cacheTTL: 3000 }),
        platformDataApi.getSummary(),
        systemControlApi.getAiSnapshot(),
      ]);

      setCapabilities(Array.isArray(capabilityData) ? capabilityData : []);
      setDeepStreamHealth(health);
      setPlatformSummary(summary);
      setControlSnapshot(snapshot);
      setDrafts(buildDrafts(snapshot));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load platform settings");
    } finally {
      setLoading(false);
    }
  }

  function updateDraft(scopeId: string, kind: "live" | "startup", field: AiControlField, rawValue: string | boolean) {
    const key = documentKey(scopeId, kind);
    setDrafts((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? {}),
        [field.key]:
          field.type === "boolean"
            ? Boolean(rawValue)
            : field.type === "number"
              ? Number(rawValue)
              : String(rawValue),
      },
    }));
  }

  async function saveDocument(scopeId: string, document: AiControlDocument) {
    const key = documentKey(scopeId, document.kind);
    setSavingKey(key);
    try {
      await systemControlApi.updateAiDocument(scopeId, document.kind, drafts[key] ?? {});
      toast.success(document.requiresRestart ? "Saved. Restart the service to apply these settings." : "Live controls saved");
      await loadPage();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save control settings");
    } finally {
      setSavingKey(null);
    }
  }

  async function initializeReferenceData() {
    setInitializingData(true);
    try {
      const result = await platformDataApi.initializeReferenceData();
      toast.success(result.message || "Platform reference data initialized");
      await loadPage();
    } catch (error) {
      console.error(error);
      toast.error("Failed to initialize platform reference data");
    } finally {
      setInitializingData(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Control Center</h1>
          <p className="max-w-3xl text-muted-foreground">
            Operate Horus Plus, Legacy Horus, and platform runtime behavior from one place. Live controls apply immediately where supported, and startup controls are saved for the next service restart.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadPage()} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => void initializeReferenceData()} disabled={initializingData}>
            <Database className="mr-2 h-4 w-4" />
            {initializingData ? "Syncing..." : "Sync Reference Data"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All controls" },
          { key: "platform", label: "Platform" },
          { key: "deepstream", label: "Horus Plus" },
          { key: "legacy-ai", label: "Legacy Horus" },
        ].map((section) => (
          <Button
            key={section.key}
            variant={activeSection === section.key ? "default" : "outline"}
            onClick={() => setActiveSection(section.key as SettingsSection)}
            className="rounded-full"
          >
            {section.label}
          </Button>
        ))}
      </div>

      {(activeSection === "all" || activeSection === "platform") && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {summaryCards.map((card) => (
              <Card key={card.label} className="rounded-2xl">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">{card.label}</div>
                  <div className="mt-2 text-2xl font-semibold">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="font-semibold">Runtime Health</div>
                <Radar className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-2xl border p-4">
                  <div className="text-muted-foreground">API Status</div>
                  <div className="mt-1 font-medium">{deepStreamHealth?.ApiStatus ?? "Unknown"}</div>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-muted-foreground">Horus Plus Connected</div>
                  <div className="mt-1 font-medium">{String(deepStreamHealth?.DeepStreamConnected ?? false)}</div>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-muted-foreground">Registered Cameras</div>
                  <div className="mt-1 font-medium">{deepStreamHealth?.Cameras?.Registered ?? 0}</div>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-muted-foreground">Running Cameras</div>
                  <div className="mt-1 font-medium">{deepStreamHealth?.Cameras?.Running ?? 0}</div>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-muted-foreground">Ingest Total</div>
                  <div className="mt-1 font-medium">{deepStreamHealth?.Ingest?.TotalReceived ?? 0}</div>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-muted-foreground">MediaMTX Reachable</div>
                  <div className="mt-1 font-medium">{String(deepStreamHealth?.MediaMtx?.Reachable ?? false)}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="font-semibold">Capability Registry</div>
                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {capabilities.map((capability) => (
                  <div key={capability.key} className="rounded-2xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{formatFrontendCopy(capability.name)}</div>
                      <Badge className={stateStyles[capability.state]}>{capability.state}</Badge>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">{formatFrontendCopy(capability.description)}</div>
                    <div className="mt-2 text-xs text-muted-foreground">Owner: {formatFrontendCopy(capability.owner)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <div className="space-y-6">
        {visibleScopes.map((scope) => (
          <section key={scope.id} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border bg-background p-3">
                {scope.id === "deepstream" ? <ServerCog className="h-5 w-5" /> : <Cpu className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="text-2xl font-semibold">{formatFrontendCopy(scope.name)}</h2>
                <p className="text-sm text-muted-foreground">{formatFrontendCopy(scope.description)}</p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {scope.documents.map((document) => {
                const draftKey = documentKey(scope.id, document.kind);
                const saving = savingKey === draftKey;

                return (
                  <Card key={draftKey} className="rounded-2xl">
                    <CardHeader className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{formatFrontendCopy(document.title)}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{formatFrontendCopy(document.description)}</div>
                        </div>
                        <Badge variant={document.requiresRestart ? "outline" : "default"}>
                          {formatDocumentTone(document)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {document.groups.map((group) => (
                        <div key={group.key} className="space-y-3 rounded-2xl border p-4">
                          <div>
                            <div className="font-medium">{formatFrontendCopy(group.title)}</div>
                            <div className="text-sm text-muted-foreground">{formatFrontendCopy(group.description)}</div>
                          </div>

                          <div className="space-y-3">
                            {group.fields.map((field) => {
                              const currentValue = drafts[draftKey]?.[field.key] ?? normalizeFieldValue(field);

                              return (
                                <div key={field.key} className="rounded-xl border bg-background p-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="max-w-[70%]">
                                      <div className="font-medium">{formatFrontendCopy(field.label)}</div>
                                      {field.description ? (
                                        <div className="mt-1 text-xs text-muted-foreground">{formatFrontendCopy(field.description)}</div>
                                      ) : null}
                                    </div>

                                    {field.type === "boolean" ? (
                                      <label className="inline-flex items-center gap-2 text-sm">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(currentValue)}
                                          onChange={(event) => updateDraft(scope.id, document.kind, field, event.target.checked)}
                                        />
                                        <span>{Boolean(currentValue) ? "On" : "Off"}</span>
                                      </label>
                                    ) : field.type === "select" ? (
                                      <select
                                        className="min-w-[12rem] rounded-lg border bg-background px-3 py-2 text-sm"
                                        value={String(currentValue ?? "")}
                                        onChange={(event) => updateDraft(scope.id, document.kind, field, event.target.value)}
                                      >
                                        {(field.options ?? []).map((option) => (
                                          <option key={option.value} value={option.value}>
                                            {formatFrontendCopy(option.label)}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <div className="min-w-[12rem]">
                                        <Input
                                          type="number"
                                          value={String(currentValue ?? 0)}
                                          min={field.min ?? undefined}
                                          max={field.max ?? undefined}
                                          step={field.step ?? undefined}
                                          onChange={(event) => updateDraft(scope.id, document.kind, field, event.target.value)}
                                        />
                                        {field.unit ? (
                                          <div className="mt-1 text-right text-xs text-muted-foreground">{field.unit}</div>
                                        ) : null}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                        <div>
                          {document.requiresRestart
                            ? "These values are saved as startup overrides. Restart the related service to apply them."
                            : "These values are saved to the live runtime-control document and should be picked up by the running service."}
                        </div>
                        <Button onClick={() => void saveDocument(scope.id, document)} disabled={saving}>
                          <Save className="mr-2 h-4 w-4" />
                          {saving ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </motion.div>
  );
}
