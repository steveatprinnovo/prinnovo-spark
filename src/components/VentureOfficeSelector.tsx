import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";
import { useAllVentureOfficeLogos } from "@/hooks/useVentureOfficeLogo";
import prinnovoLogo from "@/assets/prinnovo-logo.webp";

interface VentureOfficeSelectorProps {
  isOpen: boolean;
  ventureOffices: string[];
  onSelect: (office: string) => void;
}

export function VentureOfficeSelector({ isOpen, ventureOffices, onSelect }: VentureOfficeSelectorProps) {
  const [selectedOffice, setSelectedOffice] = useState<string>("all");
  const { logos } = useAllVentureOfficeLogos();

  const handleConfirm = () => {
    onSelect(selectedOffice);
  };

  const getLogoForOffice = (officeName: string): string | null => {
    const officeData = logos.find((l) => l.name === officeName);
    return officeData?.logoUrl || null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Select Venture Office
          </DialogTitle>
          <DialogDescription>
            Choose which venture office data you would like to view. You can change this selection later using the dropdown in each tab.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <RadioGroup value={selectedOffice} onValueChange={setSelectedOffice}>
            <div className="flex items-center space-x-2 py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="flex-1 cursor-pointer font-medium">
                <div className="flex items-center gap-2">
                  <img 
                    src={prinnovoLogo} 
                    alt="Prinnovo" 
                    className="w-5 h-5 object-contain"
                  />
                  <span>All Venture Offices</span>
                </div>
              </Label>
            </div>
            
            {ventureOffices.map((office) => {
              const logoUrl = getLogoForOffice(office);
              return (
                <div key={office} className="flex items-center space-x-2 py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={office} id={office} />
                  <Label htmlFor={office} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      {logoUrl && (
                        <img 
                          src={logoUrl} 
                          alt={office} 
                          className="w-5 h-5 object-contain"
                        />
                      )}
                      <span>{office}</span>
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleConfirm} className="w-full sm:w-auto">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
