export type PartyResult = {
  party: string;
  shortName: string;
  won: number;
  leading: number;
  total: number;
  color: string;
};

export type ConstituencyResult = {
  name: string;
  party: string;
  candidate: string;
  status: string;
  margin: number;
};

export type ElectionData = {
  election: {
    title: string;
    state: string;
    year: string;
    source: string;
    lastUpdated: string;
    statusText: string;
    totalSeats: number;
  };
  parties: PartyResult[];
  constituencies: ConstituencyResult[];
};
