import { useEffect, useRef } from "react";
import { EditorContent, useEditor, Node, mergeAttributes } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { cn } from "@/lib/utils";
import {
  Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, Quote,
  Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight,
  Undo2, Redo2, ImagePlus, Video,
} from "lucide-react";
import { useRequestUploadUrl } from "@/hooks/use-uploads";

const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block",
  atom: true,
  addAttributes() { return { src: { default: null } }; },
  parseHTML() { return [{ tag: "div[data-video-embed]" }]; },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-video-embed": "" }, HTMLAttributes),
      ["iframe", { src: HTMLAttributes.src, frameborder: "0", allowfullscreen: "true", class: "w-full aspect-video rounded" }]];
  },
});

function Btn({ active, disabled, onClick, children, title }: {
  active?: boolean; disabled?: boolean; onClick: () => void;
  children: React.ReactNode; title: string;
}) {
  return (
    <button
      type="button" title={title} disabled={disabled} onClick={onClick}
      className={cn(
        "h-8 w-8 flex items-center justify-center rounded transition-all text-sm font-medium",
        disabled && "opacity-30 cursor-not-allowed",
        active
          ? "bg-black text-white shadow-sm"
          : "text-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Sep() { return <div className="w-px h-5 bg-border mx-0.5" />; }

export function RichTextEditor({
  value, onChange, placeholder = "Write content here…", className,
}: {
  value: string; onChange: (html: string) => void;
  placeholder?: string; className?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestUploadUrl = useRequestUploadUrl();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ inline: false, allowBase64: false }),
      VideoEmbed,
    ],
    content: value || "",
    editorProps: {
      attributes: { class: "min-h-[220px] px-4 py-4 focus:outline-none text-sm leading-relaxed prose prose-sm max-w-none" },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    if ((value || "") !== (editor.getHTML() || "")) editor.commands.setContent(value || "", false);
  }, [value, editor]);

  const a = (name: string, attrs?: Record<string, unknown>) => !!editor?.isActive(name, attrs);

  async function handleImageFile(file: File) {
    if (!editor) return;
    try {
      const resp = await requestUploadUrl.mutateAsync({ file, name: file.name, size: file.size, contentType: file.type || "image/jpeg" });
      editor.chain().focus().setImage({ src: resp.objectPath }).run();
    } catch {
      alert("Image upload failed");
    }
  }

  function handleVideoInsert() {
    if (!editor) return;
    const url = prompt("Enter video URL (YouTube, Vimeo, or direct .mp4):");
    if (!url) return;
    let src = url.trim();
    const ytMatch = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (ytMatch) src = `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = src.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) src = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    if (src.match(/\.(mp4|webm|ogg)(\?|$)/i)) {
      editor.chain().focus().insertContent(`<video src="${src}" controls class="w-full rounded"></video>`).run();
      return;
    }
    editor.chain().focus().insertContent({ type: "videoEmbed", attrs: { src } }).run();
  }

  return (
    <div className={cn("border border-border bg-background overflow-hidden rounded-lg", className)}>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImageFile(f); e.target.value = ""; }} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/40">
        <Btn title="Bold" active={a("bold")} disabled={!editor} onClick={() => editor?.chain().focus().toggleBold().run()}>
          <Bold className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Italic" active={a("italic")} disabled={!editor} onClick={() => editor?.chain().focus().toggleItalic().run()}>
          <Italic className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Underline" active={a("underline")} disabled={!editor} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-3.5 w-3.5" />
        </Btn>

        <Sep />

        <Btn title="Heading 2" active={a("heading", { level: 2 })} disabled={!editor} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Heading 3" active={a("heading", { level: 3 })} disabled={!editor} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Blockquote" active={a("blockquote")} disabled={!editor} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-3.5 w-3.5" />
        </Btn>

        <Sep />

        <Btn title="Bullet list" active={a("bulletList")} disabled={!editor} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          <List className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Ordered list" active={a("orderedList")} disabled={!editor} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-3.5 w-3.5" />
        </Btn>

        <Sep />

        <Btn title="Align left" active={a("textAlign", { textAlign: "left" })} disabled={!editor} onClick={() => editor?.chain().focus().setTextAlign("left").run()}>
          <AlignLeft className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Align center" active={a("textAlign", { textAlign: "center" })} disabled={!editor} onClick={() => editor?.chain().focus().setTextAlign("center").run()}>
          <AlignCenter className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Align right" active={a("textAlign", { textAlign: "right" })} disabled={!editor} onClick={() => editor?.chain().focus().setTextAlign("right").run()}>
          <AlignRight className="h-3.5 w-3.5" />
        </Btn>

        <Sep />

        <Btn title="Insert image" disabled={!editor || requestUploadUrl.isPending} onClick={() => fileInputRef.current?.click()}>
          <ImagePlus className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Insert video or YouTube" disabled={!editor} onClick={handleVideoInsert}>
          <Video className="h-3.5 w-3.5" />
        </Btn>

        <Sep />

        <Btn title="Undo" disabled={!editor} onClick={() => editor?.chain().focus().undo().run()}>
          <Undo2 className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Redo" disabled={!editor} onClick={() => editor?.chain().focus().redo().run()}>
          <Redo2 className="h-3.5 w-3.5" />
        </Btn>

        {requestUploadUrl.isPending && (
          <span className="ml-2 text-[10px] text-muted-foreground animate-pulse">Uploading…</span>
        )}
      </div>

      {/* Editor area */}
      <div className="bg-background min-h-[220px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
