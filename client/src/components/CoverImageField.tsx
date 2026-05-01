import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { useRequestUploadUrl } from "@/hooks/use-uploads";
import { useToast } from "@/hooks/use-toast";

export function CoverImageField({
  value,
  onChange,
  label = "Thumbnail",
}: {
  value?: string | null;
  onChange: (next: string | null) => void;
  label?: string;
}) {
  const { toast } = useToast();
  const requestUrl = useRequestUploadUrl();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const resp = await requestUrl.mutateAsync({
        file,
        name: file.name,
        size: file.size,
        contentType: file.type || "image/jpeg",
      });
      onChange(resp.objectPath);
      toast({ title: "Thumbnail uploaded" });
    } catch (e) {
      toast({ title: "Upload failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>}

      {/* 4:3 preview / upload zone */}
      <div
        className="relative w-full aspect-[3/2] border-2 border-dashed border-border bg-muted overflow-hidden cursor-pointer group hover:border-foreground transition-colors"
        onClick={() => !busy && inputRef.current?.click()}
      >
        {value ? (
          <>
            <img src={value} alt="Thumbnail" className="w-full h-full object-cover" />
            {/* overlay on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <span className="text-white text-xs font-bold uppercase tracking-wider">Change</span>
            </div>
            {/* remove button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="absolute top-2 right-2 h-7 w-7 bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            {busy ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-8 w-8" />
                <p className="text-xs font-semibold">Click to upload thumbnail</p>
                <p className="text-[10px] text-muted-foreground/60">Recommended: 4:3 ratio · JPG, PNG, WEBP</p>
              </>
            )}
          </div>
        )}
        {busy && value && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}
