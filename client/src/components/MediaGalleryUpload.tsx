import { useRef, useState } from "react";
import { Plus, X, Loader2, Play } from "lucide-react";
import { useRequestUploadUrl } from "@/hooks/use-uploads";
import { useToast } from "@/hooks/use-toast";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
}

function isVideo(url: string) {
  return /\.(mp4|webm|ogg|mov)$/i.test(url);
}

export function MediaGalleryUpload({ value, onChange, label = "Gallery" }: Props) {
  const { toast } = useToast();
  const requestUrl = useRequestUploadUrl();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const resp = await requestUrl.mutateAsync({
          file,
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        });
        uploaded.push(resp.objectPath);
      }
      onChange([...value, ...uploaded]);
      toast({ title: `${uploaded.length} file${uploaded.length > 1 ? "s" : ""} uploaded` });
    } catch (e) {
      toast({ title: "Upload failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className="text-[10px] text-muted-foreground/50">{value.length} file{value.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {/* Existing items */}
        {value.map((url, i) => (
          <div key={i} className="relative aspect-square bg-muted overflow-hidden group">
            {isVideo(url) ? (
              <div className="w-full h-full flex items-center justify-center bg-black/80">
                <Play className="h-6 w-6 text-white/70" />
              </div>
            ) : (
              <img src={url} alt={`Media ${i + 1}`} className="w-full h-full object-cover" />
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 h-5 w-5 bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Upload button tile */}
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="aspect-square border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Plus className="h-5 w-5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Add</span>
            </>
          )}
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground/50">Images or videos · JPG, PNG, WEBP, MP4 · Max 20MB each</p>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void handleFiles(e.target.files);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}
