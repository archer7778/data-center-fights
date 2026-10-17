# Data Center Fights

**[archer7778.github.io/data-center-fights](https://archer7778.github.io/data-center-fights/)**

A sourced map of US data center fights: where communities stopped data centers, where projects went ahead despite opposition, where the fight is still going, and where they were approved quietly. Each case has a short history, a dated timeline, both sides' arguments and links to its sources. Alongside the map are a megawatt ledger and four national measures of how fast the buildout is growing.

![Map of US data center fights by outcome](https://archer7778.github.io/data-center-fights/cards/index.png)

## What's in it

- **The map and timeline.** Pins appear when a project became public and take their outcome color when it was decided. Press Play to watch it unfold from 2022 to today. Each outcome also has its own shape, so color isn't needed to read it.
- **A page for every case,** with its own link and share card, so a single fight can be posted on its own.
- **The megawatt ledger:** announced or planned capacity by outcome, and decisions over time.
- **The national buildout:** construction spending on data centers (Census Bureau), their share of US electricity (Lawrence Berkeley National Laboratory), the largest AI sites (Epoch AI) and projects blocked or delayed by local opposition (Data Center Watch).
- **The data,** as [CSV](https://archer7778.github.io/data-center-fights/data/sites.csv) and [JSON](https://archer7778.github.io/data-center-fights/data/sites.json).

## Method

- **A documented sample, not a census.** The cases are well-reported fights chosen to show each outcome, so fights are over-represented. The US has about 4,800 data centers of all sizes; most were never contested in public.
- **Outcomes.** *Stopped*: rejected, withdrawn or banned after public opposition (developers sometimes move elsewhere). *Approved despite opposition*: went ahead over organized objections. *Still being fought*: approval is in court or not final. *Little or no organized opposition*: we searched and found no organized campaign at the time of approval; individual objections and later complaints are noted. Absence of coverage isn't proof nobody objected.
- **Dates.** A case appears at the earliest date we could source (an announcement, filing or first coverage) and takes its outcome on the date of the decision that set its current status.
- **Megawatts** are announced or planned maximums from developers, utilities or filings, not measured use. Many projects never publish one, especially those stopped early, so totals undercount. Power-plant capacity is not counted as data-center load.
- **Cause.** A project is called stopped by opposition only when sources link the two. Both sides' arguments are given where reported.
- **Privacy.** Private residents are not named; public officials, companies and organized groups are.
- **Checking.** Every case lists its sources and the date it was last checked. Histories are our own summaries; they don't copy the source articles.

## Contribute

- **[Suggest a case](https://github.com/archer7778/data-center-fights/issues/new?template=new-case.yml)** or **[report a correction](https://github.com/archer7778/data-center-fights/issues/new?template=correction.yml).** A public source link is required for both.
- Cases live in [`data/sites.json`](data/sites.json). Each one needs an `id`, name, place, state, coordinates (town level is enough), `outcome`, `start` and `decided` dates, a one-line `summary` (160 characters at most, used on share cards), a short `history`, a `timeline`, `objections`, `case_for`, `sources` and a `checked` date. `node tools/validate.mjs` lists anything missing or malformed, and runs automatically on every pull request.

## Build it yourself

Node 20 or newer, and Chrome or Chromium for the share cards.

```sh
npm ci
node tools/validate.mjs   # check the data
node tools/build.mjs      # site/ : the map, a page per case, CSV and JSON
node tools/cards.mjs      # site/cards/ : share images (set CHROME_PATH if Chrome isn't found)
```

Every push to `main` rebuilds and publishes the site through GitHub Actions.

## Licence

- **Code:** [MIT](LICENSE).
- **Data and case histories:** [CC BY 4.0](LICENSE-DATA.md). Reuse them freely, including commercially, with credit to *Data Center Fights* and a link to this project.
- **Map outlines:** [us-atlas](https://github.com/topojson/us-atlas) (ISC), from US Census Bureau data.
- National figures belong to their publishers and are credited and linked on the site.

Independent project. Not affiliated with any developer, utility, campaign or agency.
