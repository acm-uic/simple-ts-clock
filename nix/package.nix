{
  self,
  lib,
  buildNpmPackage,
}:

buildNpmPackage rec {
  pname = "acmclock";
  version = "420.69";

  src = ../.;

  npmDepsHash = "sha256-/N4Y0hYUtAyp2k9CpVkHZ5lf9bQNflvBZa4KMI5Phig=";
}
