{
  self,
  lib,
  buildNpmPackage,
}:

buildNpmPackage rec {
  pname = "acmclock";
  version = "420.69";

  src = ../.;

  npmDepsHash = "sha256-1Bvg82lAgnbzs2XwZBE+2YCjbqIEiV2PkEqjkis0qiI=";
}
