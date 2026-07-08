import { useState } from "react";
import { useDealDocuments, DOC_TYPES } from "@/hooks/useDeals";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, ExternalLink, Trash2, Plus } from "lucide-react";

const TYPE_STYLE: Record<string, string> = {
  term_sheet: "bg-sky-100 text-sky-800 border-sky-200",
  ipa: "bg-emerald-100 text-emerald-800 border-emerald-200",
  other: "bg-muted text-muted-foreground",
};

function isDriveUrl(u: string): boolean {
  return /^https:\/\/(drive|docs)\.google\.com\//.test(u.trim());
}

export function DealDocuments({ dealId, officeName }: { dealId: string; officeName?: string | null }) {
  const { documents, addDocument, removeDocument } = useDealDocuments(dealId);
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState("term_sheet");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const valid = title.trim() && isDriveUrl(url);

  const submit = async () => {
    if (!valid) return;
    await addDocument({ doc_type: type, title: title.trim(), drive_url: url.trim(), added_by: user?.email || null });
    setTitle(""); setUrl(""); setAdding(false);
  };

  const label = (k: string) => DOC_TYPES.find(t => t.key === k)?.label || k;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" /> Documents
            {documents.length > 0 && <Badge variant="secondary">{documents.length}</Badge>}
          </CardTitle>
          <Button variant="ghost" size="sm" className="gap-1 h-7 text-muted-foreground" onClick={() => setAdding(a => !a)}>
            <Plus className="h-3.5 w-3.5" /> Link file
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground">
            No files linked. Attach signed Term Sheets and executed IPAs from your office's Google Drive.
          </p>
        )}
        {documents.map(d => (
          <div key={d.id} className="border rounded-md p-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className={`inline-flex items-center rounded-full border px-2 py-0 text-[10px] font-medium ${TYPE_STYLE[d.doc_type]}`}>
                {label(d.doc_type)}
              </span>
              <div className="mt-1">
                <a href={d.drive_url} target="_blank" rel="noreferrer"
                   className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
                  {d.title} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
            </div>
            <button onClick={() => removeDocument(d.id)} className="p-1 text-muted-foreground/50 hover:text-rose-600 shrink-0" title="Remove link">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {adding && (
          <div className="border rounded-md p-3 space-y-2 bg-muted/30">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
            <Input className="h-8" placeholder="Document title" value={title} onChange={e => setTitle(e.target.value)} />
            <Input className="h-8" placeholder="Google Drive link (drive.google.com/…)" value={url} onChange={e => setUrl(e.target.value)} />
            {url && !isDriveUrl(url) && <p className="text-[11px] text-rose-600">Must be a drive.google.com or docs.google.com link.</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
              <Button size="sm" onClick={submit} disabled={!valid}>Add</Button>
            </div>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground border-t pt-2">
          {`Files live in ${officeName || "your venture office"}'s Google Drive; access follows Drive permissions.`}
        </p>
      </CardContent>
    </Card>
  );
}
