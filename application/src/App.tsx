import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, RefreshCw, Trophy, TrendingUp, UsersRound } from 'lucide-react';
import { toPng } from 'html-to-image';
import type { ElectionData, PartyResult } from './types';
import { normalizeElectionData } from './data';

const DEFAULT_VISIBLE_PARTIES = 5;

function App() {
  const [data, setData] = useState<ElectionData | null>(null);
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE_PARTIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const exportRef = useRef<HTMLDivElement>(null);

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`./output.json?ts=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`Could not load output.json (${response.status})`);
      }

      const json = await response.json();
      setData(normalizeElectionData(json));
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Could not load election data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const parties = useMemo(() => data?.parties ?? [], [data]);
  const selectedParties = useMemo(
    () => parties.slice(0, Math.min(visibleCount, parties.length)),
    [parties, visibleCount]
  );
  const leadingParty = selectedParties[0];
  const totalShownSeats = selectedParties.reduce((sum, party) => sum + party.total, 0);
  const totalSeats = data?.election.totalSeats || parties.reduce((sum, party) => sum + party.total, 0);
  const knownSeats = parties.reduce((sum, party) => sum + party.total, 0);
  const lastUpdated = data?.election.lastUpdated
    ? new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(data.election.lastUpdated))
    : 'Awaiting update';

  async function exportDashboard() {
    if (!exportRef.current) {
      return;
    }

    const imageData = await toPng(exportRef.current, {
      cacheBust: true,
      pixelRatio: 3,
      backgroundColor: '#f8fafc',
      width: exportRef.current.offsetWidth,
      height: exportRef.current.offsetHeight
    });

    const link = document.createElement('a');
    link.download = `tamil-nadu-election-dashboard-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
    link.href = imageData;
    link.click();
  }

  return (
    <main className="page-shell">
      <section className="workspace">
        <header className="toolbar" aria-label="Dashboard controls">
          <div>
            <p className="eyebrow">Live result dashboard</p>
            <h1>Tamil Nadu Election Results</h1>
          </div>

          <div className="actions">
            <label className="select-wrap">
              <span>Parties</span>
              <select
                value={visibleCount}
                onChange={(event) => setVisibleCount(Number(event.target.value))}
                disabled={!parties.length}
              >
                {[5, 6, 7, 8, parties.length].filter(uniqueNumber).map((count) => (
                  <option key={count} value={Math.min(count, parties.length || count)}>
                    Top {Math.min(count, parties.length || count)}
                  </option>
                ))}
              </select>
            </label>
            <button className="icon-button" type="button" onClick={loadData} title="Refresh data">
              <RefreshCw size={18} />
            </button>
            <button className="primary-button" type="button" onClick={exportDashboard} disabled={!data}>
              <Download size={18} />
              Export PNG
            </button>
          </div>
        </header>

        {loading && <div className="state-panel">Loading `output.json`...</div>}
        {error && <div className="state-panel error">{error}</div>}

        {data && (
          <article className="export-frame" ref={exportRef}>
            <div className="poster">
              <section className="hero-band">
                <div>
                  <p className="eyebrow">{data.election.state} · {data.election.year}</p>
                  <h2>{data.election.title}</h2>
                  <p className="status-text">{data.election.statusText}</p>
                </div>
                <div className="update-pill">
                  <span>Updated</span>
                  <strong>{lastUpdated}</strong>
                </div>
              </section>

              <section className="summary-grid">
                <MetricCard icon={<Trophy size={24} />} label="Current No. 1" value={leadingParty?.shortName ?? '-'} hint={leadingParty?.party ?? ''} />
                <MetricCard icon={<TrendingUp size={24} />} label="Seats Shown" value={`${totalShownSeats}`} hint={`of ${knownSeats || totalSeats} known seats`} />
                <MetricCard icon={<UsersRound size={24} />} label="Majority Mark" value={`${Math.floor(totalSeats / 2) + 1}`} hint={`${totalSeats} assembly seats`} />
              </section>

              <section className="result-layout">
                <div className="panel">
                  <div className="panel-heading">
                    <h3>Party Position</h3>
                    <span>Won + Leading</span>
                  </div>
                  <div className="party-stack">
                    {selectedParties.map((party, index) => (
                      <PartyRow key={party.shortName} party={party} rank={index + 1} max={Math.max(leadingParty?.total ?? 1, 1)} />
                    ))}
                  </div>
                </div>

                <div className="panel chart-panel">
                  <div className="panel-heading">
                    <h3>Seat Share</h3>
                    <span>Top {selectedParties.length}</span>
                  </div>
                  <DonutChart parties={selectedParties} />
                </div>
              </section>

              <section className="panel constituency-panel">
                <div className="panel-heading">
                  <h3>Key Constituencies</h3>
                  <span>Sample structure</span>
                </div>
                <div className="constituency-grid">
                  {data.constituencies.slice(0, 5).map((seat) => (
                    <div className="seat-card" key={`${seat.name}-${seat.party}`}>
                      <strong>{seat.name}</strong>
                      <span>{seat.candidate}</span>
                      <em>{seat.party} · {seat.status} by {seat.margin.toLocaleString('en-IN')}</em>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}

function uniqueNumber(value: number, index: number, list: number[]) {
  return value > 0 && list.indexOf(value) === index;
}

function MetricCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}

function PartyRow({ party, rank, max }: { party: PartyResult; rank: number; max: number }) {
  const width = Math.max(8, (party.total / max) * 100);

  return (
    <div className="party-row">
      <div className="party-rank">{rank}</div>
      <div className="party-detail">
        <div className="party-title">
          <strong>{party.shortName}</strong>
          <span>{party.party}</span>
        </div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${width}%`, background: party.color }} />
        </div>
        <div className="seat-breakdown">
          <span>Won {party.won}</span>
          <span>Leading {party.leading}</span>
        </div>
      </div>
      <div className="party-total">{party.total}</div>
    </div>
  );
}

function DonutChart({ parties }: { parties: PartyResult[] }) {
  const total = parties.reduce((sum, party) => sum + party.total, 0) || 1;
  let running = 0;

  const gradient = parties
    .map((party) => {
      const start = (running / total) * 100;
      running += party.total;
      const end = (running / total) * 100;
      return `${party.color} ${start}% ${end}%`;
    })
    .join(', ');

  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="donut-center">
          <strong>{total}</strong>
          <span>seats</span>
        </div>
      </div>
      <div className="legend">
        {parties.map((party) => (
          <div key={party.shortName}>
            <i style={{ background: party.color }} />
            <span>{party.shortName}</span>
            <strong>{party.total}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
