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
  const [investedAmount, setInvestedAmount] = useState<string>("");
  const [investedAmountDate, setInvestedAmountDate] = useState<string>("");
  const [currentValuation, setCurrentValuation] = useState<string>("");
  const [valuationDate, setValuationDate] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

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
    setInvestedAmount("");
    setInvestedAmountDate("");
    setCurrentValuation("");
    setValuationDate("");
  };

  // Load company data when selecting existing company
  useEffect(() => {
    if (selectedCompany) {
      const company = companies.find(c => c["Company Name"] === selectedCompany);
      if (company) {
        setInvestmentStage(company["Investment Tracker Stage"] || "");
        setInvestedAmount(company["Invested Amount"]?.toString() || "");
        setInvestedAmountDate(company["Invested Amount Date"] || "");
        setCurrentValuation(company["Invested Amount Valuation"]?.toString() || "");
        setValuationDate(company["Invested Amount Valuation Date"] || "");
      }
    }
  }, [selectedCompany, companies]);

  const handleUpdateExisting = async () => {
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
            <TabsTrigger value="update">Update Existing</TabsTrigger>
            <TabsTrigger value="add">Add New Investment</TabsTrigger>
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
                    <SelectContent>
                      {investmentCompanies.map((company) => (
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
    </Dialog>
  );
}