# NHL/AHL/PWHL Team Schedule ICS Generator

## Usage

1. Clone the repository

```bash
git clone git@github.com:timcappalli/nhl-schedule-ics.git
```

2. Install dependencies

```bash
cd nhl-schedule-ics
npm install
```

3. Run the generator with your team's short code and season identifier:

```bash
node app.js --team BOS --season 20252026
```

AHL example:

```bash
node app.js --team PRO --season 20252026 --league AHL
```

PWHL example:

```bash
node app.js --team BOS --season 20252026 --league PWHL
```

### Options

| Flag | Description |
|------|-------------|
| `--team` | **Required.** Three-letter team code (e.g. `BOS`, or `PRO` for AHL, or `BOS`/`MTL`/`NY` for PWHL) |
| `--season` | **Required.** Season identifier in `YYYYYYYY` format (e.g. `20252026`). Used as-is for NHL; for AHL and PWHL it is resolved internally to the matching HockeyTech regular season. |
| `--league` | League to use: `NHL` (default), `AHL`, or `PWHL` |
| `--future-only` | Only include games that have not yet started |
| `--playoffs-only` | Only include playoff games. **NHL only** — combining with `--league AHL` or `--league PWHL` exits with an error. |

Both `--future-only` and `--playoffs-only` can be combined to output only upcoming playoff games.

Note: AHL and PWHL calendar events do not include a game-center `url` link, since there's no reliable public deep-link source available for those games.

4. An .ics file will be generated in the working directory with the name `{TEAM}-{SEASON}[-playoffs][-future].ics` for NHL, or `{LEAGUE}-{TEAM}-{SEASON}[-future].ics` for AHL/PWHL (e.g. `PWHL-BOS-20252026.ics`).
