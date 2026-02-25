import fs from "fs";
import path from "path";
import { DIV_TO_LEAGUE } from "./league-map";
import type { FixtureOddsProvider, FixtureCandidate } from "./adapter";

const DATA_DIR = process.env.FIXTURES_DATA_DIR || path.join(process.cwd(), "data");

function parseDate(d: string, time?: string): { date: string; startedAt: Date | null } {
  const parts = d.split("/");
  if (parts.length !== 3) return { date: "", startedAt: null };
  const day = parts[0].padStart(2, "0");
  const month = parts[1].padStart(2, "0");
  const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
  const date = `${year}-${month}-${day}`;
  let startedAt: Date | null = null;
  if (time) {
    const [h, m] = time.split(":").map(Number);
    if (!isNaN(h)) startedAt = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}:00Z`);
  }
  return { date, startedAt };
}

function parseRow(row: Record<string, string>): FixtureCandidate | null {
  const div = row.Div || row.div;
  const dateStr = row.Date;
  const homeTeam = row.HomeTeam;
  const awayTeam = row.AwayTeam;
  if (!div || !dateStr || !homeTeam || !awayTeam) return null;
  const league = DIV_TO_LEAGUE[div];
  if (!league) return null;
  const time = row.Time;
  const { date, startedAt } = parseDate(dateStr, time);
  const fthg = row.FTHG;
  const ftag = row.FTAG;
  const hthg = row.HTHG;
  const htag = row.HTAG;
  const b365h = row.B365H;
  const b365d = row.B365D;
  const b365a = row.B365A;
  const over25 = row["B365>2.5"] ?? row["B365C>2.5"];
  const under25 = row["B365<2.5"] ?? row["B365C<2.5"];

  const candidate: FixtureCandidate = {
    leagueSlug: league.slug,
    homeTeamName: homeTeam.trim(),
    awayTeamName: awayTeam.trim(),
    fixtureDate: date,
    time,
    startedAt: startedAt ? startedAt.toISOString() : undefined,
    referee: row.Referee || undefined,
    shotsHome: parseInt(row.HS ?? "", 10) || undefined,
    shotsAway: parseInt(row.AS ?? "", 10) || undefined,
    shotsOnTargetHome: parseInt(row.HST ?? "", 10) || undefined,
    shotsOnTargetAway: parseInt(row.AST ?? "", 10) || undefined,
    cornersHome: parseInt(row.HC ?? "", 10) || undefined,
    cornersAway: parseInt(row.AC ?? "", 10) || undefined,
  };
  if (fthg !== undefined && fthg !== "") candidate.homeGoals = parseInt(fthg, 10);
  if (ftag !== undefined && ftag !== "") candidate.awayGoals = parseInt(ftag, 10);
  if (hthg !== undefined && hthg !== "") candidate.halfTimeHome = parseInt(hthg, 10);
  if (htag !== undefined && htag !== "") candidate.halfTimeAway = parseInt(htag, 10);
  if (b365h && b365d && b365a) {
    candidate.odds1x2 = {
      home: parseFloat(b365h),
      draw: parseFloat(b365d),
      away: parseFloat(b365a),
    };
  }
  if (over25 && under25) {
    candidate.oddsOverUnder25 = { over: parseFloat(over25), under: parseFloat(under25) };
  }
  return candidate;
}

function csvToRows(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

function readCsvFiles(): { path: string; content: string }[] {
  if (!fs.existsSync(DATA_DIR)) return [];
  const files = fs.readdirSync(DATA_DIR);
  const result: { path: string; content: string }[] = [];
  for (const f of files) {
    if (!f.endsWith(".csv")) continue;
    const full = path.join(DATA_DIR, f);
    try {
      result.push({ path: full, content: fs.readFileSync(full, "utf-8") });
    } catch {
      // skip
    }
  }
  return result;
}

export function createCsvProvider(): FixtureOddsProvider {
  return {
    async getFixturesByDate(date: string): Promise<FixtureCandidate[]> {
      const all: FixtureCandidate[] = [];
      for (const { content } of readCsvFiles()) {
        const rows = csvToRows(content);
        for (const row of rows) {
          const cand = parseRow(row);
          if (cand && cand.fixtureDate === date) all.push(cand);
        }
      }
      return all;
    },

    async getResultsForFixture(): Promise<null> {
      return null;
    },

    async getOddsForFixture(): Promise<{ marketType: string; outcomeLabel: string; oddsValue: number }[]> {
      return [];
    },
  };
}

export function loadAllCsvCandidates(): FixtureCandidate[] {
  const all: FixtureCandidate[] = [];
  for (const { content } of readCsvFiles()) {
    const rows = csvToRows(content);
    for (const row of rows) {
      const cand = parseRow(row);
      if (cand) all.push(cand);
    }
  }
  return all;
}
