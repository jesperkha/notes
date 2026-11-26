import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowDownWideNarrow,
  Check,
  ChevronDown,
  Clock3,
  CircleHelp,
  Eye,
  FileText,
  Filter,
  Pencil,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { MarkdownContent } from "../components/markdown-content";
import type { Route } from "./+types/home";

const MarkdownEditor = lazy(() => import("../components/markdown-editor"));

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  editedAt: string;
  favorite: boolean;
  type: 0;
};

const initialNotes: Note[] = [
  {
    id: "field-notes",
    title: "Field notes from the coast",
    content:
      "## Sunday, 18 August\n\nThe path opens up just past the old boathouse. The wind was **strong from the west**, but the water stayed bright and glassy.\n\n> A place can feel familiar before you know its name.\n\n- Bring the small film camera next time\n- Check the tide before leaving\n- Ask Liv about the old lighthouse",
    createdAt: "2026-08-16T10:22:00",
    editedAt: "2026-08-18T16:42:00",
    favorite: true,
    type: 0,
  },
  {
    id: "reading-list",
    title: "Books for the next long weekend",
    content:
      "A short list for slow mornings and train rides.\n\n1. *The Summer Book* — Tove Jansson\n2. *Pilgrim at Tinker Creek* — Annie Dillard\n3. *A Field Guide to Getting Lost* — Rebecca Solnit\n\nStart with the one that has the most dog-eared pages.",
    createdAt: "2026-08-12T09:10:00",
    editedAt: "2026-08-17T11:05:00",
    favorite: false,
    type: 0,
  },
  {
    id: "coffee",
    title: "Coffee ratio — V60",
    content:
      "## House recipe\n\n- Coffee: **18 g**, medium-fine\n- Water: **300 g** at 94°C\n- Bloom: 45 g for 35 seconds\n- Pour slowly in circles to 300 g\n- Total brew time: 2:45–3:15\n\nTry a slightly coarser grind if it tastes dry.",
    createdAt: "2026-08-09T14:28:00",
    editedAt: "2026-08-15T08:30:00",
    favorite: true,
    type: 0,
  },
  {
    id: "studio",
    title: "Studio refresh",
    content:
      "### To figure out\n\n- [ ] Move the desk closer to the window\n- [ ] Replace the warm bulbs with neutral ones\n- [x] Measure the wall for shelves\n\nKeep the wood desk. Everything else is flexible.",
    createdAt: "2026-08-10T12:15:00",
    editedAt: "2026-08-13T17:20:00",
    favorite: false,
    type: 0,
  },
  {
    id: "weekend",
    title: "A few things for Saturday",
    content:
      "Walk to the market before it gets busy. Pick up peaches, rye bread, and the good olive oil. Leave the afternoon open.",
    createdAt: "2026-08-05T19:40:00",
    editedAt: "2026-08-11T20:12:00",
    favorite: false,
    type: 0,
  },
  {
    id: "ideas",
    title: "Small things worth remembering",
    content:
      "# Small things worth remembering\n\n## The quiet details\n\n### Places\n\nThe sound of rain on the greenhouse roof. The bakery that opens before sunrise. How much better a room feels with one empty wall.\n\nRead [the field notes](https://example.com/field-notes) or revisit https://example.com/places.",
    createdAt: "2026-08-01T08:12:00",
    editedAt: "2026-08-08T09:50:00",
    favorite: false,
    type: 0,
  },
  {
    id: "garden",
    title: "What to plant in autumn",
    content:
      "A few bulbs for the terrace boxes: white tulips, alliums, and crocus. Leave space for thyme along the edge.",
    createdAt: "2026-07-28T15:40:00",
    editedAt: "2026-08-06T12:15:00",
    favorite: false,
    type: 0,
  },
  {
    id: "packing",
    title: "Overnight bag",
    content:
      "Light rain jacket, paperback, charger, notebook, clean socks. Remember the small camera.",
    createdAt: "2026-07-20T08:22:00",
    editedAt: "2026-08-04T17:05:00",
    favorite: false,
    type: 0,
  },
  {
    id: "lunch",
    title: "Lunch for friends",
    content:
      "Roasted tomatoes and white beans with sourdough. Make the lemon dressing just before serving.",
    createdAt: "2026-07-18T18:32:00",
    editedAt: "2026-08-02T10:28:00",
    favorite: false,
    type: 0,
  },
  {
    id: "studio-ideas",
    title: "A few ideas for the studio",
    content:
      "Keep the table clear. Add a low lamp in the corner. Use the small shelves for the things I reach for every day.",
    createdAt: "2026-07-11T13:08:00",
    editedAt: "2026-07-30T09:10:00",
    favorite: false,
    type: 0,
  },
];

