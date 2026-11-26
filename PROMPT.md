# App description

The goal is to create a simple self-hosted notes app.

### Features

- Single user login with 30 day session. Password set in env. All features protected by login
- Show notes in a list as [title last edited]. Sorted by edit date.
- Show new note button (pen icon with "New").
- Clicking note opens the note popup. Showing uneditable note title, content, and creation/edit date.
  - Popup has edit button (pencil icon) to enter edit mode.
  - Title is its own editable textbox (plain text)
  - Content is a markdown editor.
  - Closing popup or clicking view mode (eye icon) saves note.
  - Show delete button as well
- On note hover (list), show delete icon (trash icon). Confirmation dialog before deleting.
- Search box at the top of the list. Fuzzy searches within note title (high priority) and content (low priority).
- Sort buttons by date created and edited
- Star icon on notes to mark/unmark as favorite. Favorite notes are at the top of the list if unsorted by filters.

### Requirements

- Note content is markdown, render as such
- Dark mode Fluent design
- No unnecessary headers, subheadings, pills, descriptions, animations.
- For markdown editor, use existing and popular editor packages
- Super short readme showing how to run locally, and link to ghcr image to deploy as well as required env vars
- No super bold or round fonts

### Technology

- Postgres
- React router in framework mode
- Drizzle ORM
- Docker compose for local database
- Dockerfile for deployment
- Github pipeline for building and publishing docker image to ghcr
- Oxfmt/oxlint
- pnpm
- tailwind

### Future proofing

- Notes should have a type column which indicates the note type. For this demo, all notes are 0 (markdown). Future iterations may add other note types (link, list, etc). Only deal with type 0 for now.

## First steps

Before beginning on the app itself, you must first make a mock demo with the finalized design to be approved before continuing. This requires:

1. Creating a React Router framework mode app
2. Creating a single page with necessary components to show the full feature set.
3. Use dummy data and bogus API (function) calls to make it work enough to test the design only.

After doing this, I will either make you iterate on the design or let you being with the rest of the app.

Before starting with the design phase ask any necessary questions.
