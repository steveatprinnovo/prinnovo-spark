import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { VentureOfficeSelector } from "@/components/VentureOfficeSelector";
import { PageHeader, PageContainer } from "@/components/layout/PageHeader";
import { CostsTable } from "@/components/CostsTable";
import { AddCostValuesModal } from "@/components/AddCostValuesModal";
import { useAuth } from "@/hooks/useAuth";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useAdminVentureOffice } from "@/hooks/useAdminVentureOffice";
import { useVentureOfficeDetails } from "@/hooks/useVentureOfficeDetails";
import { useAllVentureOffices } from "@/hooks/useAllVentureOffices";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

/** Cost Projections (UX redesign 2026-07-18): the former "Costs" tab of
 *  Projections promoted to its own page. Access matrix unchanged — admins see
 *  all offices via the office selector; VO leaders are read-only, scoped to
 *  their own office. Route-level RoleGate (admin + vo_leader) enforces entry;
 *  in-page logic mirrors the old tab exactly. */
const CostProjections = () => {
  usePageTitle("Cost Projections");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, role, ventureOffice, loading: authzLoading } = useUserAuth();
  const { selectedVentureOffice, showSelector, selectVentureOffice } = useAdminVentureOffice();
  // VO leaders see costs read-only, scoped to their own office.
  const isVoLeader = role === "vo_leader";
  const costsOffice = isAdmin ? selectedVentureOffice : ventureOffice || "";
  const [costsContractYear, setCostsContractYear] = useState<number | null>(null);
  const [showAddCostModal, setShowAddCostModal] = useState(false);
  const [costsRefreshKey, setCostsRefreshKey] = useState(0);

  const { details: ventureOfficeDetails } = useVentureOfficeDetails(costsOffice);
  const { ventureOffices: allVentureOffices } = useAllVentureOffices();

  // Use all venture offices from the database (so offices without companies still appear)
  const ventureOffices = allVentureOffices;

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Show loading while checking authentication
  if (authLoading || authzLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </PageContainer>
    );
  }

  // Don't render if not authenticated or not permitted (route RoleGate is the
  // primary gate; this mirrors the old in-page tab visibility).
  if (!user || (!isAdmin && !isVoLeader)) {
    return null;
  }

  return (
    <PageContainer>
      {/* Venture Office Selector Modal for Admins */}
      {isAdmin && <VentureOfficeSelector isOpen={showSelector} ventureOffices={ventureOffices} onSelect={selectVentureOffice} />}

      <PageHeader
        title="Cost Projections"
        subtitle="Budget variance and monthly cost detail by contract year"
        actions={
          // Financial writes are admin-only (RBAC design, 2026-07-14).
          isAdmin && selectedVentureOffice !== "all" ? (
            <Button
              size="sm"
              className="bg-[#171d70] text-white hover:bg-[#10154f]"
              onClick={() => setShowAddCostModal(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add New Values
            </Button>
          ) : undefined
        }
      />

      <CostsTable
        selectedVentureOffice={costsOffice}
        selectedContractYear={costsContractYear}
        onContractYearChange={setCostsContractYear}
        initiationDate={ventureOfficeDetails?.venture_office_initiation_date}
        officeId={ventureOfficeDetails?.office_id}
        refreshKey={costsRefreshKey}
      />

      {/* Add Cost Values Modal */}
      <AddCostValuesModal
        open={showAddCostModal}
        onOpenChange={setShowAddCostModal}
        selectedVentureOffice={selectedVentureOffice}
        officeId={ventureOfficeDetails?.office_id}
        initiationDate={ventureOfficeDetails?.venture_office_initiation_date}
        onSuccess={() => setCostsRefreshKey(prev => prev + 1)}
      />
    </PageContainer>
  );
};

export default CostProjections;
