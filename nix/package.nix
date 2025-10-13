{
  self,
  lib,
  buildNpmPackage,
}:

buildNpmPackage rec {
  pname = "acmclock";
  version = "420.69";

  src = ../.;

  npmDepsHash = "sha256-tPABjIpS5NL8FkU/dUluIPGhBnLa15IZLbxIKBxnnUA=";
}
