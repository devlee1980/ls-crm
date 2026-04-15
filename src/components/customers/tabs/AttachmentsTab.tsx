"use client";

import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Upload,
  Trash2,
  Download,
  Loader2,
  FileWarning,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/formatters";
import type { Attachment } from "../CustomerDetail";

const ACCEPTED_TYPES = ["application/pdf"];
const ACCEPTED_EXT = ".pdf";
const MAX_SIZE_MB = 25;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsTab({
  customerId,
  initialAttachments,
}: {
  customerId: string;
  initialAttachments: Attachment[];
}) {
  const [attachments, setAttachments] = useState(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Only PDF files are accepted");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error(`File must be under ${MAX_SIZE_MB} MB`);
      return;
    }

    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("customerId", customerId);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const created: Attachment = await res.json();
      // Normalize dates returned as strings from the API
      setAttachments((prev) => [
        { ...created, createdAt: new Date(created.createdAt) },
        ...prev,
      ]);
      toast.success(`"${file.name}" uploaded`);
    } catch {
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/attachments/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setAttachments((prev) => prev.filter((a) => a.id !== deleteId));
      toast.success("File deleted");
    } catch {
      toast.error("Failed to delete file");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  const deleteTarget = attachments.find((a) => a.id === deleteId);

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6 space-y-5">

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
            p-8 cursor-pointer transition-colors select-none
            ${dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"
            }
            ${uploading ? "pointer-events-none opacity-60" : ""}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXT}
            className="hidden"
            onChange={handleFileInput}
          />
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <div className="bg-primary/10 rounded-full p-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="text-center">
            <p className="text-sm font-medium">
              {uploading ? "Uploading…" : "Drop a PDF here or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              PDF files only · Max {MAX_SIZE_MB} MB
            </p>
          </div>
        </div>

        {/* File list */}
        {attachments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <FileWarning className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No quotes attached yet.</p>
            <p className="text-xs text-muted-foreground">
              Upload a PDF to attach a sales quote to this customer.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
              {attachments.length} {attachments.length === 1 ? "file" : "files"}
            </p>
            {attachments.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-lg border bg-muted/20 px-4 py-3 hover:bg-muted/40 transition-colors group"
              >
                <div className="bg-red-50 rounded-lg p-2 shrink-0">
                  <FileText className="h-5 w-5 text-red-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(a.fileSize)} · {formatDate(a.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    render={
                      <a
                        href={`/api/attachments/${a.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(a.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.fileName}&rdquo; will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
