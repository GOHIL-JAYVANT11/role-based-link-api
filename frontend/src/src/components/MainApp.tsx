import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Dashboard } from "./Dashboard";
import { LinkManagement } from "./LinkManagement";
import { SubUserManagement } from "./SubUserManagement";
import { RecordsManager } from "./RecordsManager";

import {
  LogOut,
  LayoutDashboard,
  Link as LinkIcon,
  Users,
  Database
} from "lucide-react";

export function MainApp() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // ✅ FIXED ROLE CHECK (FASTAPI USES "main" & "sub")
  const isMainUser = profile?.role === "main";

  // ✅ JWT LOGOUT
  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* ✅ NAVBAR */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <LinkIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">GFY</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.email}
                </p>
                <p className="text-xs text-gray-500">
                  {isMainUser ? "Main User" : "Sub User"}
                </p>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ✅ TABS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-4 mb-8">
          {/* ✅ DASHBOARD */}
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "dashboard"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>

          {isMainUser && (
            <>
              {/* ✅ LINK MANAGEMENT */}
              <button
                onClick={() => setActiveTab("links")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === "links"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                Manage Links
              </button>

              {/* ✅ SUB USERS */}
              <button
                onClick={() => setActiveTab("subusers")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === "subusers"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Users className="w-4 h-4" />
                Sub-Users
              </button>

              {/* ✅ ✅ ✅ RECORDS TAB (THIS WAS MISSING) */}
              <button
                onClick={() => setActiveTab("records")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === "records"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Database className="w-4 h-4" />
                Records
              </button>
            </>
          )}
        </div>

        {/* ✅ TAB CONTENT AREA */}
        <div>
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "links" && isMainUser && <LinkManagement />}
          {activeTab === "subusers" && isMainUser && <SubUserManagement />}
          {activeTab === "records" && isMainUser && <RecordsManager />}
        </div>
      </div>
    </div>
  );
}
