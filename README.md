# NHL/AHL Team Schedule ICS Generator

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

### Options

| Flag | Description |
|------|-------------|
| `--team` | **Required.** Three-letter team code (e.g. `BOS`, or `PRO` for AHL) |
| `--season` | **Required.** Season identifier in `YYYYYYYY` format (e.g. `20252026`). Used as-is for NHL; for AHL it is resolved internally to the matching hockeytech season. |
| `--league` | League to use: `NHL` (default) or `AHL` |
| `--future-only` | Only include games that have not yet started |
| `--playoffs-only` | Only include playoff games. **NHL only** — combining with `--league AHL` exits with an error. |

Both `--future-only` and `--playoffs-only` can be combined to output only upcoming playoff games.

Note: AHL calendar events do not include a game-center `url` link, since there's no reliable public deep-link source available for AHL games.

4. An .ics file will be generated in the working directory with the name `{TEAM}-{SEASON}[-playoffs][-future].ics` for NHL, or `AHL-{TEAM}-{SEASON}[-future].ics` for AHL.
