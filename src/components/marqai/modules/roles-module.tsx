"use client";

import { useState } from "react";
import { useMarqai } from "@/lib/marqai/store";
import { canAccess, summarizeRole, countAccessibleModules } from "@/lib/marqai/rbac";
import { MODULE_CATALOG } from "@/lib/marqai/saas";
import type { ModuleId, PermissionLevel, Role } from "@/lib/marqai/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shield, Plus, Lock, Pencil, Trash2, Users, Sparkles, Crown } from "lucide-react";
import { toast as sonnerToast } from "sonner";

const COLOR_OPTIONS: { value: string; bg: string; ring: string }[] = [
  { value: "emerald", bg: "bg-emerald-500", ring: "ring-emerald-200" },
  { value: "teal",    bg: "bg-teal-500",    ring: "ring-teal-200" },
  { value: "amber",   bg: "bg-amber-500",   ring: "ring-amber-200" },
  { value: "rose",    bg: "bg-rose-500",    ring: "ring-rose-200" },
  { value: "violet",  bg: "bg-violet-500",  ring: "ring-violet-200" },
  { value: "cyan",    bg: "bg-cyan-500",    ring: "ring-cyan-200" },
  { value: "slate",   bg: "bg-slate-500",   ring: "ring-slate-200" },
];

const PERM_LEVELS: { value: PermissionLevel; label: string; color: string }[] = [
  { value: "none",    label: "None",    color: "text-muted-foreground" },
  { value: "view",    label: "View",    color: "text-sky-600" },
  { value: "execute", label: "Execute", color: "text-amber-600" },
  { value: "manage",  label: "Manage",  color: "text-emerald-600" },
];

