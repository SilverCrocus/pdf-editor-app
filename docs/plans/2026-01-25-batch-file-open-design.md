# Batch File Open - Merge Multiple PDFs in Single Window

## Summary

When multiple PDFs are selected in Finder and opened with the app, they should open in a single window with pages merged in natural filename order (e.g., `file1.pdf`, `file2.pdf`, `file10.pdf`). Subsequent batches open in new windows.

## Changes

### main.ts

1. **Batch `open-file` events**: Collect file paths that arrive within 150ms into a single batch
2. **Natural sort**: Sort batched paths by filename using natural sort before creating window
3. **Pass array to window**: `createWindow` accepts `string[]` instead of `string | undefined`
4. **Handle startup batch**: Collect paths before `app.isReady()`, process them together on ready

### ipc.ts

1. **Store array of paths**: `setPendingFiles(webContentsId, filePaths: string[])` instead of single path
2. **Return array**: `getInitialFiles` IPC channel returns `string[]` instead of `string | null`

### preload.ts

1. **Update API**: `getInitialFiles(): Promise<string[]>` replaces `getInitialFile`

### App.tsx

1. **Load multiple files on startup**: Loop through initial files, loading and merging each
2. **Set currentFilePath to null for batches**: Multiple files means "Save As" required (existing behavior)

## Implementation Notes

- The 150ms batch window only collects path strings - no file I/O during this phase
- Natural sort handles numeric sequences in filenames correctly
- Existing "Open" dialog behavior (selecting multiple files) already merges - this makes "Open With" consistent
