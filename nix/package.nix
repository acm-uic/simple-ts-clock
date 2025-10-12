{
  self,
  lib,
  buildNpmPackage,
}:

buildNpmPackage rec {
  pname = "acmclock";
  version = "420.69";

  src = ../.;

  npmDepsHash = "sha256-nO4XcPE1FNGRPEm+uyl8xR+4Fly/QTooeFbDW2ce2dg=";
}
