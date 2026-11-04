const { getText } = require('./http');

const FEED_BASE = 'https://lscluster.hockeytech.com/feed/index.php';
const ICAL_URL = 'https://lscluster.hockeytech.com/components/calendar/ical_add_games.php';

function parseJsonp(text) {
  const trimmed = text.trim();
  const inner = trimmed.startsWith('(') && trimmed.endsWith(')') ? trimmed.slice(1, -1) : trimmed;
  return JSON.parse(inner);
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

function createHockeyTechLeague({ label, key, clientCode, leagueId, siteId }) {
  const baseParams = { key, client_code: clientCode, league_id: leagueId, lang: 'en' };

  async function fetchSeasons() {
    try {
      return parseJsonp(await getText(FEED_BASE, { feed: 'modulekit', view: 'seasons', ...baseParams }));
    } catch (error) {
      console.error(`Error fetching ${label} seasons:`, error);
      throw error;
    }
  }

  function resolveSeasonId(seasons, seasonArg) {
    const shortname = `${seasonArg.slice(0, 4)}-${seasonArg.slice(6, 8)}`;
    const regular = seasons.filter(s => s.playoff === '0');
    const match =
      regular.find(s => s.shortname === shortname) ??
      regular.find(s => s.season_name === `${shortname} Regular Season`);
    if (!match) {
      throw new Error(`No ${label} regular-season match found for season "${seasonArg}" (looked for "${shortname}").`);
    }
    return match.season_id;
  }

  async function fetchTeamsForSeason(seasonId) {
    try {
      return parseJsonp(await getText(FEED_BASE, { feed: 'statviewfeed', view: 'teamsForSeason', season: seasonId, ...baseParams }));
    } catch (error) {
      console.error(`Error fetching ${label} teams for season ${seasonId}:`, error);
      throw error;
    }
  }

  function resolveTeam(teams, teamCode) {
    const match = teams.find(t => t.id !== -1 && t.team_code?.toUpperCase() === teamCode.toUpperCase());
    if (!match) {
      throw new Error(`Unknown ${label} team code "${teamCode}".`);
    }
    return { id: match.id, name: match.name };
  }

  async function fetchScheduleGameIds(teamId, seasonId) {
    try {
      const data = parseJsonp(await getText(FEED_BASE, {
        feed: 'statviewfeed', view: 'schedule', team: teamId, season: seasonId, location: 'homeaway',
        site_id: siteId, conference_id: -1, division_id: -1, ...baseParams,
      }));
      const ids = [];
      for (const section of data[0]?.sections ?? []) {
        for (const item of section.data ?? []) {
          if (item.row?.game_id) ids.push(item.row.game_id);
        }
      }
      return ids;
    } catch (error) {
      console.error(`Error fetching ${label} schedule for team ${teamId}:`, error);
      throw error;
    }
  }

  async function fetchGameDetails(gameIds) {
    try {
      return await getText(ICAL_URL, { client_code: clientCode, game_ids: gameIds.join(',') });
    } catch (error) {
      console.error(`Error fetching ${label} game details:`, error);
      throw error;
    }
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

  return { getNormalizedSchedule };
}

module.exports = { createHockeyTechLeague };
