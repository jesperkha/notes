import { and, desc, eq, sql } from "drizzle-orm";
import { data, redirect } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { createLoginSession, destroyLoginSession, getLoginSession } from "../auth.server";
import { db } from "../db.server";
import { notes } from "../db/schema";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function requireSession(request: Request) {
  if (!(await getLoginSession(request))) {
    return data({ error: "Please sign in again." }, { status: 401 });
  }
  return null;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getLoginSession(request);
  if (!session) return { notes: null };

  const storedNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.type, 0))
    .orderBy(desc(notes.editedAt));

  return {
    notes: storedNotes.map((note) => ({
      ...note,
      createdAt: note.createdAt.toISOString(),
      editedAt: note.editedAt.toISOString(),
    })),
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formString(formData, "intent");

  if (intent === "login") {
    const cookie = await createLoginSession(formString(formData, "password"));
    if (!cookie) return data({ error: "Incorrect password." }, { status: 401 });
    return redirect("/", { headers: { "Set-Cookie": cookie } });
  }

  if (intent === "logout") {
    const cookie = await destroyLoginSession(request);
    return redirect("/", { headers: { "Set-Cookie": cookie } });
  }

  const unauthenticated = await requireSession(request);
  if (unauthenticated) return unauthenticated;

  if (intent === "create") {
    const id = crypto.randomUUID();
    await db.insert(notes).values({ id, title: "Untitled note", content: "", type: 0 });
    return { intent, noteId: id };
  }

  const id = formString(formData, "id");
  if (!id) return data({ error: "A note ID is required." }, { status: 400 });

  if (intent === "save") {
    const [updated] = await db
      .update(notes)
      .set({
        title: formString(formData, "title").trim() || "Untitled note",
        content: formString(formData, "content"),
        editedAt: new Date(),
      })
      .where(and(eq(notes.id, id), eq(notes.type, 0)))
      .returning({ id: notes.id });
    if (!updated) return data({ error: "Note not found." }, { status: 404 });
    return { intent, noteId: id };
  }

  if (intent === "favorite") {
    const [updated] = await db
      .update(notes)
      .set({ favorite: sql`not ${notes.favorite}` })
      .where(and(eq(notes.id, id), eq(notes.type, 0)))
      .returning({ id: notes.id });
    if (!updated) return data({ error: "Note not found." }, { status: 404 });
    return { intent, noteId: id };
  }

  if (intent === "delete") {
    const [deleted] = await db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.type, 0)))
      .returning({ id: notes.id });
    if (!deleted) return data({ error: "Note not found." }, { status: 404 });
    return { intent, noteId: id };
  }

  return data({ error: "Unknown action." }, { status: 400 });
}
