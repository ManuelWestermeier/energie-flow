import { Link } from 'react-router-dom';
import { LogoWide } from '../components/ui.jsx';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas grid place-items-center">
      <div className="wrap py-16 text-center max-w-md">
        <Link to="/" className="inline-block mb-8"><LogoWide className="h-8 mx-auto" /></Link>
        <div className="inline-grid place-items-center h-16 w-16 rounded-card bg-grass-soft text-grass-deep mb-5"><Compass className="h-8 w-8" /></div>
        <h1 className="text-3xl mb-2">Seite nicht gefunden</h1>
        <p className="text-ink-soft mb-7">Diese Adresse gibt es nicht (mehr). Vielleicht ist ein Einladungslink abgelaufen.</p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/" className="btn-ghost">Zur Startseite</Link>
          <Link to="/rechner" className="btn-primary">Zum Rechner</Link>
        </div>
      </div>
    </div>
  );
}
