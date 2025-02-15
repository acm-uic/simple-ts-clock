{
  self,
  lib,
  buildNpmPackage,
}:

buildNpmPackage rec {
  pname = "acmclock";
  version = "420.69";

  src = ../.;

  npmDepsHash = "sha256-BALaPYoDA/cxXJ0WbmqkpbYCvu0FOX/MsoiAsE6SIAI=";
}
