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

4. An .ics file will be generated in the working directory with the name `{TEAM}-{SEASON}.ics`.
