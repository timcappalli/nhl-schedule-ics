const axios = require('axios');
const ics = require('ics');
const fs = require('fs/promises');

// UPDATE THESE
const TEAM = "BOS";
const SEASON = "20242025";

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

function convertToEpoch(isoString) {
  return new Date(isoString).getTime();
}

async function getTeamSchedule(TEAM, SEASON) {
  try {
    const response = await axios.get(`https://api-web.nhle.com/v1/club-schedule-season/${TEAM}/${SEASON}`);
    return response.data.games;
  } catch (error) {
    console.error(`Error fetching schedule for ${TEAM}:`, error);
    throw error;
  }
};

(async () => {
  try {
    const teams = await getTeamInfo();
    const teamName = findTeamName(teams, TEAM);
    const schedule = await getTeamSchedule(TEAM, SEASON);

      const events = schedule.map(game => ({
        uid: `NHL-${SEASON}-${TEAM}-${game.id}`,
        productId: `tc-nhl-to-ics`,
        method: "PUBLISH",
        start: convertToEpoch(game.startTimeUTC),
        startInputType: "utc",
        startOutputType: "utc",
        duration: { hours: 2, minutes: 30 },
        title: `🏒 ${findTeamName(teams, game.awayTeam.abbrev)} @ ${findTeamName(teams, game.homeTeam.abbrev)}`,
        location: game.venue.default,
        url: `https://nhl.com${game.gameCenterLink}`,
        status: "CONFIRMED",
        calName: `${teamName} ${SEASON.substring(0, 4) + "-" + SEASON.substring(4)} Schedule`,
        transp: "TRANSPARENT",
        busyStatus: "FREE"
      }));

      console.log(events)
      
      const icsContent = ics.createEvents(events);

      await fs.writeFile(`${__dirname}/${TEAM}-${SEASON}.ics`, icsContent.value);
      console.log(`${teamName} ${SEASON.substring(0, 4) + "-" + SEASON.substring(4)} schedule .ics file successfully generated.`);

  } catch (error) {
    console.error('Could not generate ics file:', error);
  }
})();