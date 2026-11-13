# Simple Typescript Clock

A simple, maybe not so simple clock replacement for the office of ACM@UIC.

## Features

* Time and date (Chicago time)
* Weather from the National Weather Service, in °F and °C, with rain, snow, lightning, clouds, and day/night sky effects
* CTA bus and train arrivals, grouped by line and direction, with delay, schedule-only, and crowding flags
* Today's ACM and LUG events from their public Google Calendars
* Event flyers from a shared Google Drive folder (see [How to add a flyer](#how-to-add-a-flyer))
* A ticker with NWS weather alerts, CTA service alerts, and recent GitHub activity
* QR codes for the ACM and LUG Discords

# Building and deployment

This project is built and deployed with the Nix package manager. The NPM
application can be built as follows:

```sh
nix build .#
```

This will produce a symlink called "result" in your local directory. The program
can be run as follows:

```sh
./result/bin/simple-ts-clock
```

## Usage
1. Clone the repository.
2. Navigate to the repository directory.
3. Create a `.env` file based on `.env.example`.
4. Run `npm install` to install dependencies. (See [CONTRIBUTING.md](CONTRIBUTING.md) before changing the set of dependencies.)
5. Run `npm run dev`.
6. Open `localhost:8080` in a browser (or the port set in `.env`).

`npm run build` type-checks and builds everything into `dist/`, and `npm start` runs that build.

### Offline Mode

Offline mode will disable api requests to the server leaving only the clock running. It can be activated by going to `/offline` path.

### Demo Mode
Demo mode works like offline mode but displays demo information instead of real data from apis. It can be activated by going to `/demo` path.

### Configuration
Settings are constants in the code. There are no URL parameters or settings screen.

* **Secrets** (API keys) go in `.env` locally, and in `enc.env` on the clock. See `.env.example` for the list: `CTA_BUS_API_KEY`, `CTA_TRAIN_API_KEY`, `GOOGLE_API_KEY`, and the optional `GITHUB_TOKEN`.
* **What the clock shows** is set at the top of the matching `src/util/get*.ts` file: bus stops and train stations (`getTransit.ts`), the weather location (`getWeather.ts`), the calendars (`getEvents.ts`), the flyers folder (`getFlyers.ts`), and the ticker's CTA routes and GitHub orgs (`getMessages.ts`).
* **The Discord QR codes** are the images in `frontend/public/qr/`, and the links behind them are in `src/qrCodeUrls.ts`. If an invite changes, update the link and replace the image, for example with `npx qrcode -e H -o frontend/public/qr/acmDiscord.png <new link>`.
* Panels with no data (or no key yet) are skipped, so a missing key never breaks the page.

For testing, `?wx=clear|cloudy|rain|snow|storm|fog`, `?wxi=light|normal|heavy`, and `?wxtime=night` force the weather effects. Pressing `R` on a keyboard reloads the page.

### How to add a flyer
The flyers panel shows images from the shared [Put Clock Flyers Here](https://drive.google.com/drive/folders/1P5ww7kSd9eH6Cc_kTazQcaO-fGglCUgy) Drive folder, one per rotation.

1. Export the flyer as **PNG or JPG** (phone photos in HEIC format won't show). Tall (portrait) flyers fill the screen best.
2. Start the file name with the event date, `MM-DD-YY` or `YYYY-MM-DD`, e.g. `11-14-26 Stump The Professors.png`. The flyer is shown through that date and hidden automatically afterwards. Files without a date stay until you remove them.
3. Drop it into the folder. The clock picks it up within about 5 minutes.

Files over 15 MB are skipped, so keep exports reasonably small.

## Deployment

To deploy to ACM's clock machine, simply run

```sh
./deploy
```

This repo is set to poll and auto upgrade the ACM clock machine every day
automatically from the contents of this repo.

To deploy outside ACM, first use [agenix](https://github.com/ryantm/agenix) to
encrypt an env file containing the secrets (based on .env.example) replace the
current `enc.env` file. You can encrypt your file to the SSH host key of the
target machine. The `enc.env` file in the repo will decrypt on ACM's clock
machine.

Then, edit the system configuration at `nix/system.nix` to your liking and
deploy:

```
nixos-rebuild switch --flake .#acmclock --build-host root@yourmachine --target-host root@yourmachine
```
Make sure to change `system.autoUpgrade` to point to your repo, or disable it.


# Authors

This project was originally a rewrite of [sudoclock](https://github.com/acm-uic/sudoclock) by [clee231](https://github.com/clee231).

The project has since been rewritten mostly in the [simple-js-clock](https://github.com/bmiddha/simple-js-clock) repo by [bmiddha](https://github.com/bmiddha) and other contributors.

In January 2023, the simple-js-clock repo was forked to continue development here.

In February 2025, @SohamG and @clee231 updated the app to Node 20 and added the
Nix-based build and deployment.
