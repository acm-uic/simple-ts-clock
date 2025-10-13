{
  self,
  lib,
  buildNpmPackage,
}:

buildNpmPackage rec {
  pname = "acmclock";
  version = "420.69";

  src = ../.;

  npmDepsHash = "sha256-1QUpj1J4aC5JkykyRZHmRFXns5+S1rv4wtrxqSRP5WE=";
}
