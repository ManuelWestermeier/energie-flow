import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { Spinner } from './components/ui.jsx';
import { PublicLayout, AppLayout } from './components/Layout.jsx';
import ProjectLayout from './components/ProjectLayout.jsx';

// Öffentlich
import Landing from './pages/Landing.jsx';
import HowItWorks from './pages/HowItWorks.jsx';
import Model from './pages/Model.jsx';
import EconomicsExplainer from './pages/EconomicsExplainer.jsx';
import FAQ from './pages/FAQ.jsx';
const Rechner = lazy(() => import('./pages/Rechner.jsx'));
import Login from './pages/Login.jsx';
import Join from './pages/Join.jsx';
import NotFound from './pages/NotFound.jsx';

// Angemeldet
import Dashboard from './pages/Dashboard.jsx';
import Overview from './pages/project/Overview.jsx';
import Roadmap from './pages/project/Roadmap.jsx';
import Building from './pages/project/Building.jsx';
import Community from './pages/project/Community.jsx';
import Economics from './pages/project/Economics.jsx';
import Negotiation from './pages/project/Negotiation.jsx';
import Documents from './pages/project/Documents.jsx';
import ActivityPage from './pages/project/ActivityPage.jsx';
import Settings from './pages/project/Settings.jsx';

function RequireAuth() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="min-h-screen grid place-items-center"><Spinner label="Anmeldung wird geprüft …" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  return <Outlet />;
}

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center"><Spinner label="Lädt …" /></div>}>
    <Routes>
      {/* Öffentliche Seiten mit gemeinsamem Layout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/so-funktioniert-es" element={<HowItWorks />} />
        <Route path="/modell" element={<Model />} />
        <Route path="/wirtschaftlichkeit" element={<EconomicsExplainer />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/rechner" element={<Rechner />} />
      </Route>

      {/* Eigenständige Seiten ohne Kopf-/Fußzeile */}
      <Route path="/login" element={<Login />} />
      <Route path="/join/:token" element={<Join />} />
      <Route path="/dashboard" element={<Navigate to="/start" replace />} />

      {/* Geschützter Bereich */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/start" element={<Dashboard />} />
        </Route>

        <Route path="/projekt/:id" element={<ProjectLayout />}>
          <Route index element={<Navigate to="uebersicht" replace />} />
          <Route path="uebersicht" element={<Overview />} />
          <Route path="fahrplan" element={<Roadmap />} />
          <Route path="gebaeude" element={<Building />} />
          <Route path="gemeinschaft" element={<Community />} />
          <Route path="wirtschaftlichkeit" element={<Economics />} />
          <Route path="verhandlung" element={<Negotiation />} />
          <Route path="dokumente" element={<Documents />} />
          <Route path="aktivitaet" element={<ActivityPage />} />
          <Route path="einstellungen" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}
