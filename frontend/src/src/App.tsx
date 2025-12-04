import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Login } from "./components/Login";
import { MainApp } from "./components/MainApp";

function AppContent() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    );
  }

  // ✅ If JWT exists → show app, else show login
  return profile ? <MainApp /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

