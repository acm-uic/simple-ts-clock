{
  self,
  lib,
  buildNpmPackage,
}:

buildNpmPackage rec {
  pname = "acmclock";
  version = "420.69";

  src = ../.;

  npmDepsHash = "sha256-jnzi1fEne3B1Le26GDwCRQauYZTu9I6nZAPlhCJ8ars=";
}
