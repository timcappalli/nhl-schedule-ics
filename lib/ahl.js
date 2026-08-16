const axios = require('axios');

const KEY = 'ccb91f29d6744675';
const CLIENT_CODE = 'ahl';
const LEAGUE_ID = 4;
const FEED_BASE = 'https://lscluster.hockeytech.com/feed/index.php';
const ICAL_URL = 'https://lscluster.hockeytech.com/components/calendar/ical_add_games.php';

function parseJsonp(text) {
  const trimmed = text.trim();
  const inner = trimmed.startsWith('(') && trimmed.endsWith(')') ? trimmed.slice(1, -1) : trimmed;
  return JSON.parse(inner);
}

async function fetchSeasons() {
  try {
    const response = await axios.get(FEED_BASE, {
      params: { feed: 'modulekit', view: 'seasons', key: KEY, client_code: CLIENT_CODE, league_id: LEAGUE_ID, lang: 'en' },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching AHL seasons:', error);
    throw error;
  }
}

function resolveSeasonId(seasons, seasonArg) {
  const shortname = `${seasonArg.slice(0, 4)}-${seasonArg.slice(6, 8)}`;
  const match = seasons.find(s => s.shortname === shortname && s.playoff === '0');
  if (!match) {
    throw new Error(`No AHL regular-season match found for season "${seasonArg}" (looked for shortname "${shortname}").`);
  }
  return match.season_id;
}

async function fetchTeamsForSeason(seasonId) {
  try {
    const response = await axios.get(FEED_BASE, {
      params: { feed: 'statviewfeed', view: 'teamsForSeason', season: seasonId, key: KEY, client_code: CLIENT_CODE, league_id: LEAGUE_ID, lang: 'en' },
    });
    return parseJsonp(response.data);
  } catch (error) {
    console.error(`Error fetching AHL teams for season ${seasonId}:`, error);
    throw error;
  }
}

function resolveTeam(teams, teamCode) {
  const match = teams.find(t => t.id !== -1 && t.team_code?.toUpperCase() === teamCode.toUpperCase());
  if (!match) {
    throw new Error(`Unknown AHL team code "${teamCode}".`);
  }
  return { id: match.id, name: match.name };
}

async function fetchScheduleGameIds(teamId, seasonId) {
  try {
    const response = await axios.get(FEED_BASE, {
      params: {
        feed: 'statviewfeed', view: 'schedule', team: teamId, season: seasonId, location: 'homeaway',
        key: KEY, client_code: CLIENT_CODE, site_id: 3, league_id: LEAGUE_ID, conference_id: -1, division_id: -1, lang: 'en',
      },
    });
    const data = parseJsonp(response.data);
    const ids = [];
    for (const section of data[0]?.sections ?? []) {
      for (const item of section.data ?? []) {
        if (item.row?.game_id) ids.push(item.row.game_id);
      }
    }
    return ids;
  } catch (error) {
    console.error(`Error fetching AHL schedule for team ${teamId}:`, error);
    throw error;
  }
}

async function fetchGameDetails(gameIds) {
  try {
    const response = await axios.get(ICAL_URL, {
      params: { client_code: CLIENT_CODE, game_ids: gameIds.join(',') },
      responseType: 'text',
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching AHL game details:', error);
    throw error;
  }
}

function parseIcalEvents(icsText) {
  return icsText.split('BEGIN:VEVENT').slice(1).map(block => {
    block = block.split('END:VEVENT')[0];
    const get = key => block.match(new RegExp(`^${key}:(.*)$`, 'm'))?.[1]?.trim() ?? null;
    const uid = get('UID');
    const dtstart = get('DTSTART');
    const summary = get('SUMMARY') ?? '';
    const [awayTeamName, homeTeamName] = summary.split(' @ ');
    const id = uid?.match(/(\d+)@hockeytech\.com/)?.[1] ?? uid;
    const startTimeUTC = dtstart
      ? `${dtstart.slice(0, 4)}-${dtstart.slice(4, 6)}-${dtstart.slice(6, 8)}T${dtstart.slice(9, 11)}:${dtstart.slice(11, 13)}:${dtstart.slice(13, 15)}Z`
      : null;
    return {
      id,
      startTimeUTC,
      awayTeamName,
      homeTeamName,
      venue: get('LOCATION'),
      gameCenterUrl: null,
      isPlayoff: false,
    };
  });
}

async function getNormalizedSchedule(teamCode, season) {
  const seasons = await fetchSeasons();
  const seasonId = resolveSeasonId(seasons.SiteKit.Seasons, season);

  const teamsData = await fetchTeamsForSeason(seasonId);
  const { id: teamId, name: teamName } = resolveTeam(teamsData.teams, teamCode);

  const gameIds = await fetchScheduleGameIds(teamId, seasonId);
  if (gameIds.length === 0) return { teamName, games: [] };

  const icsText = await fetchGameDetails(gameIds);
  const games = parseIcalEvents(icsText);

  return { teamName, games };
}

module.exports = { getNormalizedSchedule };
