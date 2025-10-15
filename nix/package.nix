{
  self,
  lib,
  buildNpmPackage,
}:

buildNpmPackage rec {
  pname = "acmclock";
  version = "420.69";

  src = ../.;

  npmDepsHash = "sha256-b1mlA+/kP7g4GQG7zxurX9hKKTe2vVHzIpanW0y9t2E=";
}
