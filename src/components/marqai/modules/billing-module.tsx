"use client";

import { useState } from "react";
import { useMarqai } from "@/lib/marqai/store";
import { canAccess } from "@/lib/marqai/rbac";
import { PLANS, getPlan } from "@/lib/marqai/saas";
import type { PlanSlug } from "@/lib/marqai/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CreditCard, Check, Zap, Download, TrendingUp, Calendar, AlertTriangle, Crown,
} from "lucide-react";
import { toast as sonnerToast } from "sonner";

export function BillingModule() {
  const principal = useMarqai((s) => s.principal);
  const subscription = useMarqai((s) => s.subscription);
  const invoices = useMarqai((s) => s.invoices);
  const upgradePlan = useMarqai((s) => s.upgradePlan);
  const downgradePlan = useMarqai((s) => s.downgradePlan);
  const cancelSubscription = useMarqai((s) => s.cancelSubscription);

  const canManage = canAccess(principal, "billing", "manage") || principal?.kind === "super_admin";
  const [confirmUpgrade, setConfirmUpgrade] = useState<PlanSlug | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDowngrade, setConfirmDowngrade] = useState<PlanSlug | null>(null);

  const currentPlan = getPlan(subscription.planSlug);
  const planRank: PlanSlug[] = ["starter", "growth", "scale", "enterprise"];
  const currentRank = planRank.indexOf(subscription.planSlug);

  const aiPct = (subscription.aiCreditsUsed / subscription.aiCreditsLimit) * 100;
  const seatsPct = (subscription.seatsUsed / subscription.seatsLimit) * 100;

  function handleUpgrade(slug: PlanSlug) {
    upgradePlan(slug);
    sonnerToast.success("Plan upgraded", {
      description: `You are now on the ${getPlan(slug).name} plan.`,
    });
    setConfirmUpgrade(null);
  }

  function handleDowngrade(slug: PlanSlug) {
    downgradePlan(slug);
    sonnerToast.success("Plan changed", {
      description: `Your plan is now ${getPlan(slug).name}. Change takes effect at end of billing cycle.`,
    });
    setConfirmDowngrade(null);
  }

  function handleCancel() {
    cancelSubscription();
    sonnerToast.success("Subscription cancelled", {
      description: "Your workspace will become read-only at the end of the current period.",
    });
    setConfirmCancel(false);
  }

  function formatAmount(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  return (
    <div className="space-y-6">
      {/* ---------- HEADER ---------- */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="h-5 w-5 text-emerald-600" />
          <h2 className="text-2xl font-bold">Subscription & Billing</h2>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Manage your plan, monitor seat and AI credit usage, view invoices, and upgrade or cancel at any time.
        </p>
      </div>

      {/* ---------- CURRENT PLAN + USAGE ---------- */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Current plan card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardDescription>Current plan</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              {currentPlan.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="secondary"
                className={
                  subscription.status === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : subscription.status === "trialing"
                      ? "bg-sky-100 text-sky-700"
                      : "bg-rose-100 text-rose-700"
                }
              >
                {subscription.status}
              </Badge>
              {currentPlan.pricePerMonth > 0 && (
                <span className="text-sm text-muted-foreground">
                  ${currentPlan.pricePerMonth}/mo
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              Current period: {new Date(subscription.currentPeriodStart).toLocaleDateString()} → {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" />
              {currentPlan.aiCredits.toLocaleString()} AI credits / month
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5" />
              {currentPlan.seats} team seats
            </div>
          </CardContent>
          {canManage && (
            <CardFooter className="flex flex-col gap-2">
              {subscription.status !== "cancelled" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => setConfirmCancel(true)}
                >
                  Cancel subscription
                </Button>
              )}
            </CardFooter>
          )}
        </Card>

        {/* Usage card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Usage this period</CardTitle>
            <CardDescription className="text-xs">Resets on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Seats */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Team seats</span>
                <span className="text-muted-foreground">
                  {subscription.seatsUsed} / {subscription.seatsLimit} used
                </span>
              </div>
              <Progress value={seatsPct} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {seatsPct > 80 ? "Approaching seat limit — consider upgrading." : `${subscription.seatsLimit - subscription.seatsUsed} seats remaining.`}
              </div>
            </div>

            {/* AI Credits */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">AI credits</span>
                <span className="text-muted-foreground">
                  {subscription.aiCreditsUsed.toLocaleString()} / {subscription.aiCreditsLimit.toLocaleString()} used
                </span>
              </div>
              <Progress value={aiPct} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {aiPct > 80 ? (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3 w-3" /> Running low on credits — overages will be billed.
                  </span>
                ) : (
                  <>{(subscription.aiCreditsLimit - subscription.aiCreditsUsed).toLocaleString()} credits remaining.</>
                )}
              </div>
            </div>

            {/* Quick credit cost guide */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t">
              {[
                { op: "SEO audit", cost: "5 credits" },
                { op: "Image gen", cost: "8 credits" },
                { op: "Video gen", cost: "25 credits" },
                { op: "Content gen", cost: "2 credits" },
                { op: "Website analysis", cost: "10 credits" },
                { op: "AI tool test", cost: "50 credits" },
              ].map((c) => (
                <div key={c.op} className="rounded-md bg-muted/40 px-2.5 py-1.5 text-xs">
                  <div className="font-medium">{c.op}</div>
                  <div className="text-muted-foreground">{c.cost}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---------- PLAN CATALOG ---------- */}
      <div>
        <div className="text-sm font-semibold mb-3">Available plans</div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.slug === subscription.planSlug;
            const targetRank = planRank.indexOf(plan.slug);
            const isUpgrade = targetRank > currentRank;
            const isDowngrade = targetRank < currentRank;
            return (
              <Card
                key={plan.slug}
                className={isCurrent ? "border-emerald-500 ring-1 ring-emerald-200" : plan.popular ? "border-amber-300" : ""}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-1.5">
                      {plan.name}
                      {plan.popular && (
                        <Badge className="text-[10px] bg-amber-500">Popular</Badge>
                      )}
                    </CardTitle>
                    {isCurrent && (
                      <Badge className="text-[10px] bg-emerald-600">Current</Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs line-clamp-2 min-h-[2.5rem]">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-2">
                    {plan.pricePerMonth === 0 ? (
                      <div className="text-2xl font-bold">Custom</div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">${plan.pricePerMonth}</span>
                        <span className="text-xs text-muted-foreground">/month</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Seats</span>
                    <span className="font-medium">{plan.seats === 999 ? "Unlimited" : plan.seats}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">AI credits</span>
                    <span className="font-medium">{plan.aiCredits.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Trial</span>
                    <span className="font-medium">{plan.trialDays} days</span>
                  </div>
                  <div className="pt-2 border-t mt-2 space-y-1 max-h-32 overflow-y-auto scroll-thin">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <Check className="h-3 w-3 mt-0.5 text-emerald-600 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                {canManage && !isCurrent && (
                  <CardFooter>
                    {isUpgrade ? (
                      <Button
                        className="w-full"
                        size="sm"
                        onClick={() => setConfirmUpgrade(plan.slug)}
                      >
                        <Zap className="h-3.5 w-3.5 mr-1.5" /> Upgrade
                      </Button>
                    ) : isDowngrade ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        size="sm"
                        onClick={() => setConfirmDowngrade(plan.slug)}
                      >
                        Downgrade
                      </Button>
                    ) : null}
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* ---------- INVOICES ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice history</CardTitle>
          <CardDescription className="text-xs">All invoices for this workspace</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                  <TableCell className="text-sm">{inv.description}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {new Date(inv.issuedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{formatAmount(inv.amountCents)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        inv.status === "paid"
                          ? "bg-emerald-100 text-emerald-700 text-[10px]"
                          : inv.status === "void"
                            ? "bg-rose-100 text-rose-700 text-[10px]"
                            : "bg-amber-100 text-amber-700 text-[10px]"
                      }
                    >
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7"
                      onClick={() => sonnerToast.info("Invoice download", { description: "In production this would generate a PDF receipt." })}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                    No invoices yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ---------- CONFIRM DIALOGS ---------- */}
      <Dialog open={!!confirmUpgrade} onOpenChange={(o) => !o && setConfirmUpgrade(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade to {confirmUpgrade && getPlan(confirmUpgrade).name}?</DialogTitle>
            <DialogDescription>
              {confirmUpgrade && (
                <>
                  Your subscription will be upgraded immediately. The prorated difference of{" "}
                  <span className="font-semibold text-foreground">
                    ${getPlan(confirmUpgrade).pricePerMonth - currentPlan.pricePerMonth}
                  </span>{" "}
                  will be charged today.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUpgrade(null)}>Cancel</Button>
            <Button onClick={() => confirmUpgrade && handleUpgrade(confirmUpgrade)}>
              <Zap className="h-4 w-4 mr-1.5" /> Confirm upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDowngrade} onOpenChange={(o) => !o && setConfirmDowngrade(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Downgrade to {confirmDowngrade && getPlan(confirmDowngrade).name}?</DialogTitle>
            <DialogDescription>
              The change takes effect at the end of your current billing cycle ({new Date(subscription.currentPeriodEnd).toLocaleDateString()}). Until then you keep access to {currentPlan.name} features.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDowngrade(null)}>Cancel</Button>
            <Button
              variant="default"
              onClick={() => confirmDowngrade && handleDowngrade(confirmDowngrade)}
            >
              Confirm downgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your workspace will become read-only at the end of the current billing cycle. Your data will be preserved for 90 days. After that it will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep subscription</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancel}
            >
              Yes, cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
