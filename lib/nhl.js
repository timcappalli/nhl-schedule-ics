const axios = require('axios');

async function getTeamInfo() {
  try {
    const response = await axios.get(`https://api.nhle.com/stats/rest/en/team`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching team details:`, error);
    throw error;
  }
}

function findTeamName(teams, triCode) {
  return teams.find(team => team.triCode === triCode)?.fullName || null;
}

async function getTeamSchedule(team, season) {
  try {
    const response = await axios.get(`https://api-web.nhle.com/v1/club-schedule-season/${team}/${season}`);
    return response.data.games;
  } catch (error) {
    console.error(`Error fetching schedule for ${team}:`, error);
    throw error;
  }
}

async function getNormalizedSchedule(team, season) {
  const teams = await getTeamInfo();
  const teamName = findTeamName(teams, team);
  const schedule = await getTeamSchedule(team, season);

  const games = schedule.map(game => ({
    id: game.id,
    startTimeUTC: game.startTimeUTC,
    awayTeamName: findTeamName(teams, game.awayTeam.abbrev),
    homeTeamName: findTeamName(teams, game.homeTeam.abbrev),
    venue: game.venue.default,
    gameCenterUrl: `https://nhl.com${game.gameCenterLink}`,
    isPlayoff: game.gameType === 3,
  }));

  return { teamName, games };
}

module.exports = { getNormalizedSchedule };