const mockApi = {
  createNote(): Note {
    const now = new Date().toISOString();
    return {
      id: `note-${Date.now()}`,
      title: "Untitled note",
      content: "",
      createdAt: now,
      editedAt: now,
      favorite: false,
      type: 0,
    };
  },
  saveNote(note: Note, title: string, content: string): Note {
    return {
      ...note,
      title: title.trim() || "Untitled note",
      content,
      editedAt: new Date().toISOString(),
    };
  },
  toggleFavorite(note: Note): Note {
    return { ...note, favorite: !note.favorite };
  },
  deleteNote(notes: Note[], noteId: string): Note[] {
    return notes.filter((note) => note.id !== noteId);
  },
};

type SortMode = "edited" | "created";
type FilterMode = "all" | "favorites";

function fuzzyScore(query: string, value: string) {
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedValue = value.toLowerCase();
  if (!normalizedQuery) return 1;
  if (normalizedValue.includes(normalizedQuery)) {
    return 100 - normalizedValue.indexOf(normalizedQuery);
  }

  let queryIndex = 0;
  let streak = 0;
  let score = 0;
  for (const [index, character] of [...normalizedValue].entries()) {
    if (character === normalizedQuery[queryIndex]) {
      streak += 1;
      score += 1 + streak * 2 - index * 0.01;
      queryIndex += 1;
      if (queryIndex === normalizedQuery.length) return score;
    } else {
      streak = 0;
    }
  }
  return -1;
}

function formatRelativeDate(date: string) {
  const elapsed = Date.now() - new Date(date).getTime();
  const days = Math.floor(elapsed / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(date));
}

function formatFullDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Notes — Still" },
    {
      name: "description",
      content: "A quiet place for everything worth keeping.",
    },
  ];
}

