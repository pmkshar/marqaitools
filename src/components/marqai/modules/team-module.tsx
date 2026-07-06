"use client";

import { useState } from "react";
import { useMarqai } from "@/lib/marqai/store";
import { canAccess } from "@/lib/marqai/rbac";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users, UserPlus, Trash2, Mail, Crown, Shield, Search } from "lucide-react";
import { toast as sonnerToast } from "sonner";

export function TeamModule() {
  const principal = useMarqai((s) => s.principal);
  const teamMembers = useMarqai((s) => s.teamMembers);
  const teams = useMarqai((s) => s.teams);
  const roles = useMarqai((s) => s.roles);
  const subscription = useMarqai((s) => s.subscription);
  const inviteMember = useMarqai((s) => s.inviteMember);
  const removeMember = useMarqai((s) => s.removeMember);
  const updateMemberRole = useMarqai((s) => s.updateMemberRole);

  const canManage = canAccess(principal, "team", "manage") || principal?.kind === "super_admin";

  const [inviteOpen, setInviteOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    roleId: roles[1]?.id ?? roles[0]?.id ?? "",
    jobTitle: "",
    teamRole: "Member" as "Member" | "Lead" | "Viewer",
  });

  const filtered = teamMembers.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.roleName.toLowerCase().includes(q) ||
      (m.jobTitle ?? "").toLowerCase().includes(q)
    );
  });

  function handleInvite() {
    if (!form.name.trim() || !form.email.trim()) {
      sonnerToast.error("Name and email are required");
      return;
    }
    if (subscription.seatsUsed >= subscription.seatsLimit) {
      sonnerToast.error("Seat limit reached", {
        description: `Your ${subscription.planName} plan supports ${subscription.seatsLimit} seats. Upgrade to add more.`,
      });
      return;
    }
    if (!form.roleId) {
      sonnerToast.error("Please select a role");
      return;
    }
    inviteMember({
      name: form.name.trim(),
      email: form.email.trim(),
      roleId: form.roleId,
      jobTitle: form.jobTitle.trim() || undefined,
      teamRole: form.teamRole,
    });
    sonnerToast.success("Invitation sent", {
      description: `${form.name} will receive an email invitation shortly.`,
    });
    setForm({ name: "", email: "", roleId: roles[1]?.id ?? "", jobTitle: "", teamRole: "Member" });
    setInviteOpen(false);
  }

  function handleRemove(id: string, name: string) {
    removeMember(id);
    sonnerToast.success("Member removed", { description: `${name} no longer has access.` });
  }

  function handleRoleChange(memberId: string, newRoleId: string) {
    updateMemberRole(memberId, newRoleId);
    sonnerToast.success("Role updated");
  }

  // ---------- STAT CARDS ----------
  const seatsPct = (subscription.seatsUsed / subscription.seatsLimit) * 100;

  return (
    <div className="space-y-6">
      {/* ---------- HEADER ---------- */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-5 w-5 text-emerald-600" />
            <h2 className="text-2xl font-bold">Team Management</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Invite team members, assign roles, and track seat usage against your {subscription.planName} plan.
          </p>
        </div>
        {canManage && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-1.5" /> Invite member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Invite a team member</DialogTitle>
                <DialogDescription>
                  They will receive an email invitation to join {principal?.organizationName ?? "your workspace"}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full name</Label>
                    <Input
                      placeholder="Jane Doe"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Work email</Label>
                    <Input
                      type="email"
                      placeholder="jane@company.com"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={form.roleId}
                      onValueChange={(v) => setForm((f) => ({ ...f, roleId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.filter((r) => !r.isLocked).map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Job title</Label>
                    <Input
                      placeholder="e.g. SEO Specialist"
                      value={form.jobTitle}
                      onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Team position</Label>
                  <Select
                    value={form.teamRole}
                    onValueChange={(v) => setForm((f) => ({ ...f, teamRole: v as "Member" | "Lead" | "Viewer" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Member">Member</SelectItem>
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Seat usage after invite</span>
                    <span className="font-semibold text-foreground">
                      {subscription.seatsUsed + 1} / {subscription.seatsLimit}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                <Button onClick={handleInvite}>Send invitation</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* ---------- SEAT USAGE ---------- */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Seat usage</div>
              <div className="text-xs text-muted-foreground">
                {subscription.seatsUsed} of {subscription.seatsLimit} seats used on {subscription.planName}
              </div>
            </div>
            <Badge variant="outline" className={seatsPct > 80 ? "border-amber-400 text-amber-600" : ""}>
              {Math.round(seatsPct)}% used
            </Badge>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full ${seatsPct > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.min(seatsPct, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ---------- TEAMS ---------- */}
      <div>
        <div className="text-sm font-semibold mb-3">Teams</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {teams.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{t.memberCount}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ---------- MEMBERS TABLE ---------- */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base">All members ({teamMembers.length})</CardTitle>
              <CardDescription className="text-xs">Manage roles and access</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Team position</TableHead>
                <TableHead className="hidden lg:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Last login</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => {
                const role = roles.find((r) => r.name === m.roleName);
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="marqai-gradient text-white text-xs">
                            {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate flex items-center gap-1.5">
                            {m.name}
                            {m.teamRole === "Lead" && <Crown className="h-3 w-3 text-amber-500" />}
                          </div>
                          <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {m.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {canManage && !m.teamRole?.includes("Lead") ? (
                        <Select
                          value={role?.id ?? ""}
                          onValueChange={(v) => handleRoleChange(m.id, v)}
                        >
                          <SelectTrigger className="h-8 w-40 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.filter((r) => !r.isLocked).map((r) => (
                              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Shield className="h-3 w-3" /> {m.roleName}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs">{m.teamRole}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge
                        variant="secondary"
                        className={
                          m.status === "active"
                            ? "bg-emerald-100 text-emerald-700 text-[10px]"
                            : m.status === "invited"
                              ? "bg-amber-100 text-amber-700 text-[10px]"
                              : "bg-rose-100 text-rose-700 text-[10px]"
                        }
                      >
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleDateString() : "—"}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemove(m.id, m.name)}
                          aria-label="Remove member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canManage ? 6 : 5} className="text-center text-sm text-muted-foreground py-8">
                    No members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
