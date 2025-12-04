import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Search, FileText } from "lucide-react";

const API_BASE = "http://localhost:8000";

type LinkResult = {
  link: string | null;
  generatedId: string;
  status?: string;
  error?: string;
};

export function Dashboard() {
  const { profile } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<LinkResult | null>(null);

  const [bulkContent, setBulkContent] = useState("");
  const [bulkResults, setBulkResults] = useState<LinkResult[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isMainUser = profile?.role === "main";

  // ✅ SINGLE SEARCH (AUTO-DETECT ID OR LINK)
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setMessage("Enter a PRB ID or Link");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setSearchResult(null);

      const token = localStorage.getItem("token");
      const isPRB = searchQuery.startsWith("PRB");

      const url = isPRB
        ? `${API_BASE}/fetch/by-ids-bulk`
        : `${API_BASE}/fetch/by-links-bulk`;

      const payload = isPRB
        ? { prb_ids: [searchQuery] }
        : { links: [searchQuery] };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.results?.length) {
        setMessage("No result found");
        return;
      }

      const result = data.results[0];

      setSearchResult({
        generatedId: result.generatedId,
        link: result.link ?? null,
        status: result.status,
      });
    } catch (err) {
      console.error(err);
      setMessage("Backend error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ BULK SUBMIT (SHOW FULL OUTPUT TABLE)
  const handleSubmit = async () => {
    if (!bulkContent.trim()) {
      setMessage("Please enter bulk data");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setBulkResults([]);

      const token = localStorage.getItem("token");

      const lines = bulkContent
        .split("\n")
        .map((i) => i.trim())
        .filter(Boolean);

      const isPRBBulk = lines[0].startsWith("PRB");

      const url = isPRBBulk
        ? `${API_BASE}/fetch/by-ids-bulk`
        : `${API_BASE}/fetch/by-links-bulk`;

      const payload = isPRBBulk
        ? { prb_ids: lines }
        : { links: lines };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage("Bulk request failed");
        return;
      }

      // ✅ ✅ ✅ STORE FULL RESULTS FOR DISPLAY
      setBulkResults(data.results);

      setMessage(`Processed ${data.count} records`);
      setBulkContent("");
    } catch (err) {
      console.error(err);
      setMessage("Backend error");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setBulkContent("");
    setMessage("");
    setBulkResults([]);
    setSearchResult(null);
  };

  return (
    <div className="space-y-6">
      {/* ✅ SEARCH SECTION */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Search className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Search Link</h2>
        </div>

        <div className="flex gap-3 mb-4">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Enter PRB ID or URL"
            className="flex-1 px-4 py-3 border rounded-lg"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {searchResult && (
          <div className="mt-4 p-4 bg-blue-50 border rounded-lg">
            <p><b>Generated ID:</b> {searchResult.generatedId}</p>
            <p>
              <b>Link:</b>{" "}
              {searchResult.link ? (
                <a
                  href={searchResult.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  {searchResult.link}
                </a>
              ) : (
                "Not Found"
              )}
            </p>
          </div>
        )}
      </div>

      {/* ✅ BULK SECTION */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Bulk Submit</h2>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-100 rounded">{message}</div>
        )}

        <textarea
          value={bulkContent}
          onChange={(e) => setBulkContent(e.target.value)}
          rows={8}
          placeholder="Paste bulk PRB IDs or links (one per line)"
          className="w-full border p-3 rounded-lg"
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            {loading ? "Processing..." : "Submit"}
          </button>

          <button
            onClick={handleClear}
            className="border px-6 py-3 rounded-lg"
          >
            Clear
          </button>
        </div>

        {/* ✅ ✅ ✅ BULK OUTPUT TABLE (THIS FIXES YOUR ISSUE) */}
        {bulkResults.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border rounded-lg text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2 text-left">Link</th>
                  <th className="border px-3 py-2 text-left">Generated ID</th>
                  <th className="border px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {bulkResults.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="border px-3 py-2 break-all">
                      {item.link || "Not Found"}
                    </td>
                    <td className="border px-3 py-2 font-mono">
                      {item.generatedId}
                    </td>
                    <td className="border px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.status === "created"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {item.status || "fetched"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
