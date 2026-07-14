import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAllVentureOffices } from "@/hooks/useAllVentureOffices";
import { AppRole } from "@/hooks/useUserAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Users, Plus, Trash2 } from "lucide-react";
import { OfficeTag } from "@/components/OfficeTag";
import { PREVIEW } from "@/preview/previewMode";

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  user: "Base user",
  vo_leader: "VO Leader",
  technical: "Technical",
};

const OFFICE_BOUND_ROLES: AppRole[] = ["user", "vo_leader"];

interface UserRow {
  id: string;
  user_id: string;
  email: string | null;
  role: AppRole;
  venture_office_assignment: string | null;
}

interface PendingRow {
  email: string;
  role: AppRole;
  venture_office: string | null;
}

/**
 * Admin-only panel: assign roles and venture offices to existing users, and
 * pre-provision users by email so they land in the right role on first
 * sign-in (handled by the handle_new_user_role trigger). Writes are protected
 * by the user_roles_admin_manage / provisioning_admin RLS policies.
 */
export function UserManagementCard() {
  const { user: currentUser } = useAuth();
  const { ventureOffices } = useAllVentureOffices();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("user");
  const [newOffice, setNewOffice] = useState<string>("");

  const fetchAll = useCallback(async () => {
    if (PREVIEW) {
      // Genericized sample rows for pre-deploy visual review only.
      setRows([
        { id: "p1", user_id: "p1", email: "admin@example.com", role: "admin", venture_office_assignment: "Global" },
        { id: "p2", user_id: "p2", email: "leader@example.com", role: "vo_leader", venture_office_assignment: "Healthliant Ventures" },
        { id: "p3", user_id: "p3", email: "analyst@example.com", role: "user", venture_office_assignment: "Northeast Georgia Health Ventures" },
        { id: "p4", user_id: "p4", email: "it@example.com", role: "technical", venture_office_assignment: null },
      ]);
      setPending([{ email: "newhire@example.com", role: "technical", venture_office: null }]);
      setLoading(false);
      return;
    }
    try {
      const [{ data: users, error: e1 }, { data: prov, error: e2 }] = await Promise.all([
        supabase.from("user_roles").select("id, user_id, email, role, venture_office_assignment").order("email"),
        supabase.from("user_provisioning" as any).select("email, role, venture_office").order("email"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      setRows((users as unknown as UserRow[]) || []);
      setPending((prov as unknown as PendingRow[]) || []);
    } catch (e: any) {
      console.error("Error loading users:", e);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveUser = async (row: UserRow, patch: Partial<Pick<UserRow, "role" | "venture_office_assignment">>) => {
    const next = { ...row, ...patch };
    // Office is meaningful only for office-bound roles.
    if (!OFFICE_BOUND_ROLES.includes(next.role)) next.venture_office_assignment = next.role === "admin" ? "Global" : null;
    if (OFFICE_BOUND_ROLES.includes(next.role) && !next.venture_office_assignment) {
      toast.error("Select a venture office for this role");
      return;
    }
    setRows(prev => prev.map(r => (r.id === row.id ? next : r)));
    const { data, error } = await supabase
      .from("user_roles")
      .update({ role: next.role, venture_office_assignment: next.venture_office_assignment } as any)
      .eq("id", row.id)
      .select("id");
    if (error || !data || data.length === 0) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
      fetchAll();
    } else {
      toast.success("User updated");
    }
  };

  const addPending = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) { toast.error("Enter a valid email"); return; }
    if (OFFICE_BOUND_ROLES.includes(newRole) && !newOffice) { toast.error("Select a venture office for this role"); return; }
    const office = OFFICE_BOUND_ROLES.includes(newRole) ? newOffice : newRole === "admin" ? "Global" : null;
    const { error } = await supabase
      .from("user_provisioning" as any)
      .insert({ email, role: newRole, venture_office: office } as any);
    if (error) {
      console.error("Error provisioning user:", error);
      toast.error(error.code === "23505" ? "That email is already provisioned" : "Failed to provision user");
      return;
    }
    toast.success(`${email} will get the ${ROLE_LABELS[newRole]} role on first sign-in`);
    setNewEmail("");
    setNewOffice("");
    fetchAll();
  };

  const removePending = async (email: string) => {
    const { error } = await supabase.from("user_provisioning" as any).delete().eq("email", email);
    if (error) { toast.error("Failed to remove"); return; }
    setPending(prev => prev.filter(p => p.email !== email));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Users</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Users</CardTitle>
        <CardDescription>
          Assign roles and venture offices. Your own row is locked — ask another admin to change it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead className="w-44">Role</TableHead>
              <TableHead className="w-64">Venture office</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => {
              const isSelf = r.user_id === currentUser?.id;
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.email || r.user_id}
                    {isSelf && <Badge variant="secondary" className="ml-2">You</Badge>}
                  </TableCell>
                  <TableCell>
                    <Select value={r.role} disabled={isSelf}
                      onValueChange={v => saveUser(r, { role: v as AppRole })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ROLE_LABELS) as AppRole[]).map(role => (
                          <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {OFFICE_BOUND_ROLES.includes(r.role) ? (
                      <Select value={r.venture_office_assignment ?? ""} disabled={isSelf}
                        onValueChange={v => saveUser(r, { venture_office_assignment: v })}>
                        <SelectTrigger><SelectValue placeholder="Select office" /></SelectTrigger>
                        <SelectContent>
                          {ventureOffices.map(o => <SelectItem key={o} value={o}><OfficeTag office={o} /></SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-muted-foreground">{r.role === "admin" ? "Global" : "All offices"}</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="border-t pt-4 space-y-3">
          <div className="text-sm font-medium">Pre-provision a new user</div>
          <p className="text-xs text-muted-foreground">
            They sign up at the app's sign-in page with this email and land in the assigned role automatically.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Input className="w-64" placeholder="email@prinnovo.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            <Select value={newRole} onValueChange={v => setNewRole(v as AppRole)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_LABELS) as AppRole[]).map(role => (
                  <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {OFFICE_BOUND_ROLES.includes(newRole) && (
              <Select value={newOffice} onValueChange={setNewOffice}>
                <SelectTrigger className="w-64"><SelectValue placeholder="Venture office" /></SelectTrigger>
                <SelectContent>
                  {ventureOffices.map(o => <SelectItem key={o} value={o}><OfficeTag office={o} /></SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button size="sm" className="gap-1" onClick={addPending}><Plus className="h-4 w-4" /> Add</Button>
          </div>
          {pending.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pending email</TableHead>
                  <TableHead className="w-36">Role</TableHead>
                  <TableHead className="w-64">Venture office</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map(p => (
                  <TableRow key={p.email}>
                    <TableCell className="font-medium">{p.email}</TableCell>
                    <TableCell>{ROLE_LABELS[p.role]}</TableCell>
                    <TableCell>{p.venture_office ? <OfficeTag office={p.venture_office} /> : <span className="text-muted-foreground text-sm">—</span>}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600" title="Remove"
                        onClick={() => removePending(p.email)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
