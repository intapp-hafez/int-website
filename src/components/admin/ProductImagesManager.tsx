import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, GripVertical, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export function ProductImagesManager({
  value,
  onChange,
}: {
  value: string[]; // first item = main image
  onChange: (next: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const valid: File[] = [];
    for (const f of arr) {
      if (!ACCEPT.includes(f.type)) { toast.error(`${f.name}: unsupported format`); continue; }
      if (f.size > MAX_BYTES) { toast.error(`${f.name}: exceeds 5 MB`); continue; }
      valid.push(f);
    }
    if (!valid.length) return;
    setBusy(true);
    const uploaded: string[] = [];
    for (const f of valid) {
      const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
      const path = `uploads/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, f, { cacheControl: "3600", upsert: false, contentType: f.type });
      if (error) { toast.error(`${f.name}: ${error.message}`); continue; }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }
    setBusy(false);
    if (uploaded.length) {
      onChange([...value, ...uploaded]);
      toast.success(`${uploaded.length} image(s) uploaded`);
    }
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const makeMain = (i: number) => {
    if (i === 0) return;
    const next = [...value];
    const [pulled] = next.splice(i, 1);
    next.unshift(pulled);
    onChange(next);
  };

  const onDropReorder = (toIdx: number) => {
    if (dragIdx === null || dragIdx === toIdx) return;
    const next = [...value];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(toIdx, 0, moved);
    onChange(next);
    setDragIdx(null);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragOver(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragOver ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}
      >
        {busy ? <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /> : <Upload className="h-6 w-6 mx-auto text-muted-foreground" />}
        <div className="text-sm mt-2 font-medium">Drag images here or click to upload</div>
        <div className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP, GIF, AVIF · up to 5 MB each</div>
        <input
          ref={inputRef} type="file" accept={ACCEPT.join(",")} multiple className="hidden"
          onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {value.map((url, i) => (
            <div
              key={url + i}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropReorder(i)}
              className={`relative group rounded-md overflow-hidden border bg-muted aspect-square ${dragIdx === i ? "opacity-50" : ""}`}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute top-1 start-1 text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded inline-flex items-center gap-1"><Star className="h-2.5 w-2.5" /> Main</span>}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <GripVertical className="h-3.5 w-3.5 text-white/80 absolute top-1 end-1 cursor-grab" />
                {i !== 0 && (
                  <Button type="button" size="sm" variant="secondary" className="h-7 px-2 text-xs" onClick={() => makeMain(i)}>
                    Make main
                  </Button>
                )}
                <Button type="button" size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={() => remove(i)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="absolute bottom-0 inset-x-0 text-[10px] text-white bg-black/60 px-1 py-0.5 text-center">#{i + 1}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
