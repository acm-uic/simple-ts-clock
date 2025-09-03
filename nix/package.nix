{
  self,
  lib,
  buildNpmPackage,
}:

buildNpmPackage rec {
  pname = "acmclock";
  version = "420.69";

  src = ../.;

  npmDepsHash = "sha256-x5Z1ag2jKbh9eNAs2TN62QZJIEOGuuxmfaVQVfMv+JM=";
}
