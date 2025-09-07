import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Eye } from "lucide-react";
import { toast } from "sonner";

interface AgendaItem {
  id: string;
  item: string;
  presenter: string;
  time: string;
}

export default function BoardMode() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [agendaDate, setAgendaDate] = useState(format(new Date(), "MMMM, dd, yyyy"));
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([
    { id: "1", item: "", presenter: "", time: "" },
    { id: "2", item: "", presenter: "", time: "" },
    { id: "3", item: "", presenter: "", time: "" }
  ]);
  const [companyTitle, setCompanyTitle] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const addAgendaItem = () => {
    const newItem: AgendaItem = {
      id: Date.now().toString(),
      item: "",
      presenter: "",
      time: ""
    };
    setAgendaItems([...agendaItems, newItem]);
  };

  const updateAgendaItem = (id: string, field: keyof Omit<AgendaItem, 'id'>, value: string) => {
    setAgendaItems(items => 
      items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeAgendaItem = (id: string) => {
    if (agendaItems.length > 1) {
      setAgendaItems(items => items.filter(item => item.id !== id));
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !companyTitle.trim()) {
      toast.error("Please enter a company title first");
      return;
    }

    setLogoFile(file);
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyTitle.toLowerCase().replace(/\s+/g, '-')}-logo.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('Company Logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: signedLogo, error: signedErr } = await supabase.storage
        .from('Company Logos')
        .createSignedUrl(filePath, 3600);

      if (signedErr) throw signedErr;

      setLogoUrl(signedLogo?.signedUrl || null);
      toast.success("Logo uploaded successfully!");
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast.error("Please select a PDF file");
      return;
    }

    setPdfFile(file);
    setUploading(true);

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('New Company approvals')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: signedPdf, error: signedPdfErr } = await supabase.storage
        .from('New Company approvals')
        .createSignedUrl(filePath, 3600);

      if (signedPdfErr) throw signedPdfErr;

      setPdfUrl(signedPdf?.signedUrl || null);
      if (signedPdf?.signedUrl) {
        setShowPdfModal(true);
      }
      toast.success("PDF uploaded successfully!");
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast.error("Failed to upload PDF");
    } finally {
      setUploading(false);
    }
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto p-6 space-y-8">
        {/* Agenda Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Agenda</h1>
            <div className="flex items-center gap-2">
              <Label htmlFor="agenda-date" className="text-sm font-medium">
                Date:
              </Label>
              <Input
                id="agenda-date"
                value={agendaDate}
                onChange={(e) => setAgendaDate(e.target.value)}
                className="w-48"
                placeholder="MMMM, DD, YYYY"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            {/* Table Headers */}
            <div className="grid grid-cols-12 gap-4 font-medium text-sm text-muted-foreground mb-2">
              <div className="col-span-5">Agenda Item</div>
              <div className="col-span-4">Agenda Presenter(s)</div>
              <div className="col-span-2">Agenda Time</div>
              <div className="col-span-1"></div>
            </div>
            
            {/* Table Rows */}
            {agendaItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-5">
                  <Input
                    value={item.item}
                    onChange={(e) => updateAgendaItem(item.id, 'item', e.target.value)}
                    placeholder="Enter agenda item"
                    className="border-0 shadow-none focus-visible:ring-0 p-2"
                  />
                </div>
                <div className="col-span-4">
                  <Input
                    value={item.presenter}
                    onChange={(e) => updateAgendaItem(item.id, 'presenter', e.target.value)}
                    placeholder="Enter presenter(s)"
                    className="border-0 shadow-none focus-visible:ring-0 p-2"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    value={item.time}
                    onChange={(e) => updateAgendaItem(item.id, 'time', e.target.value)}
                    placeholder="Time"
                    className="border-0 shadow-none focus-visible:ring-0 p-2"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  {agendaItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAgendaItem(item.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addAgendaItem}
              className="mt-4"
            >
              Add Agenda Item
            </Button>
          </div>
        </div>

        {/* Separator */}
        <Separator className="my-8" />

        {/* New Board Approvals Section */}
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">New Board Approvals</h1>
          
          <div className="space-y-6">
            {/* Company Title */}
            <div className="space-y-2">
              <Label htmlFor="company-title">Company Title</Label>
              <Input
                id="company-title"
                value={companyTitle}
                onChange={(e) => setCompanyTitle(e.target.value)}
                placeholder="Enter company title"
                className="max-w-md"
              />
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="flex items-center gap-4">
                    <img 
                      src={logoUrl} 
                      alt="Company logo" 
                      className="h-16 w-16 object-contain border rounded"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        setLogoUrl(null);
                        setLogoFile(null);
                      }}
                    >
                      Remove Logo
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 border-2 border-dashed border-muted-foreground/25 rounded flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <Button variant="outline" asChild disabled={uploading || !companyTitle.trim()}>
                        <span>
                          {uploading ? "Uploading..." : "Upload Logo"}
                        </span>
                      </Button>
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploading || !companyTitle.trim()}
                      />
                    </Label>
                  </div>
                )}
              </div>
              {!companyTitle.trim() && (
                <p className="text-sm text-muted-foreground">Please enter a company title first</p>
              )}
            </div>

            {/* PDF Upload */}
            <div className="space-y-2">
              <Label>Approval Document (PDF)</Label>
              <div className="flex items-center gap-4">
                {pdfFile ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 p-2 border rounded">
                      <span className="text-sm">{pdfFile.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPdfModal(true)}
                        className="h-6 w-6 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPdfFile(null);
                        setPdfUrl(null);
                      }}
                    >
                      Remove PDF
                    </Button>
                  </div>
                ) : (
                  <Label htmlFor="pdf-upload" className="cursor-pointer">
                    <Button variant="outline" asChild disabled={uploading}>
                      <span>
                        {uploading ? "Uploading..." : "Upload PDF"}
                      </span>
                    </Button>
                    <Input
                      id="pdf-upload"
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </Label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PDF Preview Modal */}
        <Dialog open={showPdfModal} onOpenChange={setShowPdfModal}>
          <DialogContent className="max-w-6xl w-[90vw] h-[90vh] p-4">
            <DialogHeader>
              <DialogTitle>PDF Preview{pdfFile?.name ? ` - ${pdfFile.name}` : ""}</DialogTitle>
              <DialogDescription className="sr-only">
                Preview of the uploaded PDF document
              </DialogDescription>
            </DialogHeader>
            <div className="h-full overflow-hidden">
              {pdfUrl ? (
                <object data={pdfUrl} type="application/pdf" className="w-full h-full rounded border">
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Your browser cannot display PDFs.
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="ml-2 underline">
                      Open in a new tab
                    </a>
                  </div>
                </object>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No PDF available to preview.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}