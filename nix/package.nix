{
  self,
  lib,
  buildNpmPackage,
}:

buildNpmPackage rec {
  pname = "acmclock";
  version = "420.69";

  src = ../.;

  npmDepsHash = "sha256-huBkNQMNRBkhfC+wiT31+0Ds3ew9jJE0WUblFtz8mhw=";
}
