import parse, { domToReact, htmlToDOM, Element, Text, type DOMNode, type HTMLReactParserOptions } from "html-react-parser";
import { createElement, Fragment } from "react";

const blocked = new Set(["script", "style", "iframe", "object", "embed", "svg", "math", "form", "input", "button", "template"]);
const inlineTags = new Set(["strong", "b", "em", "i", "u", "s", "br", "sub", "sup"]);
const blockTags = new Set(["p", "ul", "ol", "li", "blockquote"]);

export function aboutPlainText(value: string): string {
  const text = (nodes: DOMNode[]): string => nodes.map((node) => {
    if (node instanceof Text) return node.data;
    if (!(node instanceof Element) || blocked.has(node.name)) return "";
    return `${text(node.children as DOMNode[])}${blockTags.has(node.name) || node.name === "div" || node.name === "br" ? " " : ""}`;
  }).join("");
  return text(htmlToDOM(value)).replace(/\s+/g, " ").trim();
}

export function AboutRichText({ value, inline = false, className = "" }: { value: string; inline?: boolean; className?: string }) {
  const options: HTMLReactParserOptions = {
    replace(node) {
      if (!(node instanceof Element)) return;
      if (blocked.has(node.name)) return <Fragment />;
      const children = domToReact(node.children as DOMNode[], options);
      if (inlineTags.has(node.name)) return createElement(node.name, {}, children);
      if (!inline && blockTags.has(node.name)) return createElement(node.name, {}, children);
      // Discard editor layout wrappers, styles and attributes, retaining their content.
      return <Fragment>{children}{inline && (blockTags.has(node.name) || node.name === "div") ? " " : null}</Fragment>;
    },
  };
  const Tag = inline ? "span" : "div";
  return <Tag className={`break-words whitespace-pre-line [&_p+p]:mt-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:ps-6 [&_li+li]:mt-2 [&_blockquote]:border-s-2 [&_blockquote]:border-accent [&_blockquote]:ps-4 ${className}`}>{parse(value, options)}</Tag>;
}