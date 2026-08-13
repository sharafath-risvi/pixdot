import { useCallback, useEffect, useState } from "react";
import { notesService, getErrorMessage } from "../services/index.js";

function toSimpleNote(note) {
  if (!note) return null;
  const id = note.id || note._id;
  if (!id) return null;
  return {
    id: String(id),
    title: note.title || "Untitled",
    description: note.description || "",
    date: note.date || "",
    type: note.type || "Daily",
  };
}

/**
 * Personal notes CRUD via notesService (staff + client portals).
 * storageKey / idPrefix kept for call-site compatibility; persistence is API-backed.
 */
export function usePersonalNotes(storageKey, ownerId, idPrefix) {
  void storageKey;
  void idPrefix;

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotes = useCallback(async () => {
    if (!ownerId) {
      setNotes([]);
      return;
    }
    setLoading(true);
    try {
      const list = await notesService.getNotes();
      setNotes(list.map(toSimpleNote).filter(Boolean));
      setError(null);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
      setError(getErrorMessage(err, "Failed to fetch notes."));
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = useCallback(
    async (entry) => {
      if (!ownerId) return;
      setLoading(true);
      try {
        await notesService.createNote({
          title: String(entry.title || "").trim(),
          description: String(entry.description || "").trim(),
          date: entry.date,
          type: entry.type,
        });
        await fetchNotes();
        setError(null);
      } catch (err) {
        console.error("Failed to add note:", err);
        setError(getErrorMessage(err, "Failed to add note."));
        setLoading(false);
      }
    },
    [ownerId, fetchNotes],
  );

  const updateNote = useCallback(
    async (noteId, entry) => {
      if (!ownerId) return;
      setLoading(true);
      try {
        await notesService.updateNote(noteId, {
          title: entry.title,
          description: entry.description,
          date: entry.date,
          type: entry.type,
        });
        await fetchNotes();
        setError(null);
      } catch (err) {
        console.error("Failed to update note:", err);
        setError(getErrorMessage(err, "Failed to update note."));
        setLoading(false);
      }
    },
    [ownerId, fetchNotes],
  );

  const deleteNote = useCallback(
    async (noteId) => {
      if (!ownerId) return;
      setLoading(true);
      try {
        await notesService.deleteNote(noteId);
        await fetchNotes();
        setError(null);
      } catch (err) {
        console.error("Failed to delete note:", err);
        setError(getErrorMessage(err, "Failed to delete note."));
        setLoading(false);
      }
    },
    [ownerId, fetchNotes],
  );

  return {
    notes,
    addNote,
    updateNote,
    deleteNote,
    loading,
    error,
    clearError: () => setError(null),
  };
}
