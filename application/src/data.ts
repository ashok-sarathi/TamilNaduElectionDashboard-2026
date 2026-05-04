import type { ElectionData, PartyResult } from './types';

const fallbackColors = ['#d72638', '#1f9d55', '#19a7ce', '#f97316', '#f2c94c', '#6d28d9', '#0f766e', '#64748b'];

export function normalizeElectionData(source: unknown): ElectionData {
  const record = asRecord(source);
  const rawElection = asRecord(record.election ?? {});
  const rawParties = Array.isArray(record.parties) ? record.parties : [];
  const rawConstituencies = Array.isArray(record.constituencies) ? record.constituencies : [];

  const parties = rawParties
    .map((party, index) => normalizeParty(party, index))
    .filter((party) => party.total > 0)
    .sort((a, b) => b.total - a.total || b.won - a.won);

  const totalSeats =
    numberFrom(rawElection.totalSeats) ||
    numberFrom(record.totalSeats) ||
    parties.reduce((sum, party) => sum + party.total, 0);

  return {
    election: {
      title: stringFrom(rawElection.title, 'Election Results Dashboard'),
      state: stringFrom(rawElection.state, 'Tamil Nadu'),
      year: stringFrom(rawElection.year, new Date().getFullYear().toString()),
      source: stringFrom(rawElection.source, 'output.json'),
      lastUpdated: stringFrom(rawElection.lastUpdated, new Date().toISOString()),
      statusText: stringFrom(rawElection.statusText, `Status known for ${totalSeats} constituencies`),
      totalSeats
    },
    parties,
    constituencies: rawConstituencies.map((seat) => {
      const value = asRecord(seat);
      return {
        name: stringFrom(value.name, 'Constituency'),
        party: stringFrom(value.party, '-'),
        candidate: stringFrom(value.candidate, 'Candidate'),
        status: stringFrom(value.status, 'Leading'),
        margin: numberFrom(value.margin)
      };
    })
  };
}

function normalizeParty(source: unknown, index: number): PartyResult {
  const party = asRecord(source);
  const won = numberFrom(party.won ?? party.Won);
  const leading = numberFrom(party.leading ?? party.Leading);
  const total = numberFrom(party.total ?? party.Total) || won + leading;
  const name = stringFrom(party.party ?? party.Party, `Party ${index + 1}`);

  return {
    party: name,
    shortName: stringFrom(party.shortName ?? party.code, createShortName(name)),
    won,
    leading,
    total,
    color: stringFrom(party.color, fallbackColors[index % fallbackColors.length])
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function numberFrom(value: unknown): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function stringFrom(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function createShortName(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 6)
    .toUpperCase();
}
