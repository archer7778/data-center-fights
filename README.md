# Data Center Fights

**[archer7778.github.io/data-center-fights](https://archer7778.github.io/data-center-fights/)**

A sourced map of US data center fights: where communities stopped data centers, where projects went ahead despite opposition, where the fight is still going, and where they were approved quietly. Each case has a short history, a dated timeline, both sides' arguments and links to its sources. Alongside the map are a megawatt ledger and four national measures of how fast the buildout is growing.

![Map of US data center fights by outcome](https://archer7778.github.io/data-center-fights/cards/index.png)

## What's in it

- **The map and timeline.** Pins appear when a project became public and take their outcome color when it was decided. Press Play to watch it unfold from 2022 to today. Each outcome also has its own shape, so color isn't needed to read it. Pin size shows announced megawatts, with a key under the legend.
- **The biggest AI campuses:** a separate layer of the 77 US sites in Epoch AI's dataset of the largest AI data centers, sized by Epoch's estimate of power in use today, with a full table. It is not part of the fights and isn't counted in the findings. Refresh it with `node tools/campuses.mjs` after replacing `data/sources/epoch-data-centers.csv`.
- **Filters:** search by name, place, developer or company, or narrow by state or by feature (state regulator, new gas power, NDAs, court, withdrawn, ballot, unnamed end user).
- **A page for every case,** with its own link and share card, so a single fight can be posted on its own.
- **Findings:** patterns across the cases (where state regulators decide, projects with their own gas power, how fast winning fights are, anonymity, size, courts, megawatt disclosure, ballots), counted live from the data. Each finding links to the cases behind it.
- **The megawatt ledger:** announced or planned capacity by outcome, and decisions over time.
- **The national buildout:** construction spending on data centers (Census Bureau), their share of US electricity (Lawrence Berkeley National Laboratory), the largest AI sites (Epoch AI) and projects blocked or delayed by local opposition (Data Center Watch).
- **Every source,** listed by case in [SOURCES.md](SOURCES.md).
- **The data,** as [CSV](https://archer7778.github.io/data-center-fights/data/sites.csv) and [JSON](https://archer7778.github.io/data-center-fights/data/sites.json).

## Method

- **A documented sample, not a census.** The cases are well-reported fights chosen to show each outcome, so fights are over-represented. The US has about 4,800 data centers of all sizes; most were never contested in public.
- **Outcomes.** *Stopped*: rejected, withdrawn or banned after public opposition (developers sometimes move elsewhere). *Approved despite opposition*: went ahead over organized objections; some approvals still face lawsuits. *Still being fought*: a decision is still pending, or the approval is at trial and construction has not begun; on the timeline these count as undecided until the current fight began (`contested_from`). *Little or no organized opposition*: we searched and found no organized campaign at the time of approval; individual objections and later complaints are noted. Absence of coverage isn't proof nobody objected.
- **Dates.** A case appears at the earliest date we could source (an announcement, filing or first coverage) and takes its outcome on the date of the decision that set its current status.
- **Megawatts** are announced or planned maximums from developers, utilities or filings, not measured use. Many projects never publish one, especially those stopped early, so totals undercount. Power-plant capacity is not counted as data-center load.
- **Cause.** A project is called stopped by opposition only when sources link the two. Both sides' arguments are given where reported.
- **Privacy.** Private residents are not named; public officials, companies and organized groups are.
- **Attribution.** Any claim that a person or company did something wrong is attributed to whoever made it, with the response where one was reported.
- **Right of reply.** Anyone named can ask for a correction or for their response to be added, through the [right of reply form](https://github.com/archer7778/data-center-fights/issues/new?template=right-of-reply.yml). Requests are reviewed within a few days, and significant corrections are noted on the case.
- **Checking.** Every case lists its sources and the date it was last checked. Histories are our own summaries; they don't copy the source articles.

## Contribute

- **[Suggest a case](https://github.com/archer7778/data-center-fights/issues/new?template=new-case.yml)** or **[report a correction](https://github.com/archer7778/data-center-fights/issues/new?template=correction.yml).** A public source link is required for both.
- Cases live in [`data/sites.json`](data/sites.json). Each one needs an `id`, name, place, state, coordinates (town level is enough), `outcome`, `start` and `decided` dates (or `contested_from` for a case still being fought), a one-line `summary` (160 characters at most, used on share cards), a short `history`, a `timeline`, `objections`, `case_for`, `sources` and a `checked` date. Cases can also carry `tags`, assigned by hand from the sources and defined at the top of `sites.json` (`state-regulator`, `new-gas`, `nda`, `court`, `withdrawn`, `ballot`, `anonymous`); the findings are counted from them. `node tools/validate.mjs` lists anything missing or malformed, and runs automatically on every pull request.

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
- **AI campuses layer:** [Epoch AI, AI data centers](https://epoch.ai/data/data-centers) (Creative Commons Attribution), US sites only, placed at town level; see [LICENSE-DATA.md](LICENSE-DATA.md).
- **Map outlines:** [us-atlas](https://github.com/topojson/us-atlas) (ISC), from US Census Bureau data.
- National figures belong to their publishers and are credited and linked on the site.

Independent project. Not affiliated with any developer, utility, campaign or agency.
