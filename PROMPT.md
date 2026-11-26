# App description

Right now i have a skeleton for a simple notes app. The UI design is finished, whats left is the backend implementation.

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

# Plan

Create a plan to implement all functionality which is now done using static data and mocks. Ask any relevant questions before starting.