export function RolesModule() {
  const principal = useMarqai((s) => s.principal);
  const roles = useMarqai((s) => s.roles);
  const teamMembers = useMarqai((s) => s.teamMembers);
  const createRole = useMarqai((s) => s.createRole);
  const updateRole = useMarqai((s) => s.updateRole);
  const deleteRole = useMarqai((s) => s.deleteRole);
  const setRolePermission = useMarqai((s) => s.setRolePermission);

  const canManage = canAccess(principal, "roles", "manage") || principal?.kind === "super_admin";

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formColor, setFormColor] = useState("emerald");
  const [formPerms, setFormPerms] = useState<Record<ModuleId, PermissionLevel>>(
    () => MODULE_CATALOG.reduce((acc, m) => ({ ...acc, [m.id]: "none" }), {} as Record<ModuleId, PermissionLevel>),
  );

  function resetForm() {
    setFormName("");
    setFormDesc("");
    setFormColor("emerald");
    setFormPerms(MODULE_CATALOG.reduce((acc, m) => ({ ...acc, [m.id]: "none" }), {} as Record<ModuleId, PermissionLevel>));
  }

  function handleCreate() {
    if (!formName.trim()) {
      sonnerToast.error("Role name is required");
      return;
    }
    if (roles.some((r) => r.name.toLowerCase() === formName.trim().toLowerCase())) {
      sonnerToast.error("A role with this name already exists");
      return;
    }
    createRole({
      name: formName.trim(),
      description: formDesc.trim() || undefined,
      color: formColor,
      permissions: formPerms,
    });
    sonnerToast.success("Role created", { description: `"${formName}" is ready to assign to team members.` });
    resetForm();
    setCreateOpen(false);
  }

  function handleDelete(role: Role) {
    deleteRole(role.id);
    sonnerToast.success("Role deleted", { description: `"${role.name}" has been removed.` });
    setDeleteTarget(null);
  }

  function getColorClass(color: string) {
    return COLOR_OPTIONS.find((c) => c.value === color) ?? COLOR_OPTIONS[0];
  }

  // ---------- STAT CARDS ----------
  const totalRoles = roles.length;
  const customRoles = roles.filter((r) => !r.isSystem).length;
  const systemRoles = totalRoles - customRoles;
  const totalUsers = teamMembers.length;

  return (
    <div className="space-y-6">
      {/* ---------- HEADER ---------- */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-emerald-600" />
            <h2 className="text-2xl font-bold">Role Master</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Create unlimited custom roles with per-module permissions. Built-in roles are seeded for every Organization; the Org Owner role is locked and cannot be deleted.
          </p>
        </div>
        {canManage && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1.5" /> New role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create new role</DialogTitle>
                <DialogDescription>
                  Configure which modules this role can access and at what permission level.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role name</Label>
                    <Input
                      placeholder="e.g. Paid Ads Manager"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color tag</Label>
                    <div className="flex gap-2 flex-wrap">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setFormColor(c.value)}
                          className={`h-8 w-8 rounded-full ${c.bg} ${formColor === c.value ? `ring-2 ring-offset-2 ${c.ring}` : ""}`}
                          aria-label={c.value}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="What does this role do? What team should use it?"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Module permissions</Label>
                  <div className="rounded-lg border overflow-hidden">
                    <div className="grid grid-cols-[1fr_auto] bg-muted/50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <div>Module</div>
                      <div className="w-32 text-right">Permission</div>
                    </div>
                    <div className="max-h-72 overflow-y-auto scroll-thin divide-y">
                      {MODULE_CATALOG.map((m) => (
                        <div key={m.id} className="grid grid-cols-[1fr_auto] px-3 py-2 items-center hover:bg-muted/30">
                          <div className="min-w-0 pr-3">
                            <div className="text-sm font-medium truncate">{m.label}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{m.description}</div>
                          </div>
                          <Select
                            value={formPerms[m.id]}
                            onValueChange={(v) => setFormPerms((p) => ({ ...p, [m.id]: v as PermissionLevel }))}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PERM_LEVELS.map((p) => (
                                <SelectItem key={p.value} value={p.value} className={p.color}>
                                  {p.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Create role</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* ---------- STAT CARDS ---------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total roles" value={totalRoles} icon={<Shield className="h-4 w-4" />} />
        <StatCard label="Custom roles" value={customRoles} icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="Built-in roles" value={systemRoles} icon={<Lock className="h-4 w-4" />} />
        <StatCard label="Team members" value={totalUsers} icon={<Users className="h-4 w-4" />} />
      </div>

      {/* ---------- ROLE LIST ---------- */}
      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => {
          const color = getColorClass(role.color);
          const userCount = teamMembers.filter((m) => m.roleName === role.name).length;
          return (
            <Card key={role.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`h-10 w-10 rounded-lg ${color.bg} flex items-center justify-center text-white shrink-0`}>
                      {role.isLocked ? <Crown className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {role.name}
                        {role.isSystem && (
                          <Badge variant="secondary" className="text-[10px]">Built-in</Badge>
                        )}
                        {role.isLocked && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Lock className="h-3 w-3" /> Locked
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1 line-clamp-2">
                        {role.description ?? "No description."}
                      </CardDescription>
                    </div>
                  </div>
                  {canManage && !role.isLocked && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditTarget(role)}
                        aria-label="Edit role"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(role)}
                        aria-label="Delete role"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(role.permissions)
                    .filter(([_, v]) => v && v !== "none")
                    .map(([modId, level]) => {
                      const meta = MODULE_CATALOG.find((m) => m.id === modId);
                      return (
                        <Badge key={modId} variant="outline" className="text-[10px] gap-1">
                          <span className="font-semibold">{meta?.label ?? modId}</span>
                          <span className="text-muted-foreground">· {level}</span>
                        </Badge>
                      );
                    })}
                  {countAccessibleModules(role) === 0 && (
                    <span className="text-xs text-muted-foreground">No module access</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>{summarizeRole(role)}</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {userCount} {userCount === 1 ? "user" : "users"}
                  </span>
                </div>

                {canManage && !role.isLocked && editTarget?.id === role.id && (
                  <EditPermissionInline
                    role={role}
                    onClose={() => setEditTarget(null)}
                    onUpdate={(modId, level) => setRolePermission(role.id, modId, level)}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ---------- DELETE CONFIRM ---------- */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Team members assigned to this role will lose their permissions and need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Delete role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
            <div className="text-2xl font-bold mt-1">{value}</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EditPermissionInline({
  role,
  onClose,
  onUpdate,
}: {
  role: Role;
  onClose: () => void;
  onUpdate: (moduleId: ModuleId, level: PermissionLevel) => void;
}) {
  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      <div className="text-xs font-semibold">Quick edit permissions</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto scroll-thin">
        {MODULE_CATALOG.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1.5">
            <span className="text-xs truncate">{m.label}</span>
            <Select
              value={role.permissions[m.id as ModuleId] ?? "none"}
              onValueChange={(v) => onUpdate(m.id, v as PermissionLevel)}
            >
              <SelectTrigger className="h-7 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERM_LEVELS.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-xs">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <Button size="sm" variant="outline" onClick={onClose} className="w-full">
        Done
      </Button>
    </div>
  );
}
