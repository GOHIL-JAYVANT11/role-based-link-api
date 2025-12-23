import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link as LinkIcon, Plus, Edit2, Trash2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

type Link = {
  link_id: string;
  link_url: string;
  created_at?: string;
};

export function LinkManagement() {
  const { profile } = useAuth();

  const [links, setLinks] = useState<Link[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isMainUser = profile?.role === "main";

  // ✅ ADD OR UPDATE LINK
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // ✅ UPDATE MODE
      if (editingId) {
        const res = await fetch(`${API_BASE}/links/update/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ link: linkInput }),
        });

        if (!res.ok) throw new Error("Update failed");

        setLinks((prev) =>
          prev.map((l) =>
            l.link_id === editingId ? { ...l, link_url: linkInput } : l
          )
        );

        setMessage("✅ Link updated successfully");
      }

      // ✅ ADD MODE
      else {
        const res = await fetch(`${API_BASE}/links/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ link: linkInput }),
        });

        const data = await res.json();

        // ✅ DUPLICATE
        if (data.error) {
          setMessage(`⚠️ ${data.error} (ID: ${data.generatedId || "Exists"})`);
          return;
        }

        // ✅ SUCCESS
        setLinks((prev) => [
          {
            link_id: data.generatedId,
            link_url: linkInput,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);

        setMessage(`✅ Link added with ID ${data.generatedId}`);
      }

      setShowForm(false);
      setEditingId(null);
      setLinkInput("");
    } catch (err) {
      console.error(err);
      setMessage("❌ Operation failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ EDIT
  const handleEdit = (link: Link) => {
    setEditingId(link.link_id);
    setLinkInput(link.link_url);
    setShowForm(true);
  };

  // ✅ DELETE
  const handleDelete = async (prbId: string) => {
    if (!confirm("Delete this link?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/links/delete/${prbId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Delete failed");

      setLinks((prev) => prev.filter((l) => l.link_id !== prbId));
      setMessage("✅ Link deleted successfully");
    } catch {
      setMessage("❌ Delete failed");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setLinkInput("");
    setMessage("");
  };

  // ✅ BLOCK SUB USERS
  if (!isMainUser) {
    return (
      <div className="p-6 bg-white rounded-lg text-center text-red-600 font-semibold">
        Only Main Users can manage links.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
      {/* ✅ HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LinkIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Link Management</h2>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Add Link
        </button>
      </div>

      {/* ✅ MESSAGE */}
      {message && (
        <div className="p-3 bg-blue-100 rounded text-blue-800">{message}</div>
      )}

      {/* ✅ FORM */}
      {showForm && (
        <div className="p-4 bg-slate-50 border rounded-lg">
          <h3 className="font-semibold mb-3">
            {editingId ? "Edit Link" : "Add New Link"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="url"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              required
              className="w-full border p-2 rounded"
              placeholder="https://example.com"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                {loading ? "Saving..." : editingId ? "Update" : "Add"}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="border px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ✅ LIST */}
      <div className="space-y-3">
        {links.length === 0 ? (
          <p className="text-center text-gray-500">No links added yet.</p>
        ) : (
          links.map((link) => (
            <div
              key={link.link_id}
              className="flex justify-between items-center p-4 border rounded-lg"
            >
              <div>
                <span className="px-2 py-1 bg-blue-100 rounded text-sm font-mono">
                  {link.link_id}
                </span>
                <a
                  href={link.link_url}
                  target="_blank"
                  className="block text-blue-600 mt-2"
                >
                  {link.link_url}
                </a>
              </div>

              <div className="flex gap-3">
                <button onClick={() => handleEdit(link)}>
                  <Edit2 className="w-5 h-5 text-blue-600" />
                </button>

                <button onClick={() => handleDelete(link.link_id)}>
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
