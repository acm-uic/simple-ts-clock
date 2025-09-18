{
  self,
  lib,
  buildNpmPackage,
}:

buildNpmPackage rec {
  pname = "acmclock";
  version = "420.69";

  src = ../.;

  npmDepsHash = "sha256-07OKhqsC06cn0/R1eAhXylw3WobFVGDAaIz5bHMn06o=";
}
