import { useEffect, useState } from 'react';
import { useProject } from '../../context/ProjectContext.jsx';
import { PageHead, Spinner, EmptyState } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { relTime } from '../../lib/format.js';
import {
  Sparkles, UserPlus, Pencil, Home, CheckSquare, Handshake, Check, CheckCircle2, Activity as ActIcon,
} from 'lucide-react';

const ICON = {
  create: Sparkles, join: UserPlus, edit: Pencil, member: Home,
  task: CheckSquare, proposal: Handshake, consent: Check, agreed: CheckCircle2,
};
const TONE = {
  agreed: 'text-grass-deep bg-grass-soft', consent: 'text-grass-deep bg-grass-soft',
  proposal: 'text-sun-deep bg-sun-soft', join: 'text-grass-deep bg-grass-soft',
};

export default function ActivityPage() {
  const { project } = useProject();
  const [items, setItems] = useState(project.activity || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.activity(project.id).then((a) => { if (alive) setItems(a); }).catch(() => {}).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [project.id, project.updated_at]);

  return (
    <div>
      <PageHead eyebrow="Aktivität" title="Was im Projekt passiert ist"
        sub="Jeder Beitritt, jede Datenänderung, jeder Vorschlag – chronologisch und für alle nachvollziehbar." />

      {loading && items.length === 0 ? <Spinner label="Verlauf wird geladen …" />
        : items.length === 0 ? <div className="card"><EmptyState icon={<ActIcon className="h-5 w-5" />} title="Noch keine Aktivität">Sobald sich etwas tut, wird es hier protokolliert.</EmptyState></div>
        : (
          <ol className="card divide-y divide-line">
            {items.map((a) => {
              const Icon = ICON[a.type] || ActIcon;
              const tone = TONE[a.type] || 'text-ink-soft bg-paper-2';
              return (
                <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <span className={`h-8 w-8 rounded-full grid place-items-center shrink-0 ${tone}`}><Icon className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="text-[13.5px] text-ink-soft">
                      {a.actor_name && <span className="font-medium text-ink">{a.actor_name} </span>}{a.text}
                    </div>
                    <div className="text-2xs text-ink-faint mt-0.5">{relTime(a.created_at)}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
    </div>
  );
}
