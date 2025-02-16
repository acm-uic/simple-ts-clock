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
