const axios = require('axios');
const ics = require('ics');
const { writeFileSync } = require('fs')

// UPDATE THESE
const TEAM = "BOS";
const SEASON = "20242025";

async function getTeamInfo() {
  try {
    const response = await axios.get(`https://api.nhle.com/stats/rest/en/team`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching team details:`, error);
    throw error;
  }
}

const findTeamName = (input, triCode) => {
  const team = input.find(team => team.triCode === triCode);
  return team ? team.fullName : null;
};

function convertToEpoch(isoString) {
  const date = new Date(isoString);
  return date.getTime();
}

async function getTeamSchedule(TEAM, SEASON) {
  try {
    const response = await axios.get(`https://api-web.nhle.com/v1/club-schedule-season/${TEAM}/${SEASON}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching schedule for ${TEAM}:`, error);
    throw error;
  }
};

(async () => {
  try {
    const teamInfo = await getTeamInfo();
    const teams = teamInfo.data;

    let teamName = findTeamName(teams, TEAM);

    const schedule = await getTeamSchedule(TEAM, SEASON);
    const games = schedule.games;

    let events = []

    for (const game of games) {
      let homeTeam = findTeamName(teams, game.homeTeam.abbrev);
      let awayTeam = findTeamName(teams, game.awayTeam.abbrev);
      let startTimeEpoch = convertToEpoch(game.startTimeUTC);

      let event = {
        uid: `NHL-${SEASON}-${TEAM}-${game.id}`,
        productId: `tc-nhl-to-ics`,
        method: "PUBLISH",
        start: startTimeEpoch,
        startInputType: "utc",
        startOutputType: "utc",
        duration: { hours: 2, minutes: 30 },
        title: `🏒 ${awayTeam} @ ${homeTeam}`,
        location: game.venue.default,
        url: `https://nhl.com${game.gameCenterLink}`,
        status: "CONFIRMED",
        calName: `${teamName} ${SEASON.substring(0, 4) + "-" + SEASON.substring(4)} Schedule`,
        transp: "TRANSPARENT",
        busyStatus: "FREE"
      }
      events.push(event);
    }

    ics.createEvents(events,
      (error, value) => {
        if (error) {
          console.log(error)
        }

        writeFileSync(`${__dirname}/${TEAM}-${SEASON}.ics`, value);
        console.log(`${teamName} ${SEASON.substring(0, 4) + "-" + SEASON.substring(4)} schedule .ics file successfully generated.`)
      })

  } catch (error) {
    console.error('Could not generate ics file:', error);
  }
})();