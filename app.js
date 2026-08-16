const ics = require('ics');
const fs = require('fs/promises');

const LEAGUE_MODULES = {
  NHL: require('./lib/nhl'),
  AHL: require('./lib/ahl'),
};

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, val, i, arr) => {
    if (val.startsWith('--')) {
      const next = arr[i + 1];
      acc.push([val.slice(2), (!next || next.startsWith('--')) ? true : next]);
    }
    return acc;
  }, [])
);
const TEAM = args.team?.toUpperCase();
const SEASON = args.season;
const LEAGUE = (args.league || 'NHL').toUpperCase();
const FUTURE_ONLY = 'future-only' in args;
const PLAYOFFS_ONLY = 'playoffs-only' in args;

if (!TEAM || !SEASON) {
  console.error('Usage: node app.js --team <TEAM> --season <SEASON> [--league <NHL|AHL>] [--future-only] [--playoffs-only]\n  Example (NHL): node app.js --team BOS --season 20252026\n  Example (AHL): node app.js --team PRO --season 20252026 --league AHL');
  process.exit(1);
}

if (!LEAGUE_MODULES[LEAGUE]) {
  console.error(`Unsupported league "${LEAGUE}". Supported leagues: ${Object.keys(LEAGUE_MODULES).join(', ')}.`);
  process.exit(1);
}

if (LEAGUE === 'AHL' && PLAYOFFS_ONLY) {
  console.error('--playoffs-only is not currently supported for --league AHL.');
  process.exit(1);
}

function convertToEpoch(isoString) {
  return new Date(isoString).getTime();
}

(async () => {
  try {
    const { teamName, games: rawGames } = await LEAGUE_MODULES[LEAGUE].getNormalizedSchedule(TEAM, SEASON);
    let schedule = rawGames;

    if (FUTURE_ONLY) schedule = schedule.filter(game => new Date(game.startTimeUTC) > new Date());
    if (PLAYOFFS_ONLY) schedule = schedule.filter(game => game.isPlayoff);

    const events = schedule.map(game => ({
      uid: `${LEAGUE}-${SEASON}-${TEAM}-${game.id}`,
      productId: `tc-${LEAGUE.toLowerCase()}-to-ics`,
      method: "PUBLISH",
      start: convertToEpoch(game.startTimeUTC),
      startInputType: "utc",
      startOutputType: "utc",
      duration: { hours: 2, minutes: 30 },
      title: `🏒 ${game.awayTeamName} @ ${game.homeTeamName}`,
      location: game.venue,
      ...(game.gameCenterUrl ? { url: game.gameCenterUrl } : {}),
      status: "CONFIRMED",
      calName: `${teamName} ${SEASON.substring(0, 4) + "-" + SEASON.substring(4)} Schedule${LEAGUE !== 'NHL' ? ` (${LEAGUE})` : ''}`,
      transp: "TRANSPARENT",
      busyStatus: "FREE"
    }));

    console.log(events)

    const icsContent = ics.createEvents(events);

    const filePrefix = LEAGUE === 'NHL' ? '' : `${LEAGUE}-`;
    const suffix = (PLAYOFFS_ONLY ? '-playoffs' : '') + (FUTURE_ONLY ? '-future' : '');
    await fs.writeFile(`${__dirname}/${filePrefix}${TEAM}-${SEASON}${suffix}.ics`, icsContent.value);
    console.log(`${teamName} ${SEASON.substring(0, 4) + "-" + SEASON.substring(4)} schedule .ics file successfully generated.`);

  } catch (error) {
    console.error('Could not generate ics file:', error);
  }
})();