export default function Home() {
  const [notes, setNotes] = useState(initialNotes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchHighlightId, setSearchHighlightId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("edited");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const sortControlRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const noteListRef = useRef<HTMLDivElement>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const selectedNote = notes.find((note) => note.id === selectedId) ?? null;
  const deleteTarget = notes.find((note) => note.id === deleteTargetId) ?? null;

  function showToast(message: string) {
    setToast(message);
  }

  function updateSearch(value: string) {
    setSearch(value);
    setSearchHighlightId(null);
    noteListRef.current?.scrollTo({ top: 0 });
  }

  useEffect(() => {
    if (!sortMenuOpen) return;
    function closeSortMenu(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        sortControlRef.current &&
        !sortControlRef.current.contains(event.target)
      ) {
        setSortMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeSortMenu);
    return () => document.removeEventListener("pointerdown", closeSortMenu);
  }, [sortMenuOpen]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const visibleNotes = useMemo(() => {
    const query = search.trim();
    return notes
      .filter((note) => filterMode === "all" || note.favorite)
      .map((note) => ({
        note,
        score: query
          ? Math.max(fuzzyScore(query, note.title) * 2, fuzzyScore(query, note.content))
          : 0,
      }))
      .filter(({ score }) => !query || score > 0)
      .sort((a, b) => {
        if (query && a.score !== b.score) return b.score - a.score;
        const key = sortMode === "edited" ? "editedAt" : "createdAt";
        return new Date(b.note[key]).getTime() - new Date(a.note[key]).getTime();
      })
      .map(({ note }) => note);
  }, [filterMode, notes, search, sortMode]);

  const highlightedId = search.trim()
    ? visibleNotes.some((note) => note.id === searchHighlightId)
      ? searchHighlightId
      : (visibleNotes[0]?.id ?? null)
    : selectedId;

  function openNote(note: Note) {
    if (search.trim()) setSearchHighlightId(note.id);
    if (selectedId === note.id) {
      if (isEditing) saveNote();
      return;
    }
    if (isEditing) saveNote();
    setSelectedId(note.id);
    setDraftTitle(note.title);
    setDraftContent(note.content);
    setIsEditing(false);
  }

  function backToList() {
    if (isEditing) saveNote();
    setSelectedId(null);
    setIsEditing(false);
  }

  function createNote() {
    if (isEditing) saveNote();
    const note = mockApi.createNote();
    setFilterMode("all");
    setNotes((current) => [note, ...current]);
    setSelectedId(note.id);
    setDraftTitle(note.title);
    setDraftContent(note.content);
    setIsEditing(true);
    showToast("New note created");
  }

  function saveNote() {
    if (!selectedNote) return;
    setNotes((current) =>
      current.map((note) =>
        note.id === selectedNote.id ? mockApi.saveNote(note, draftTitle, draftContent) : note,
      ),
    );
    setIsEditing(false);
    showToast("Changes saved");
  }

  function toggleFavorite(noteId: string) {
    setNotes((current) =>
      current.map((note) => (note.id === noteId ? mockApi.toggleFavorite(note) : note)),
    );
  }

  function requestDelete(noteId: string) {
    setDeleteTargetId(noteId);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    setNotes((current) => mockApi.deleteNote(current, deleteTarget.id));
    if (selectedId === deleteTarget.id) {
      setSelectedId(null);
      setIsEditing(false);
    }
    setDeleteTargetId(null);
    showToast("Note deleted");
  }

  function beginEdit() {
    if (!selectedNote) return;
    setDraftTitle(selectedNote.title);
    setDraftContent(selectedNote.content);
    setIsEditing(true);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s" && isEditing) {
        event.preventDefault();
        saveNote();
        return;
      }

      if (event.key === "/" && isEditing) {
        event.preventDefault();
        saveNote();
        return;
      }

      if (event.key === "Escape") {
        if (helpOpen) setHelpOpen(false);
        else if (deleteTarget) setDeleteTargetId(null);
        else if (sortMenuOpen) setSortMenuOpen(false);
        else if (isEditing) saveNote();
        return;
      }

      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.isContentEditable || target.closest("input, textarea, select"));
      if (isTyping || helpOpen || deleteTarget) return;

      if (event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
      } else if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        createNote();
      } else if (event.key.toLowerCase() === "e" && selectedNote && !isEditing) {
        event.preventDefault();
        beginEdit();
      } else if (event.key === "?") {
        event.preventDefault();
        setHelpOpen(true);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [deleteTarget, draftContent, draftTitle, helpOpen, isEditing, selectedNote, sortMenuOpen]);

  return (
    <main className={`app-shell ${selectedNote ? "has-selected-note" : ""}`}>
      <section className="notes-panel">
        <div className="list-heading">
          <div className="list-heading-title">
            <h1>{filterMode === "favorites" ? "Favorites" : "Notes"}</h1>
            <button
              className="help-title-button"
              aria-label="Keyboard shortcuts"
              onClick={() => setHelpOpen(true)}
            >
              <CircleHelp size={17} strokeWidth={1.7} />
            </button>
          </div>
          <button className="new-button" onClick={createNote}>
            <Pencil size={14} strokeWidth={2} />
            <span>New</span>
          </button>
        </div>
        <label className="search-field">
          <Search size={16} strokeWidth={1.8} />
          <input
            ref={searchInputRef}
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && visibleNotes[0]) {
                event.preventDefault();
                openNote(visibleNotes[0]);
                searchInputRef.current?.blur();
              }
            }}
            placeholder="Search notes"
            aria-label="Search notes"
          />
          {search ? (
            <button
              className="clear-search"
              onClick={() => updateSearch("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          ) : null}
        </label>
        <div className="list-toolbar">
          <span>{visibleNotes.length} notes</span>
          <div className="list-toolbar-controls">
            <button
              className={`favorite-filter-button ${filterMode === "favorites" ? "is-active" : ""}`}
              aria-label={filterMode === "favorites" ? "Show all notes" : "Show favorites only"}
              aria-pressed={filterMode === "favorites"}
              title={filterMode === "favorites" ? "Show all notes" : "Show favorites only"}
              onClick={() => setFilterMode((mode) => (mode === "all" ? "favorites" : "all"))}
            >
              <Star size={16} fill={filterMode === "favorites" ? "currentColor" : "none"} />
            </button>
            <div className="sort-control" ref={sortControlRef}>
              <button
                className="sort-button"
                onClick={() => setSortMenuOpen((open) => !open)}
                aria-expanded={sortMenuOpen}
              >
                <ArrowDownWideNarrow size={15} />
                <span>{sortMode === "edited" ? "Edited" : "Created"}</span>
                <ChevronDown size={13} />
              </button>
              {sortMenuOpen && (
                <div className="sort-menu">
                  <button
                    onClick={() => {
                      setSortMode("edited");
                      setSortMenuOpen(false);
                    }}
                  >
                    <span className="sort-option-icon">
                      <Clock3 size={14} />
                    </span>
                    <span>Date edited</span>
                    <span className="sort-option-check">
                      {sortMode === "edited" && <Check size={14} />}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setSortMode("created");
                      setSortMenuOpen(false);
                    }}
                  >
                    <span className="sort-option-icon">
                      <Filter size={14} />
                    </span>
                    <span>Date created</span>
                    <span className="sort-option-check">
                      {sortMode === "created" && <Check size={14} />}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="note-list" ref={noteListRef}>
          {visibleNotes.length ? (
            visibleNotes.map((note) => (
              <article
                key={note.id}
                className={`note-row ${highlightedId === note.id ? "selected" : ""}`}
              >
                <button className="note-open" onClick={() => openNote(note)}>
                  <span className="note-title">
                    <span>{note.title}</span>
                    {note.favorite && <Star className="row-star" size={12} fill="currentColor" />}
                  </span>
                  <span className="note-meta">
                    <span className="note-snippet">
                      {note.content
                        .replace(/[#>*_-]/g, "")
                        .replaceAll("[", "")
                        .replaceAll("]", "")
                        .slice(0, 62) || "No content"}
                    </span>
                    <span className="note-date">{formatRelativeDate(note.editedAt)}</span>
                  </span>
                </button>
                <button
                  className="row-delete"
                  aria-label={`Delete ${note.title}`}
                  onClick={() => requestDelete(note.id)}
                >
                  <Trash2 size={14} />
                </button>
              </article>
            ))
          ) : (
            <div className="empty-list">
              <Search size={19} />
              <p>No notes found</p>
              <span>Try a different search.</span>
            </div>
          )}
        </div>
      </section>

      <section className="workspace" aria-label="Note workspace">
        {selectedNote ? (
          <div className="note-workspace">
            <aside className="note-actions" aria-label="Note actions">
              <button
                className="note-toolbar-button mobile-back-button"
                aria-label="Back to notes"
                onClick={backToList}
              >
                <ArrowLeft size={17} />
              </button>
              <button
                className={`note-toolbar-button favorite-toggle ${selectedNote.favorite ? "is-favorite" : ""}`}
                aria-label={selectedNote.favorite ? "Remove favorite" : "Add favorite"}
                aria-pressed={selectedNote.favorite}
                onClick={() => toggleFavorite(selectedNote.id)}
              >
                <Star size={17} fill={selectedNote.favorite ? "currentColor" : "none"} />
              </button>
              <button
                className="note-toolbar-button"
                aria-label={isEditing ? "View note" : "Edit note"}
                title={isEditing ? "View note" : "Edit note"}
                onClick={isEditing ? saveNote : beginEdit}
              >
                {isEditing ? <Eye size={16} /> : <Pencil size={15} />}
              </button>
              <button
                className="note-toolbar-button delete-note-button"
                aria-label="Delete note"
                onClick={() => requestDelete(selectedNote.id)}
              >
                <Trash2 size={15} />
              </button>
            </aside>
            <div className="note-document">
              {isEditing ? (
                <input
                  className="title-input"
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  aria-label="Note title"
                  placeholder="Untitled note"
                />
              ) : (
                <h1 className="document-title">{selectedNote.title}</h1>
              )}
              <div className="note-metadata">
                <span>Created {formatFullDate(selectedNote.createdAt)}</span>
                <span className="metadata-dot">·</span>
                <span>Edited {formatFullDate(selectedNote.editedAt)}</span>
              </div>
              <div className={`note-content-area ${isEditing ? "is-editing" : ""}`}>
                {isEditing ? (
                  <Suspense fallback={<div className="editor-loading">Loading editor…</div>}>
                    <MarkdownEditor value={draftContent} onChange={setDraftContent} />
                  </Suspense>
                ) : (
                  <MarkdownContent source={selectedNote.content} />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-workspace">
            <FileText size={22} strokeWidth={1.4} />
            <span>Select a note</span>
          </div>
        )}
      </section>

      {deleteTarget && (
        <div className="confirm-backdrop">
          <section
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            aria-describedby="delete-description"
          >
            <h2 id="delete-title">Delete note?</h2>
            <p id="delete-description">“{deleteTarget.title}” will be permanently removed.</p>
            <div className="confirm-actions">
              <button className="cancel-button" onClick={() => setDeleteTargetId(null)}>
                Cancel
              </button>
              <button className="confirm-delete-button" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </section>
        </div>
      )}
      {helpOpen && (
        <div
          className="help-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setHelpOpen(false);
          }}
        >
          <section
            className="shortcut-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
          >
            <header className="shortcut-header">
              <h2 id="shortcuts-title">Keyboard shortcuts</h2>
              <button
                className="shortcut-close"
                aria-label="Close keyboard shortcuts"
                onClick={() => setHelpOpen(false)}
              >
                <X size={16} />
              </button>
            </header>
            <dl className="shortcut-list">
              <div>
                <dt>
                  <kbd>/</kbd>
                </dt>
                <dd>Search notes</dd>
              </div>
              <div>
                <dt>
                  <kbd>N</kbd>
                </dt>
                <dd>New note</dd>
              </div>
              <div>
                <dt>
                  <kbd>E</kbd>
                </dt>
                <dd>Edit selected note</dd>
              </div>
              <div>
                <dt>
                  <kbd>Ctrl</kbd>
                  <span>+</span>
                  <kbd>S</kbd>
                </dt>
                <dd>Save and view</dd>
              </div>
              <div>
                <dt>
                  <kbd>?</kbd>
                </dt>
                <dd>Show keyboard shortcuts</dd>
              </div>
              <div>
                <dt>
                  <kbd>Esc</kbd>
                </dt>
                <dd>Save and view or dismiss dialog</dd>
              </div>
            </dl>
          </section>
        </div>
      )}
      {toast && (
        <div className="toast">
          <Check size={14} />
          {toast}
        </div>
      )}
    </main>
  );
}
