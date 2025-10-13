{
  self,
  lib,
  buildNpmPackage,
}:

buildNpmPackage rec {
  pname = "acmclock";
  version = "420.69";

  src = ../.;

  npmDepsHash = "sha256-C6jss2KePVe+JKDu3wfndZqqFbaXi0tAPiLq5Wu0uz4=";
}
