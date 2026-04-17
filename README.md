# NHL Team Schedule ICS Generator

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

### Options

| Flag | Description |
|------|-------------|
| `--team` | **Required.** Three-letter team code (e.g. `BOS`) |
| `--season` | **Required.** Season identifier in `YYYYYYYY` format (e.g. `20252026`) |
| `--future-only` | Only include games that have not yet started |
| `--playoffs-only` | Only include playoff games |

Both `--future-only` and `--playoffs-only` can be combined to output only upcoming playoff games.

4. An .ics file will be generated in the working directory with the name `{TEAM}-{SEASON}.ics`.
