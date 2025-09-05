{
  self,
  lib,
  buildNpmPackage,
}:

buildNpmPackage rec {
  pname = "acmclock";
  version = "420.69";

  src = ../.;

  npmDepsHash = "sha256-tnXwoQJaRgWdqTkvOIr+rGa0k3uhjPWaq48ayyd2mmI=";
}
