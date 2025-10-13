{
  self,
  lib,
  buildNpmPackage,
}:

buildNpmPackage rec {
  pname = "acmclock";
  version = "420.69";

  src = ../.;

  npmDepsHash = "sha256-VwVlYZej0ks4y62s98cKAtinTIf/jFr2Fm0oFB+B8Gc=";
}
