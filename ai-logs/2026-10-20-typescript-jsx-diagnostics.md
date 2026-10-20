# TypeScript JSX diagnostics conversation

Captured scope: this task's user-facing conversation through verification, before the task commit and push. Tool observations are summarized separately. No other session's conversation is included.

## User

there are .ts errors present in files: Cannot use JSX unless the '--jsx' flag is provided

## Assistant

I’ll check the TypeScript configuration and affected files to find why JSX support isn’t being picked up.

## Assistant question

Where do you see the JSX error—editor underlines or a terminal command? If it’s in the editor, which editor and one affected filename?

## Assistant

The command-line type check passes, and Expo’s inherited configuration already enables JSX. That points to an editor configuration or language-server issue, though I haven’t confirmed the editor-side cause yet.

`★ Insight ─────────────────────────────────────`
VS Code can use a different TypeScript version from the project. When editor diagnostics disagree with `npm run typecheck`, checking the editor’s selected TypeScript version and project association is more useful than changing the components.
`─────────────────────────────────────────────────`

## User

VS Code editor underlines

## Assistant

VS Code is showing 74 errors, but it’s already using TypeScript 6.0.3 and the correct `tsconfig.json`. I’ll try restarting its TypeScript server to refresh the diagnostics before changing any configuration.

## Assistant

The editor restart was interrupted by ongoing UI activity. I’ll make `jsx: "react-jsx"` explicit in the root configuration instead. This matches Expo’s existing setting and gives VS Code a configuration change to reload.

## Assistant

VS Code now reports **No Problems**—all 74 errors have cleared. Type checking and lint also pass.

`★ Insight ─────────────────────────────────────`
The explicit JSX setting matches the value already inherited from Expo. It leaves the compiler behavior unchanged; the configuration refresh resolved the editor diagnostics.
`─────────────────────────────────────────────────`

## Tool observations and verification

- Before the change, the CLI type check passed and `tsc --showConfig` included `jsx: "react-jsx"` from Expo's base configuration.
- VS Code reported 74 errors, with TypeScript 6.0.3 and `tsconfig.json` shown in its language status.
- Attempts to restart the TypeScript server were interrupted by concurrent user interaction; a completed restart was not verified.
- Added the explicit JSX setting to `tsconfig.json`. Subsequent VS Code inspection reported “No Problems”.
- After the change, `npm run typecheck`, `npm run lint`, and the targeted Git whitespace check passed.
- The fix is isolated on `fix/typescript-jsx`; it is also applied in the active workspace so the editor picks it up. Other task changes are preserved.
