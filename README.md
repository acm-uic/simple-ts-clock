# Simple Typescript Clock

A simple, maybe not so simple clock replacement for the office of ACM@UIC.

## Features

* Time and Date
* CTA Bus and Train Arrival Times
* Weather from DarkSky

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
4. Run `npm install` to install dependencies.
5. Run `npm run build` to make `npm run start` work (I haven't investigated why this is necessary).

### How to use

1. Run `npm run start` to start the npm server or `npm run watch` to watch for changes.
2. Navigate the browser to `locahost:8080` or the port specified in the `.env` config.

### Offline Mode

Offline mode will disable api requests to the server leaving only the clock running. It can be activated by going to `/offline` path.

### Demo Mode
Demo mode works like offline mode but displays demo information instead of real data from apis. It can be activated by going to `/demo` path.

### Configuration
To override the default config, you can use the URL GET parameters or by pressing `c` to open the config options.

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
