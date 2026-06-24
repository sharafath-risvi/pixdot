import { useCallback, useEffect, useState } from "react";
import api from "../lib/api.js";

function toSimpleNote(note) {
  if (!note?._id) return null;
  return {
    id: note._id, // map backend _id to frontend id
    title: note.title || "Untitled",
    description: note.description || "",
    date: note.date || "",
    type: note.type || "Daily",
  };
}

/**
 * Personal notes CRUD persisted to MongoDB via backend API.
 * Used by both the staff and client portals.
 */
export function usePersonalNotes(storageKey, ownerId, idPrefix) {
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
      const response = await api.get("/notes");
      if (response.data.success) {
        setNotes(response.data.data.map(toSimpleNote).filter(Boolean));
      }
      setError(null);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
      setError("Failed to fetch notes.");
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
        await api.post("/notes", {
          title: String(entry.title || "").trim(),
          description: String(entry.description || "").trim(),
          date: entry.date,
          type: entry.type,
        });
        await fetchNotes();
        setError(null);
      } catch (err) {
        console.error("Failed to add note:", err);
        setError(err.response?.data?.message || "Failed to add note.");
        setLoading(false);
      }
    },
    [ownerId, fetchNotes]
  );

  const updateNote = useCallback(
    async (noteId, entry) => {
      if (!ownerId) return;
      setLoading(true);
      try {
        await api.put(`/notes/${noteId}`, {
          title: entry.title,
          description: entry.description,
          date: entry.date,
          type: entry.type,
        });
        await fetchNotes();
        setError(null);
      } catch (err) {
        console.error("Failed to update note:", err);
        setError(err.response?.data?.message || "Failed to update note.");
        setLoading(false);
      }
    },
    [ownerId, fetchNotes]
  );

  const deleteNote = useCallback(
    async (noteId) => {
      if (!ownerId) return;
      setLoading(true);
      try {
        await api.delete(`/notes/${noteId}`);
        await fetchNotes();
        setError(null);
      } catch (err) {
        console.error("Failed to delete note:", err);
        setError(err.response?.data?.message || "Failed to delete note.");
        setLoading(false);
      }
    },
    [ownerId, fetchNotes]
  );

  return { notes, addNote, updateNote, deleteNote, loading, error, clearError: () => setError(null) };
}
