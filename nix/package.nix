{
  self,
  lib,
  buildNpmPackage,
}:

buildNpmPackage rec {
  pname = "acmclock";
  version = "420.69";

  src = ../.;

  npmDepsHash = "sha256-oSj3TesiaVj5l3XNyB0pPJ1o1yi4BilVYJEctgMKirs=";
}
