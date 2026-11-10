import parse, { domToReact, htmlToDOM, Element, type DOMNode, type HTMLReactParserOptions } from "html-react-parser";
import { createElement, Fragment } from "react";

const blocked = new Set(["script", "style", "iframe", "object", "embed", "svg", "math", "form", "input", "button", "template"]);
const inlineTags = new Set(["strong", "b", "em", "i", "u", "s", "br", "sub", "sup"]);
const blockTags = new Set(["p", "ul", "ol", "li", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6"]);

export function aboutPlainText(value: string): string {
  const text = (nodes: DOMNode[]): string => nodes.map((node) => {
    if (node.type === "text" && "data" in node) return node.data;
    if (!("name" in node) || blocked.has((node as any).name)) return "";
    const el = node as any;
    const childText = Array.isArray(el.children) ? text(el.children) : "";
    return `${childText}${blockTags.has(el.name) || el.name === "div" || el.name === "br" ? " " : ""}`;
  }).join("");
  return text(htmlToDOM(value)).replace(/\s+/g, " ").trim();
}

export function AboutRichText({ value, inline = false, className = "" }: { value: string; inline?: boolean; className?: string }) {
  const options: HTMLReactParserOptions = {
    replace(node) {
      if (!("name" in node)) return;
      const el = node as Element;
      if (blocked.has(el.name)) return <Fragment />;
      const children = domToReact(el.children as DOMNode[], options);
      if (inlineTags.has(el.name)) return createElement(el.name, {}, children);
      if (!inline && blockTags.has(el.name)) return createElement(el.name, {}, children);
      if (!inline && el.name === "div") return <div>{children}</div>;
      // Discard editor layout wrappers, styles and attributes, retaining their content.
      return <Fragment>{children}{inline && (blockTags.has(el.name) || el.name === "div") ? " " : null}</Fragment>;
    },
  };
  const Tag = inline ? "span" : "div";
  return <Tag dir="auto" className={`min-w-0 break-words whitespace-pre-line [&_p]:mb-4 [&_p:last-child]:mb-0 [&_div+div]:mt-4 [&_strong]:font-semibold [&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:ps-6 [&_li+li]:mt-2 [&_blockquote]:border-s-2 [&_blockquote]:border-accent [&_blockquote]:ps-4 ${className}`}>{parse(value, options)}</Tag>;
}