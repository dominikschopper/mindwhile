export const DATA_FORMAT_VERSION = 1;
export const APP_ID = 'mindwhile';
export const profileKind = 'profile';

export interface Profile {
  playerId: string;
  gamerTag: string;
  gamerSymbol: string;
  gamerTagChangedAt: number;
}

export interface StoredResult {
  gameId: string;
  gameVersion: number;
  level: string;
  seed: number;
  scoreValues: number[];
  scoringVersion: number;
}

export interface ProfileData {
  profile: Profile;
  best: StoredResult[];
}

export interface WireProfile {
  player: string;
  tag: string;
  symbol: string;
  tagat: number;
}

export interface WireStoredResult {
  game: string;
  gamev: number;
  lvl: string;
  seed: number;
  score: number[];
  scorev: number;
}

export interface ProfileEnvelope {
  app: string;
  fmtv: number;
  kind: string;
  profile: WireProfile;
  best: WireStoredResult[];
}

export function profileToWire(profile: Profile): WireProfile {
  return {
    player: profile.playerId,
    tag: profile.gamerTag,
    symbol: profile.gamerSymbol,
    tagat: profile.gamerTagChangedAt,
  };
}

export function profileFromWire(wire: WireProfile): Profile {
  return {
    playerId: wire.player,
    gamerTag: wire.tag,
    gamerSymbol: wire.symbol,
    gamerTagChangedAt: wire.tagat,
  };
}

export function storedResultToWire(result: StoredResult): WireStoredResult {
  return {
    game: result.gameId,
    gamev: result.gameVersion,
    lvl: result.level,
    seed: result.seed,
    score: [...result.scoreValues],
    scorev: result.scoringVersion,
  };
}

export function storedResultFromWire(wire: WireStoredResult): StoredResult {
  return {
    gameId: wire.game,
    gameVersion: wire.gamev,
    level: wire.lvl,
    seed: wire.seed,
    scoreValues: [...wire.score],
    scoringVersion: wire.scorev,
  };
}

export function serializeProfile(data: ProfileData): ProfileEnvelope {
  return {
    app: APP_ID,
    fmtv: DATA_FORMAT_VERSION,
    kind: profileKind,
    profile: profileToWire(data.profile),
    best: data.best.map(storedResultToWire),
  };
}
