import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { type Company } from "@/hooks/useCompanies";
import { useCompanyLogo } from "@/hooks/useCompanyLogo";
import { Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface UpdateValuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  updateCompany: (companyName: string, updates: Partial<Company>) => Promise<boolean>;
  refetch: () => Promise<void>;
}

const INVESTMENT_STAGES = [
  "Committed",
  "IPA Obligation", 
  "Term Sheet Proposed",
  "Operational Funding"
];

function CompanySelectItem({ company }: { company: any }) {
  const { logoUrl } = useCompanyLogo(company.imgurl);
  
  return (
    <div className="flex items-center gap-3">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${company["Company Name"]} logo`}
          className="w-6 h-6 rounded object-contain bg-white p-0.5"
        />
      ) : (
        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
          <span className="text-xs font-medium text-muted-foreground">
            {company["Company Name"]?.charAt(0)}
          </span>
        </div>
      )}
      <span>{company["Company Name"]}</span>
    </div>
  );
}

export function UpdateValuationModal({ isOpen, onClose, companies, updateCompany, refetch }: UpdateValuationModalProps) {
  const [activeTab, setActiveTab] = useState<string>("update");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [investmentStage, setInvestmentStage] = useState<string>("");
  const [selectedRound, setSelectedRound] = useState<string>("1");
  const [roundName, setRoundName] = useState<string>("");
  const [investedAmount, setInvestedAmount] = useState<string>("");
  const [investedAmountDate, setInvestedAmountDate] = useState<string>("");
  const [currentValuation, setCurrentValuation] = useState<string>("");
  const [valuationDate, setValuationDate] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roundToDelete, setRoundToDelete] = useState<string | null>(null);

  // Filter companies that have investment tracker stages
  const investmentCompanies = companies.filter(
    company => company["Investment Tracker Stage"] !== null
  );

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("update");
      setSelectedCompany("");
      setInvestmentStage("");
      setSelectedRound("1");
      setRoundName("");
      setInvestedAmount("");
      setInvestedAmountDate("");
      setCurrentValuation("");
      setValuationDate("");
    }
  }, [isOpen]);

  // Reset form when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSelectedCompany("");
    setInvestmentStage("");
    setSelectedRound("1");
    setRoundName("");
    setInvestedAmount("");
    setInvestedAmountDate("");
    setCurrentValuation("");
    setValuationDate("");
  };

  // Load company data when selecting existing company or changing round
  useEffect(() => {
    if (selectedCompany) {
      const company = companies.find(c => c["Company Name"] === selectedCompany);
      if (company) {
        setInvestmentStage(company["Investment Tracker Stage"] || "");
        
        // Load data based on selected round
        if (selectedRound === "1") {
          setRoundName(company["Invested Amount Round"] || "");
          setInvestedAmount(company["Invested Amount"]?.toString() || "");
          setInvestedAmountDate(company["Invested Amount Date"] || "");
          setCurrentValuation(company["Invested Amount Valuation"]?.toString() || "");
          setValuationDate(company["Invested Amount Valuation Date"] || "");
        } else if (selectedRound === "2") {
          setRoundName(company["Invested Amount Round 2"] || "");
          setInvestedAmount(company["Invested Amount 2"]?.toString() || "");
          setInvestedAmountDate(company["Invested Amount Date 2"] || "");
          setCurrentValuation(company["Invested Amount Valuation 2"]?.toString() || "");
          setValuationDate(company["Invested Amount Valuation Date 2"] || "");
        } else if (selectedRound === "3") {
          setRoundName(company["Invested Amount Round 3"] || "");
          setInvestedAmount(company["Invested Amount 3"]?.toString() || "");
          setInvestedAmountDate(company["Invested Amount Date 3"] || "");
          setCurrentValuation(company["Invested Amount Valuation 3"]?.toString() || "");
          setValuationDate(company["Invested Amount Valuation Date 3"] || "");
        }
      }
    }
  }, [selectedCompany, selectedRound, companies]);

  // Get available rounds for the selected company
  const getAvailableRounds = () => {
    if (!selectedCompany) return [];
    const company = companies.find(c => c["Company Name"] === selectedCompany);
    if (!company) return [];

    const rounds = [];
    if (company["Invested Amount Round"]) rounds.push({ value: "1", label: company["Invested Amount Round"], canDelete: true });
    if (company["Invested Amount Round 2"]) rounds.push({ value: "2", label: company["Invested Amount Round 2"], canDelete: true });
    if (company["Invested Amount Round 3"]) rounds.push({ value: "3", label: company["Invested Amount Round 3"], canDelete: true });

    // Add option for next available round
    if (rounds.length < 3) {
      rounds.push({ value: String(rounds.length + 1), label: "Add New Round", canDelete: false, isNew: true });
    }

    // If no rounds exist, show Round 1
    if (rounds.length === 0) {
      rounds.push({ value: "1", label: "Round 1", canDelete: false });
    }

    return rounds;
  };

  const handleDeleteRound = async (roundValue: string) => {
    if (!selectedCompany) return;

    const company = companies.find(c => c["Company Name"] === selectedCompany);
    if (!company) return;

    setIsUpdating(true);
    try {
      const updatedData: any = { ...company };

      // Clear the data for the specified round
      if (roundValue === "1") {
        updatedData["Invested Amount Round"] = null;
        updatedData["Invested Amount"] = null;
        updatedData["Invested Amount Date"] = null;
        updatedData["Invested Amount Valuation"] = null;
        updatedData["Invested Amount Valuation Date"] = null;
      } else if (roundValue === "2") {
        updatedData["Invested Amount Round 2"] = null;
        updatedData["Invested Amount 2"] = null;
        updatedData["Invested Amount Date 2"] = null;
        updatedData["Invested Amount Valuation 2"] = null;
        updatedData["Invested Amount Valuation Date 2"] = null;
      } else if (roundValue === "3") {
        updatedData["Invested Amount Round 3"] = null;
        updatedData["Invested Amount 3"] = null;
        updatedData["Invested Amount Date 3"] = null;
        updatedData["Invested Amount Valuation 3"] = null;
        updatedData["Invested Amount Valuation Date 3"] = null;
      }

      await updateCompany(company["Company Name"], updatedData);
      await refetch();
      
      toast.success("Investment round deleted successfully");
      
      // Reset to first available round
      const availableRounds = getAvailableRounds();
      if (availableRounds.length > 0) {
        setSelectedRound(availableRounds[0].value);
      }
      
      setDeleteDialogOpen(false);
      setRoundToDelete(null);
    } catch (error) {
      console.error("Error deleting round:", error);
      toast.error("Failed to delete investment round");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateExisting = async () => {
    if (!selectedCompany || !investmentStage) {
      toast.error("Please select a company and investment stage");
      return;
    }

    // Check if round name is provided when adding a new round
    const company = companies.find(c => c["Company Name"] === selectedCompany);
    if (!company) {
      toast.error("Company not found");
      return;
    }

    const availableRounds = getAvailableRounds();
    const isNewRound = availableRounds.find(r => r.value === selectedRound)?.label === "Add New Round";
    
    if (isNewRound && !roundName.trim()) {
      toast.error("Please enter a name for the investment round");
      return;
    }

    setIsUpdating(true);
    try {
      const updatedData: any = {
        ...company,
        "Investment Tracker Stage": investmentStage,
      };

      // Update the correct round based on selection
      if (selectedRound === "1") {
        updatedData["Invested Amount Round"] = roundName || null;
        updatedData["Invested Amount"] = investedAmount ? parseFloat(investedAmount) : null;
        updatedData["Invested Amount Date"] = investedAmountDate || null;
        updatedData["Invested Amount Valuation"] = currentValuation ? parseFloat(currentValuation) : null;
        updatedData["Invested Amount Valuation Date"] = valuationDate || null;
      } else if (selectedRound === "2") {
        updatedData["Invested Amount Round 2"] = roundName || null;
        updatedData["Invested Amount 2"] = investedAmount ? parseFloat(investedAmount) : null;
        updatedData["Invested Amount Date 2"] = investedAmountDate || null;
        updatedData["Invested Amount Valuation 2"] = currentValuation ? parseFloat(currentValuation) : null;
        updatedData["Invested Amount Valuation Date 2"] = valuationDate || null;
      } else if (selectedRound === "3") {
        updatedData["Invested Amount Round 3"] = roundName || null;
        updatedData["Invested Amount 3"] = investedAmount ? parseFloat(investedAmount) : null;
        updatedData["Invested Amount Date 3"] = investedAmountDate || null;
        updatedData["Invested Amount Valuation 3"] = currentValuation ? parseFloat(currentValuation) : null;
        updatedData["Invested Amount Valuation Date 3"] = valuationDate || null;
      }

      await updateCompany(company["Company Name"], updatedData);
      
      // Refetch to ensure data consistency
      await refetch();
      
      toast.success("Investment updated successfully");
      onClose();
    } catch (error) {
      console.error("Error updating investment:", error);
      toast.error("Failed to update investment");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNew = async () => {
    if (!selectedCompany || !investmentStage) {
      toast.error("Please select a company and investment stage");
      return;
    }

    setIsUpdating(true);
    try {
      const company = companies.find(c => c["Company Name"] === selectedCompany);
      if (!company) {
        toast.error("Company not found");
        return;
      }

      const updatedData = {
        ...company,
        "Investment Tracker Stage": investmentStage,
        "Invested Amount": investedAmount ? parseFloat(investedAmount) : null,
        "Invested Amount Date": investedAmountDate || null,
        "Invested Amount Valuation": currentValuation ? parseFloat(currentValuation) : null,
        "Invested Amount Valuation Date": valuationDate || null,
      };

      await updateCompany(company["Company Name"], updatedData);
      
      // Refetch to ensure data consistency
      await refetch();
      
      toast.success("New investment added successfully");
      onClose();
    } catch (error) {
      console.error("Error adding new investment:", error);
      toast.error("Failed to add new investment");
    } finally {
      setIsUpdating(false);
    }
  };

  // Get companies that don't have investment tracker stages for "Add New" tab
  const portfolioCompanies = companies.filter(
    company => company["Investment Tracker Stage"] === null
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Investment Valuations</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="update">Update Existing Company Investment</TabsTrigger>
            <TabsTrigger value="add">Add New Company Investment</TabsTrigger>
          </TabsList>

          <TabsContent value="update" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Update Existing Investment</CardTitle>
                <CardDescription>
                  Modify the investment details for an existing portfolio company
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="existing-company">Select Company</Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a company">
                        {selectedCompany && (
                          <CompanySelectItem 
                            company={investmentCompanies.find(c => c["Company Name"] === selectedCompany)} 
                          />
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {investmentCompanies
                        .sort((a, b) => a["Company Name"].localeCompare(b["Company Name"]))
                        .map((company) => (
                          <SelectItem key={company["Company Name"]} value={company["Company Name"]}>
                            <CompanySelectItem company={company} />
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investment-stage">Investment Stage</Label>
                  <Select value={investmentStage} onValueChange={setInvestmentStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select investment stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {INVESTMENT_STAGES.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCompany && (
                  <div className="space-y-2">
                    <Label htmlFor="investment-round">Investment Round</Label>
                    <div className="flex gap-2">
                      <Select value={selectedRound} onValueChange={setSelectedRound}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select investment round" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {getAvailableRounds().map((round) => (
                            <SelectItem key={round.value} value={round.value}>
                              <div className="flex items-center gap-2">
                                {round.isNew && <Plus className="h-4 w-4 text-primary" />}
                                <span>{round.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {getAvailableRounds().find(r => r.value === selectedRound)?.canDelete && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setRoundToDelete(selectedRound);
                            setDeleteDialogOpen(true);
                          }}
                          className="shrink-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {selectedCompany && getAvailableRounds().find(r => r.value === selectedRound)?.label === "Add New Round" && (
                  <div className="space-y-2">
                    <Label htmlFor="round-name">Round Name</Label>
                    <Input
                      id="round-name"
                      type="text"
                      value={roundName}
                      onChange={(e) => setRoundName(e.target.value)}
                      placeholder="e.g., Series A, Seed, etc."
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invested-amount">Invested Amount ($)</Label>
                    <Input
                      id="invested-amount"
                      type="number"
                      value={investedAmount}
                      onChange={(e) => setInvestedAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invested-amount-date">Invested Amount Date</Label>
                    <Input
                      id="invested-amount-date"
                      type="date"
                      value={investedAmountDate}
                      onChange={(e) => setInvestedAmountDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-valuation">Current Valuation ($)</Label>
                    <Input
                      id="current-valuation"
                      type="number"
                      value={currentValuation}
                      onChange={(e) => setCurrentValuation(e.target.value)}
                      placeholder="Enter valuation"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valuation-date">Valuation Date</Label>
                    <Input
                      id="valuation-date"
                      type="date"
                      value={valuationDate}
                      onChange={(e) => setValuationDate(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleUpdateExisting}
                  disabled={isUpdating || !selectedCompany || !investmentStage}
                  className="w-full"
                >
                  {isUpdating ? "Updating..." : "Update Investment"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Investment</CardTitle>
                <CardDescription>
                  Add investment tracking for an existing portfolio company
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-company">Select Portfolio Company</Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a portfolio company">
                        {selectedCompany && (
                          <CompanySelectItem 
                            company={portfolioCompanies.find(c => c["Company Name"] === selectedCompany)} 
                          />
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {portfolioCompanies.map((company) => (
                        <SelectItem key={company["Company Name"]} value={company["Company Name"]}>
                          <CompanySelectItem company={company} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-investment-stage">Investment Stage</Label>
                  <Select value={investmentStage} onValueChange={setInvestmentStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select investment stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {INVESTMENT_STAGES.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-invested-amount">Invested Amount ($)</Label>
                    <Input
                      id="new-invested-amount"
                      type="number"
                      value={investedAmount}
                      onChange={(e) => setInvestedAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-invested-amount-date">Invested Amount Date</Label>
                    <Input
                      id="new-invested-amount-date"
                      type="date"
                      value={investedAmountDate}
                      onChange={(e) => setInvestedAmountDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-current-valuation">Current Valuation ($)</Label>
                    <Input
                      id="new-current-valuation"
                      type="number"
                      value={currentValuation}
                      onChange={(e) => setCurrentValuation(e.target.value)}
                      placeholder="Enter valuation"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-valuation-date">Valuation Date</Label>
                    <Input
                      id="new-valuation-date"
                      type="date"
                      value={valuationDate}
                      onChange={(e) => setValuationDate(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleAddNew}
                  disabled={isUpdating || !selectedCompany || !investmentStage}
                  className="w-full"
                >
                  {isUpdating ? "Adding..." : "Add New Investment"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Investment Round</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this investment round? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => roundToDelete && handleDeleteRound(roundToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}