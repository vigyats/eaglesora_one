## Packages
@tiptap/react | Rich text editor for admin content (HTML output)
@tiptap/starter-kit | Core editor extensions (headings, lists, bold/italic, etc.)
@tiptap/extension-underline | Underline formatting
@tiptap/extension-link | Link support with validation
@tiptap/extension-placeholder | Placeholder text for editor
@tiptap/extension-text-align | Alignment controls for headings/paragraphs
@tiptap/extension-image | (Optional) inline image embeds in HTML content
sonner | Premium toast notifications (polished UX)

## Notes
Auth is Replit OIDC: use /api/login, /api/logout, and GET /api/auth/user
Admin role check: GET /api/admins/me -> {isAdmin, role}; hide admin UI if not admin
Uploads use presigned URL flow: POST /api/uploads/request-url then PUT file to uploadURL; store objectPath in coverImagePath
Language switcher affects API queries via ?lang=en|hi|mr; fallback to English on missing translation client-side
Show full-page tricolour route transition loader on every route change
Featured projects: UI enforces max 4 featured (warn + block enabling beyond 4)
