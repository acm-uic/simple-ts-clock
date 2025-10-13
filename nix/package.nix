{
  self,
  lib,
  buildNpmPackage,
}:

buildNpmPackage rec {
  pname = "acmclock";
  version = "420.69";

  src = ../.;

  npmDepsHash = "sha256-HFSKQCJW1XbwGxFp4N7jE3l+XebdYSdTMoknuAog6kI=";
}
