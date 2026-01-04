import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddCostValuesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVentureOffice: string;
  officeId: number | undefined;
  onSuccess: () => void;
}

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear - 5; year <= currentYear + 2; year++) {
    years.push(year.toString());
  }
  return years;
};

export function AddCostValuesModal({
  open,
  onOpenChange,
  selectedVentureOffice,
  officeId,
  onSuccess,
}: AddCostValuesModalProps) {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(
    (currentDate.getMonth() + 1).toString().padStart(2, "0")
  );
  const [ventureTeamServicesCost, setVentureTeamServicesCost] = useState("");
  const [itTeamServicesCost, setItTeamServicesCost] = useState("");
  const [operatingExpenses, setOperatingExpenses] = useState("");
  const [legalCosts, setLegalCosts] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRecord, setExistingRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const years = generateYears();

  // Generate cost_id: office_id (3 digits) + year (4 digits) + month (2 digits)
  const generateCostId = () => {
    if (!officeId) return null;
    const paddedOfficeId = officeId.toString().padStart(3, "0");
    return parseInt(`${paddedOfficeId}${selectedYear}${selectedMonth}`, 10);
  };

  // Check for existing record when month/year changes
  useEffect(() => {
    const checkExistingRecord = async () => {
      if (!officeId || !selectedYear || !selectedMonth) return;
      
      setIsLoading(true);
      const costId = generateCostId();
      
      if (!costId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("venture_office_costs")
          .select("*")
          .eq("cost_id", costId)
          .maybeSingle();

        if (error) {
          console.error("Error checking existing record:", error);
        } else if (data) {
          setExistingRecord(data);
          setVentureTeamServicesCost(data.venture_team_services_cost?.toString() || "");
          setItTeamServicesCost(data.it_team_services_cost?.toString() || "");
          setOperatingExpenses(data.operating_expenses?.toString() || "");
          setLegalCosts(data.legal_costs?.toString() || "");
        } else {
          setExistingRecord(null);
          setVentureTeamServicesCost("");
          setItTeamServicesCost("");
          setOperatingExpenses("");
          setLegalCosts("");
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      checkExistingRecord();
    }
  }, [officeId, selectedYear, selectedMonth, open]);

  const handleSubmit = async () => {
    if (!officeId) {
      toast.error("Unable to determine office ID");
      return;
    }

    const costId = generateCostId();
    if (!costId) {
      toast.error("Unable to generate cost ID");
      return;
    }

    setIsSubmitting(true);

    try {
      const monthDate = `${selectedYear}-${selectedMonth}-01`;
      
      const payload = {
        cost_id: costId,
        venture_office: selectedVentureOffice,
        month: monthDate,
        venture_team_services_cost: ventureTeamServicesCost ? parseFloat(ventureTeamServicesCost) : 0,
        it_team_services_cost: itTeamServicesCost ? parseFloat(itTeamServicesCost) : 0,
        operating_expenses: operatingExpenses ? parseFloat(operatingExpenses) : 0,
        legal_costs: legalCosts ? parseFloat(legalCosts) : 0,
      };

      let error;

      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("venture_office_costs")
          .update({
            venture_team_services_cost: payload.venture_team_services_cost,
            it_team_services_cost: payload.it_team_services_cost,
            operating_expenses: payload.operating_expenses,
            legal_costs: payload.legal_costs,
          })
          .eq("cost_id", costId);
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from("venture_office_costs")
          .insert(payload);
        error = insertError;
      }

      if (error) {
        console.error("Error saving costs:", error);
        toast.error("Failed to save cost values");
      } else {
        toast.success(existingRecord ? "Cost values updated successfully" : "Cost values added successfully");
        onSuccess();
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setVentureTeamServicesCost("");
    setItTeamServicesCost("");
    setOperatingExpenses("");
    setLegalCosts("");
    setExistingRecord(null);
    onOpenChange(false);
  };

  const monthLabel = MONTHS.find((m) => m.value === selectedMonth)?.label || "";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {existingRecord ? "Update Cost Values" : "Add New Cost Values"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground">
            Venture Office: <span className="font-medium text-foreground">{selectedVentureOffice}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              Loading existing values...
            </div>
          ) : (
            <>
              {existingRecord && (
                <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
                  Existing record found for {monthLabel} {selectedYear}. Values will be updated.
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ventureTeamServicesCost">Venture Team Services Cost ($)</Label>
                  <Input
                    id="ventureTeamServicesCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={ventureTeamServicesCost}
                    onChange={(e) => setVentureTeamServicesCost(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itTeamServicesCost">IT Team Services Cost ($)</Label>
                  <Input
                    id="itTeamServicesCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={itTeamServicesCost}
                    onChange={(e) => setItTeamServicesCost(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operatingExpenses">Operating Expenses ($)</Label>
                  <Input
                    id="operatingExpenses"
                    type="number"
                    min="0"
                    step="0.01"
                    value={operatingExpenses}
                    onChange={(e) => setOperatingExpenses(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legalCosts">Legal Costs ($)</Label>
                  <Input
                    id="legalCosts"
                    type="number"
                    min="0"
                    step="0.01"
                    value={legalCosts}
                    onChange={(e) => setLegalCosts(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoading}>
            {isSubmitting ? "Saving..." : existingRecord ? "Update Values" : "Save Values"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
