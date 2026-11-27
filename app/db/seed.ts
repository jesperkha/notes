import "dotenv/config";
import { closeDatabase, db } from "../db.server";
import { notes } from "./schema";

if (process.env.NODE_ENV === "production") {
  throw new Error("The development seed script cannot run in production");
}

const sampleNotes = [
  {
    id: "sample-long-note",
    title: "Long note for scrolling",
    content: Array.from(
      { length: 80 },
      (_, index) =>
        `## Section ${index + 1}\n\nThis sample note is intentionally long so you can test scrolling through a document on both desktop and mobile. Add ideas, observations, and details here as the note continues down the page.`,
    ).join("\n\n"),
    favorite: false,
  },
  {
    id: "sample-field-notes",
    title: "Field notes from the coast",
    content:
      "## Sunday\n\nThe path opens up just past the old boathouse. The wind was **strong from the west**, but the water stayed bright and glassy.\n\n- Bring the small film camera next time\n- Check the tide before leaving",
    favorite: true,
  },
  {
    id: "sample-reading-list",
    title: "Books for the next long weekend",
    content:
      "A short list for slow mornings and train rides.\n\n1. *The Summer Book* — Tove Jansson\n2. *Pilgrim at Tinker Creek* — Annie Dillard",
    favorite: false,
  },
  {
    id: "sample-coffee",
    title: "Coffee ratio — V60",
    content:
      "## House recipe\n\n- Coffee: **18 g**, medium-fine\n- Water: **300 g** at 94°C\n- Bloom: 45 g for 35 seconds",
    favorite: true,
  },
] as const;

try {
  await db
    .insert(notes)
    .values([...sampleNotes])
    .onConflictDoNothing();
  console.log(`Seeded ${sampleNotes.length} development notes (existing IDs were left unchanged).`);
} finally {
  await closeDatabase();
}
