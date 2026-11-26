import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import CodeMirror from "@uiw/react-codemirror";

const markdownHighlight = HighlightStyle.define([
  { tag: tags.link, color: "#c1cfb7" },
  { tag: tags.url, color: "#aebf9f" },
]);

const editorTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "transparent",
      color: "#d0d1ce",
      fontSize: "16px",
      height: "100%",
    },
    ".cm-content": {
      fontFamily: '"IBM Plex Mono", monospace',
      padding: "0",
      caretColor: "#c1cfb7",
    },
    ".cm-gutters": {
      display: "none",
    },
    ".cm-activeLine": {
      backgroundColor: "transparent",
    },
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-selectionBackground, ::selection": {
      backgroundColor: "#3b4437 !important",
    },
    ".cm-cursor": {
      borderLeftColor: "#c1cfb7",
    },
  },
  { dark: true },
);

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={[
        markdown(),
        syntaxHighlighting(markdownHighlight),
        EditorView.lineWrapping,
        editorTheme,
      ]}
      basicSetup={{
        lineNumbers: false,
        foldGutter: false,
        highlightActiveLine: false,
        highlightActiveLineGutter: false,
      }}
      className="code-editor"
      height="100%"
    />
  );
}
