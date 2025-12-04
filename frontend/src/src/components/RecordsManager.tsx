import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Upload, Search } from "lucide-react";
import * as XLSX from "xlsx";

const API_BASE = "http://localhost:8000";

type RecordResult = {
  record_id?: number;
  contact_number: string;
  source_name?: string;
  created_at?: string;
  error?: string;
};

export function RecordsManager() {
  const { profile } = useAuth();
  const isMainUser = profile?.role === "main";

  const [contactsInput, setContactsInput] = useState("");
  const [results, setResults] = useState<RecordResult[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [contactCol, setContactCol] = useState("");
  const [sourceCol, setSourceCol] = useState("");

  // ✅ CONTACT SEARCH
  const handleSearch = async () => {
  if (!contactsInput.trim()) {
    setMessage("Enter contact numbers");
    return;
  }

  try {
    setLoading(true);
    setMessage("");

    const token = localStorage.getItem("token");

    const lines = contactsInput
      .split("\n")
      .map((i) => i.trim())
      .filter(Boolean);

    const res = await fetch(`${API_BASE}/records/fetch-by-contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        contact_numbers: lines,   // ✅ EXACT KEY BACKEND EXPECTS
      }),
    });

    const data = await res.json();
    console.log("✅ SEARCH RESPONSE:", data);

    if (!res.ok) {
      setMessage(data.error || "Search failed");
      setResults([]);
      return;
    }

    if (!data.results || data.results.length === 0) {
      setMessage("No records found");
      setResults([]);
      return;
    }

    // ✅ THIS WAS LIKELY YOUR BUG
    setResults(data.results);

  } catch (err) {
    console.error("Search error:", err);
    setMessage("Backend connection failed");
  } finally {
    setLoading(false);
  }
};


  // ✅ ✅ ✅ CORRECT EXCEL / CSV HEADER EXTRACTION
  const handleFileSelect = (file: File) => {
    setFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const extractedHeaders = json[0] as string[];
      const extractedRows = json.slice(1);

      setColumns(extractedHeaders);
      setRows(extractedRows);

      console.log("✅ HEADERS:", extractedHeaders);
      console.log("✅ ROWS:", extractedRows);
    };

    reader.readAsArrayBuffer(file);
  };

  // ✅ FINAL UPLOAD AFTER COLUMN MAPPING
  const handleFinalUpload = async () => {
    if (!file || !contactCol || !sourceCol) {
      setMessage("Please map all required columns");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const mappedPayload = rows.map((row) => ({
        contact_number: row[columns.indexOf(contactCol)],
        source_name: row[columns.indexOf(sourceCol)],
      }));

      const res = await fetch(`${API_BASE}/records/upload-mapped`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ records: mappedPayload }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage("Upload failed");
        return;
      }

      setMessage(data.message);
      setFile(null);
      setColumns([]);
      setRows([]);
      setContactCol("");
      setSourceCol("");
    } catch {
      setMessage("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isMainUser) return null;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-8">
      <h2 className="text-2xl font-bold">GFY Records Manager</h2>

      {message && (
        <div className="p-3 bg-blue-100 rounded text-blue-800">{message}</div>
      )}

      {/* ✅ CONTACT SEARCH */}
      <div>
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Search className="w-4 h-4" />
          Search by Contact Number
        </h3>

        <textarea
          rows={5}
          value={contactsInput}
          onChange={(e) => setContactsInput(e.target.value)}
          placeholder="One contact per line"
          className="w-full border p-3 rounded"
        />

        <button
          onClick={handleSearch}
          disabled={loading}
          className="mt-2 bg-blue-600 text-white px-5 py-2 rounded"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>
      {/* ✅ SEARCH RESULTS TABLE */}
{results.length > 0 && (
  <table className="w-full border text-sm mt-6">
    <thead className="bg-gray-100">
      <tr>
        <th className="border p-2">Record ID</th>
        <th className="border p-2">Contact</th>
        <th className="border p-2">Source</th>
        <th className="border p-2">Created</th>
        <th className="border p-2">Status</th>
      </tr>
    </thead>
    <tbody>
      {results.map((r, i) => (
        <tr key={i}>
          <td className="border p-2">{r.record_id ?? "-"}</td>
          <td className="border p-2">{r.contact_number}</td>
          <td className="border p-2">{r.source_name ?? "-"}</td>
          <td className="border p-2">
            {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}
          </td>
          <td className="border p-2">
            {r.error ? "Not Found" : "Found"}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)}

      {/* ✅ FILE UPLOAD + COLUMN MAPPING */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload CSV / Excel
        </h3>

        <input
          type="file"
          accept=".xlsx,.csv"
          onChange={(e) =>
            e.target.files && handleFileSelect(e.target.files[0])
          }
        />

        {columns.length > 0 && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="font-medium">Contact Number Column</label>
              <select
                className="ml-3 border p-2 rounded"
                value={contactCol}
                onChange={(e) => setContactCol(e.target.value)}
              >
                <option value="">Select</option>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium">Source Name Column</label>
              <select
                className="ml-3 border p-2 rounded"
                value={sourceCol}
                onChange={(e) => setSourceCol(e.target.value)}
              >
                <option value="">Select</option>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleFinalUpload}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded"
            >
              {loading ? "Uploading..." : "Final Upload"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

