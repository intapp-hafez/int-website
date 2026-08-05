import React, { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Quote,
  Minus,
  Code,
  Undo,
  Redo,
  RemoveFormatting,
  Type,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  dir?: "ltr" | "rtl" | "auto";
  placeholder?: string;
  minHeight?: string;
  className?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  dir = "auto",
  placeholder = "Write content here...",
  minHeight = "180px",
  className,
  disabled = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [htmlMode, setHtmlMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectionActive, setSelectionActive] = useState<Record<string, boolean>>({});
  const isUpdatingRef = useRef(false);

  // Sync value from outside if not actively focused or edited
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== (value || "")) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value]);

  const updateSelectionState = () => {
    try {
      setSelectionActive({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikethrough: document.queryCommandState("strikethrough"),
        unorderedList: document.queryCommandState("insertUnorderedList"),
        orderedList: document.queryCommandState("insertOrderedList"),
        justifyLeft: document.queryCommandState("justifyLeft"),
        justifyCenter: document.queryCommandState("justifyCenter"),
        justifyRight: document.queryCommandState("justifyRight"),
        justifyFull: document.queryCommandState("justifyFull"),
      });
    } catch {}
  };

  const exec = (command: string, val: string | undefined = undefined) => {
    if (disabled || htmlMode) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, val);
    handleInput();
    updateSelectionState();
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    isUpdatingRef.current = true;
    const currentHtml = editorRef.current.innerHTML;
    // Normalize empty paragraphs
    const cleaned = currentHtml === "<p><br></p>" || currentHtml === "<br>" ? "" : currentHtml;
    onChange(cleaned);
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 50);
  };

  const insertLink = () => {
    if (disabled || htmlMode) return;
    const url = prompt(dir === "rtl" ? "أدخل رابط URL:" : "Enter URL:", "https://");
    if (url) {
      exec("createLink", url);
    }
  };

  const formatBlock = (tag: string) => {
    exec("formatBlock", `<${tag}>`);
  };

  const wordsCount = (value || "").replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  const charsCount = (value || "").replace(/<[^>]*>/g, "").length;

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-card text-card-foreground shadow-xs transition-all flex flex-col focus-within:ring-2 focus-within:ring-ring/40 focus-within:border-ring",
        isFullscreen && "fixed inset-4 z-50 shadow-2xl bg-background border-2",
        className,
      )}
      dir={dir}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b bg-muted/40 text-muted-foreground rounded-t-md select-none">
        {/* Headings */}
        <div className="flex items-center gap-0.5 pe-1 border-e me-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs font-semibold hover:bg-accent/20 hover:text-accent"
            onClick={() => formatBlock("p")}
            title={dir === "rtl" ? "فقرة عادية" : "Normal Paragraph"}
          >
            <Type className="h-3.5 w-3.5 me-1" />
            <span className="text-[11px]">P</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-accent/20 hover:text-accent"
            onClick={() => formatBlock("h2")}
            title={dir === "rtl" ? "عنوان رئيسي H2" : "Heading 2"}
          >
            <Heading1 className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-accent/20 hover:text-accent"
            onClick={() => formatBlock("h3")}
            title={dir === "rtl" ? "عنوان فرعي H3" : "Heading 3"}
          >
            <Heading2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-accent/20 hover:text-accent"
            onClick={() => formatBlock("h4")}
            title={dir === "rtl" ? "عنوان جانبي H4" : "Heading 4"}
          >
            <Heading3 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Basic Styles */}
        <div className="flex items-center gap-0.5 pe-1 border-e me-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 hover:bg-accent/20 hover:text-accent",
              selectionActive.bold && "bg-accent/20 text-accent font-bold",
            )}
            onClick={() => exec("bold")}
            title={dir === "rtl" ? "عريض (Ctrl+B)" : "Bold (Ctrl+B)"}
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 hover:bg-accent/20 hover:text-accent",
              selectionActive.italic && "bg-accent/20 text-accent",
            )}
            onClick={() => exec("italic")}
            title={dir === "rtl" ? "مائل (Ctrl+I)" : "Italic (Ctrl+I)"}
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 hover:bg-accent/20 hover:text-accent",
              selectionActive.underline && "bg-accent/20 text-accent",
            )}
            onClick={() => exec("underline")}
            title={dir === "rtl" ? "تسطير (Ctrl+U)" : "Underline (Ctrl+U)"}
          >
            <Underline className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 hover:bg-accent/20 hover:text-accent",
              selectionActive.strikethrough && "bg-accent/20 text-accent",
            )}
            onClick={() => exec("strikethrough")}
            title={dir === "rtl" ? "يتوسطه خط" : "Strikethrough"}
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 pe-1 border-e me-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 hover:bg-accent/20 hover:text-accent",
              selectionActive.justifyLeft && "bg-accent/20 text-accent",
            )}
            onClick={() => exec("justifyLeft")}
            title={dir === "rtl" ? "محاذاة لليسار" : "Align Left"}
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 hover:bg-accent/20 hover:text-accent",
              selectionActive.justifyCenter && "bg-accent/20 text-accent",
            )}
            onClick={() => exec("justifyCenter")}
            title={dir === "rtl" ? "توسيط" : "Align Center"}
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 hover:bg-accent/20 hover:text-accent",
              selectionActive.justifyRight && "bg-accent/20 text-accent",
            )}
            onClick={() => exec("justifyRight")}
            title={dir === "rtl" ? "محاذاة لليمين" : "Align Right"}
          >
            <AlignRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 hover:bg-accent/20 hover:text-accent",
              selectionActive.justifyFull && "bg-accent/20 text-accent",
            )}
            onClick={() => exec("justifyFull")}
            title={dir === "rtl" ? "ضبط المحاذاة" : "Justify"}
          >
            <AlignJustify className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center gap-0.5 pe-1 border-e me-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 hover:bg-accent/20 hover:text-accent",
              selectionActive.unorderedList && "bg-accent/20 text-accent",
            )}
            onClick={() => exec("insertUnorderedList")}
            title={dir === "rtl" ? "قائمة نقطية" : "Bullet List"}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 hover:bg-accent/20 hover:text-accent",
              selectionActive.orderedList && "bg-accent/20 text-accent",
            )}
            onClick={() => exec("insertOrderedList")}
            title={dir === "rtl" ? "قائمة رقمية" : "Numbered List"}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-accent/20 hover:text-accent"
            onClick={() => formatBlock("blockquote")}
            title={dir === "rtl" ? "اقتباس" : "Quote Block"}
          >
            <Quote className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-accent/20 hover:text-accent"
            onClick={() => exec("insertHorizontalRule")}
            title={dir === "rtl" ? "فاصل أفقي" : "Horizontal Rule"}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Links & Clear */}
        <div className="flex items-center gap-0.5 pe-1 border-e me-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-accent/20 hover:text-accent"
            onClick={insertLink}
            title={dir === "rtl" ? "إدراج رابط" : "Insert Link"}
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-accent/20 hover:text-accent"
            onClick={() => exec("unlink")}
            title={dir === "rtl" ? "إزالة الرابط" : "Remove Link"}
          >
            <Unlink className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-accent/20 hover:text-accent"
            onClick={() => exec("removeFormat")}
            title={dir === "rtl" ? "إزالة التنسيق" : "Clear Formatting"}
          >
            <RemoveFormatting className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pe-1 border-e me-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-accent/20 hover:text-accent"
            onClick={() => exec("undo")}
            title={dir === "rtl" ? "تراجع (Ctrl+Z)" : "Undo (Ctrl+Z)"}
          >
            <Undo className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-accent/20 hover:text-accent"
            onClick={() => exec("redo")}
            title={dir === "rtl" ? "إعادة (Ctrl+Y)" : "Redo (Ctrl+Y)"}
          >
            <Redo className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* HTML / Source Toggle & Fullscreen */}
        <div className="ms-auto flex items-center gap-1">
          <Button
            type="button"
            variant={htmlMode ? "secondary" : "ghost"}
            size="sm"
            className={cn("h-7 px-2 text-xs font-mono", htmlMode && "bg-accent text-accent-foreground")}
            onClick={() => setHtmlMode(!htmlMode)}
            title={dir === "rtl" ? "عرض كود HTML" : "HTML Source Code"}
          >
            <Code className="h-3.5 w-3.5 me-1" />
            <span className="text-[10px]">HTML</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? (dir === "rtl" ? "تصغير" : "Minimize") : dir === "rtl" ? "شاشة كاملة" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="relative flex-1">
        {htmlMode ? (
          <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            dir="ltr"
            placeholder="<p>Enter HTML markup directly...</p>"
            className="w-full h-full min-h-[180px] p-3 text-xs font-mono bg-muted/20 focus:outline-none resize-y"
            style={{ minHeight }}
            disabled={disabled}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleInput}
            onKeyUp={updateSelectionState}
            onMouseUp={updateSelectionState}
            dir={dir}
            data-placeholder={placeholder}
            style={{ minHeight }}
            className={cn(
              "w-full p-3.5 text-sm focus:outline-none overflow-y-auto leading-relaxed",
              "prose prose-sm dark:prose-invert max-w-none",
              "[&_p]:my-1.5 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:my-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:my-2 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:my-1.5",
              "[&_ul]:list-disc [&_ul]:ps-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:ps-5 [&_ol]:my-1.5",
              "[&_blockquote]:border-s-4 [&_blockquote]:border-accent [&_blockquote]:ps-3 [&_blockquote]:italic [&_blockquote]:my-2",
              "[&_hr]:my-3 [&_hr]:border-border",
              "[&_a]:text-accent [&_a]:underline",
              "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50 empty:before:pointer-events-none",
              disabled && "opacity-60 cursor-not-allowed",
            )}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 text-[11px] text-muted-foreground border-t bg-muted/20 select-none">
        <div className="flex items-center gap-2">
          <span>{dir === "rtl" ? "الاتجاه: من اليمين لليسار (RTL)" : "Direction: Left-to-Right (LTR)"}</span>
          {htmlMode && <span className="text-accent font-medium">{dir === "rtl" ? "وضع تحرير HTML" : "HTML Mode"}</span>}
        </div>
        <div className="flex items-center gap-3">
          <span>{wordsCount} {dir === "rtl" ? "كلمة" : "words"}</span>
          <span>{charsCount} {dir === "rtl" ? "حرف" : "chars"}</span>
        </div>
      </div>
    </div>
  );
}
