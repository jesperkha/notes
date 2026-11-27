import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Form, useActionData, useFetcher, useLoaderData } from "react-router";
import {
  ArrowLeft,
  ArrowDownWideNarrow,
  Archive,
  ArchiveRestore,
  Check,
  ChevronDown,
  Clock3,
  CircleHelp,
  Eye,
  FileText,
  Filter,
  LogOut,
  Pencil,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { MarkdownContent } from "../components/markdown-content";
import type { Route } from "./+types/home";
import { action as homeAction, loader as homeLoader } from "./home.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

export function loader(args: LoaderFunctionArgs) {
  return homeLoader(args);
}

export function action(args: ActionFunctionArgs) {
  return homeAction(args);
}

const MarkdownEditor = lazy(() => import("../components/markdown-editor"));

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  editedAt: string;
  favorite: boolean;
  archived: boolean;
  type: number;
};

type SortMode = "edited" | "created";
type FilterMode = "all" | "favorites" | "archived";

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
    { title: "Notes" },
    {
      name: "description",
      content: "A quiet place for everything worth keeping.",
    },
  ];
}

function LoginPage({ error }: { error?: string }) {
  return (
    <main className="login-shell">
      <Form method="post" className="login-card">
        <input type="hidden" name="intent" value="login" />
        <h1>Notes</h1>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
        />
        {error ? (
          <p className="login-error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit">Sign in</button>
      </Form>
    </main>
  );
}

export default function Home() {
  const { notes: loadedNotes } = useLoaderData<typeof loader>();
  const notes = loadedNotes ?? [];
  const actionData = useActionData<typeof action>();
  const createFetcher = useFetcher<typeof action>();
  const saveFetcher = useFetcher<typeof action>();
  const favoriteFetcher = useFetcher<typeof action>();
  const archiveFetcher = useFetcher<typeof action>();
  const deleteFetcher = useFetcher<typeof action>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchHighlightId, setSearchHighlightId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("edited");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const filterControlRef = useRef<HTMLDivElement>(null);
  const sortControlRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const noteListRef = useRef<HTMLDivElement>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const loginError = actionData && "error" in actionData ? actionData.error : undefined;

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
    if (!filterMenuOpen) return;
    function closeFilterMenu(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        filterControlRef.current &&
        !filterControlRef.current.contains(event.target)
      ) {
        setFilterMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeFilterMenu);
    return () => document.removeEventListener("pointerdown", closeFilterMenu);
  }, [filterMenuOpen]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const result = createFetcher.data;
    if (!result) return;
    if ("error" in result) {
      showToast(result.error);
      return;
    }
    if (!("noteId" in result)) return;
    setSelectedId(result.noteId);
    setDraftTitle("Untitled note");
    setDraftContent("");
    setIsEditing(true);
    setFilterMode("all");
    showToast("New note created");
  }, [createFetcher.data]);

  useEffect(() => {
    const result = saveFetcher.data;
    if (!result) return;
    if ("error" in result) {
      setIsEditing(true);
      showToast(result.error);
    } else if (result.intent === "save") showToast("Changes saved");
  }, [saveFetcher.data]);

  useEffect(() => {
    const result = favoriteFetcher.data;
    if (result && "error" in result) showToast(result.error);
  }, [favoriteFetcher.data]);

  useEffect(() => {
    const result = archiveFetcher.data;
    if (!result) return;
    if ("error" in result) {
      showToast(result.error);
    } else if (result.intent === "archive" || result.intent === "unarchive") {
      setSelectedId(null);
      setIsEditing(false);
      showToast(result.intent === "archive" ? "Note archived" : "Note unarchived");
    }
  }, [archiveFetcher.data]);

  useEffect(() => {
    const result = deleteFetcher.data;
    if (!result) return;
    if ("error" in result) showToast(result.error);
    else if (result.intent === "delete") showToast("Note deleted");
  }, [deleteFetcher.data]);

  const visibleNotes = useMemo(() => {
    const query = search.trim();
    return notes
      .filter((note) => {
        if (filterMode === "archived") return note.archived;
        if (note.archived) return false;
        return filterMode === "all" || note.favorite;
      })
      .map((note) => ({
        note,
        score: query
          ? Math.max(fuzzyScore(query, note.title) * 2, fuzzyScore(query, note.content))
          : 0,
      }))
      .filter(({ score }) => !query || score > 0)
      .sort((a, b) => {
        if (query && a.score !== b.score) return b.score - a.score;
        if (!query && filterMode === "all" && a.note.favorite !== b.note.favorite) {
          return Number(b.note.favorite) - Number(a.note.favorite);
        }
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
    createFetcher.submit({ intent: "create" }, { method: "post" });
  }

  function saveNote() {
    if (!selectedNote) return;
    saveFetcher.submit(
      {
        intent: "save",
        id: selectedNote.id,
        title: draftTitle,
        content: draftContent,
      },
      { method: "post" },
    );
    setIsEditing(false);
  }

  function toggleFavorite(noteId: string) {
    favoriteFetcher.submit({ intent: "favorite", id: noteId }, { method: "post" });
  }

  function toggleArchive(note: Note) {
    archiveFetcher.submit(
      {
        intent: note.archived ? "unarchive" : "archive",
        id: note.id,
        ...(isEditing ? { title: draftTitle, content: draftContent } : {}),
      },
      { method: "post" },
    );
  }

  function selectFilter(mode: FilterMode) {
    setFilterMode(mode);
    setFilterMenuOpen(false);
  }

  function requestDelete(noteId: string) {
    setDeleteTargetId(noteId);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteFetcher.submit({ intent: "delete", id: deleteTarget.id }, { method: "post" });
    if (selectedId === deleteTarget.id) {
      setSelectedId(null);
      setIsEditing(false);
    }
    setDeleteTargetId(null);
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
        event.stopPropagation();
        saveNote();
        return;
      }

      if (event.key === "Escape" && !isEditing) {
        event.preventDefault();
        if (helpOpen) setHelpOpen(false);
        else if (deleteTarget) setDeleteTargetId(null);
        else if (filterMenuOpen) setFilterMenuOpen(false);
        else if (sortMenuOpen) setSortMenuOpen(false);
        else if (selectedNote) backToList();
        return;
      }

      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.isContentEditable || target.closest("input, textarea, select"));
      if (isTyping || helpOpen || deleteTarget || filterMenuOpen || sortMenuOpen) return;

      const isNextNoteKey = event.key === "ArrowDown" || event.key === "j";
      const isPreviousNoteKey = event.key === "ArrowUp" || event.key === "k";
      if (
        !isEditing &&
        !search.trim() &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey &&
        (isNextNoteKey || isPreviousNoteKey)
      ) {
        const selectedIndex = visibleNotes.findIndex((note) => note.id === selectedId);
        const nextIndex =
          selectedIndex < 0
            ? isNextNoteKey
              ? 0
              : visibleNotes.length - 1
            : selectedIndex + (isNextNoteKey ? 1 : -1);
        const note = visibleNotes[nextIndex];
        if (note) {
          event.preventDefault();
          openNote(note);
        }
        return;
      }

      if (
        !isEditing &&
        !search.trim() &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        /^[1-9]$/.test(event.key)
      ) {
        const note = visibleNotes[Number(event.key) - 1];
        if (note) {
          event.preventDefault();
          openNote(note);
        }
      } else if (event.key === "/") {
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

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [
    deleteTarget,
    draftContent,
    draftTitle,
    filterMenuOpen,
    helpOpen,
    isEditing,
    search,
    selectedId,
    selectedNote,
    sortMenuOpen,
    visibleNotes,
  ]);

  if (!loadedNotes) return <LoginPage error={loginError} />;

  return (
    <main className={`app-shell ${selectedNote ? "has-selected-note" : ""}`}>
      <section className="notes-panel">
        <div className="list-heading">
          <div className="list-heading-title">
            <h1>
              {filterMode === "favorites"
                ? "Favorites"
                : filterMode === "archived"
                  ? "Archived"
                  : "Notes"}
            </h1>
            <button
              className="help-title-button"
              aria-label="Keyboard shortcuts"
              onClick={() => setHelpOpen(true)}
            >
              <CircleHelp size={17} strokeWidth={1.7} />
            </button>
          </div>
          <div className="list-heading-actions">
            <Form method="post">
              <input type="hidden" name="intent" value="logout" />
              <button
                className="logout-button"
                type="submit"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </Form>
          </div>
        </div>
        <div className="search-row">
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
          <button
            className="new-button"
            onClick={createNote}
            disabled={createFetcher.state !== "idle"}
          >
            <Pencil size={14} strokeWidth={2} />
            <span>New</span>
          </button>
        </div>
        <div className="list-toolbar">
          <span>{visibleNotes.length} notes</span>
          <div className="list-toolbar-controls">
            <div className="filter-control" ref={filterControlRef}>
              <button
                className="sort-button"
                onClick={() => {
                  setFilterMenuOpen((open) => !open);
                  setSortMenuOpen(false);
                }}
                aria-label="Filter notes"
                aria-expanded={filterMenuOpen}
              >
                <Filter size={15} />
                <span>
                  {filterMode === "all"
                    ? "All"
                    : filterMode === "favorites"
                      ? "Favorites"
                      : "Archived"}
                </span>
                <ChevronDown size={13} />
              </button>
              {filterMenuOpen && (
                <div className="sort-menu">
                  <button aria-pressed={filterMode === "all"} onClick={() => selectFilter("all")}>
                    <FileText size={14} />
                    <span>All notes</span>
                    <span className="sort-option-check">
                      {filterMode === "all" && <Check size={14} />}
                    </span>
                  </button>
                  <button
                    aria-pressed={filterMode === "favorites"}
                    onClick={() => selectFilter("favorites")}
                  >
                    <Star size={14} />
                    <span>Favorites</span>
                    <span className="sort-option-check">
                      {filterMode === "favorites" && <Check size={14} />}
                    </span>
                  </button>
                  <button
                    aria-pressed={filterMode === "archived"}
                    onClick={() => selectFilter("archived")}
                  >
                    <Archive size={14} />
                    <span>Archived</span>
                    <span className="sort-option-check">
                      {filterMode === "archived" && <Check size={14} />}
                    </span>
                  </button>
                </div>
              )}
            </div>
            <div className="sort-control" ref={sortControlRef}>
              <button
                className="sort-button"
                onClick={() => {
                  setSortMenuOpen((open) => !open);
                  setFilterMenuOpen(false);
                }}
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
            <aside
              className={`note-actions ${isEditing ? "is-editing" : ""}`}
              aria-label="Note actions"
            >
              <button
                className="note-toolbar-button mobile-back-button"
                aria-label="Back to notes"
                onClick={backToList}
              >
                <ArrowLeft size={17} />
              </button>
              {!selectedNote.archived && (
                <button
                  className={`note-toolbar-button favorite-toggle ${selectedNote.favorite ? "is-favorite" : ""}`}
                  aria-label={selectedNote.favorite ? "Remove favorite" : "Add favorite"}
                  aria-pressed={selectedNote.favorite}
                  disabled={favoriteFetcher.state !== "idle"}
                  onClick={() => toggleFavorite(selectedNote.id)}
                >
                  <Star size={17} fill={selectedNote.favorite ? "currentColor" : "none"} />
                </button>
              )}
              <button
                className="note-toolbar-button edit-toggle-button"
                aria-label={isEditing ? "View note" : "Edit note"}
                title={isEditing ? "View note" : "Edit note"}
                disabled={saveFetcher.state !== "idle"}
                onClick={isEditing ? saveNote : beginEdit}
              >
                {isEditing ? <Eye size={16} /> : <Pencil size={15} />}
              </button>
              <button
                className="note-toolbar-button archive-toggle-button"
                aria-label={selectedNote.archived ? "Unarchive note" : "Archive note"}
                title={selectedNote.archived ? "Unarchive note" : "Archive note"}
                disabled={archiveFetcher.state !== "idle"}
                onClick={() => toggleArchive(selectedNote)}
              >
                {selectedNote.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
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
              <button
                className="confirm-delete-button"
                onClick={confirmDelete}
                disabled={deleteFetcher.state !== "idle"}
              >
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
                  <kbd>1-9</kbd>
                </dt>
                <dd>Open note by list position</dd>
              </div>
              <div>
                <dt>
                  <kbd>↑</kbd>
                  <span>/</span>
                  <kbd>K</kbd>
                </dt>
                <dd>Previous note</dd>
              </div>
              <div>
                <dt>
                  <kbd>↓</kbd>
                  <span>/</span>
                  <kbd>J</kbd>
                </dt>
                <dd>Next note</dd>
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
                <dd>Close popup or return to notes</dd>
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
