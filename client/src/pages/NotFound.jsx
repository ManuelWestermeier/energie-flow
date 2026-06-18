import { Link } from 'react-router-dom';
import { Page } from '../components/Layout.jsx';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <Page>
      <div className="wrap py-24 text-center max-w-md">
        <div className="inline-grid place-items-center h-16 w-16 rounded-2xl bg-green-soft text-green-deep mb-5">
          <Compass className="h-8 w-8" />
        </div>
        <h1 className="text-3xl mb-2">Seite nicht gefunden</h1>
        <p className="text-ink-soft mb-7">
          Diese Adresse gibt es nicht (mehr). Vielleicht ist ein Einladungslink abgelaufen.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/" className="btn-ghost">Zur Startseite</Link>
          <Link to="/rechner" className="btn-primary">Zum Rechner</Link>
        </div>
      </div>
    </Page>
  );
}
