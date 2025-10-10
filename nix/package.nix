{
  self,
  lib,
  buildNpmPackage,
}:

buildNpmPackage rec {
  pname = "acmclock";
  version = "420.69";

  src = ../.;

  npmDepsHash = "sha256-7t0Xmxk2XKgJh3/pjeIiPl8Mp8coA6mWLGGe/InCSjY=";
}
