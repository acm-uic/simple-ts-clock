{
  description = "ACMClock Packaging and Deployment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-24.11";
    agenix.url = "github:ryantm/agenix";
  };

  outputs =
    {
      self,
      nixpkgs,
      agenix,
    }:
    let
      pkgs = import nixpkgs {
        system = "x86_64-linux";
        config.allowUnfree = true;
      };

      acmclock = pkgs.callPackage ./nix/package.nix {
        inherit self;
      };

    in
    {
      packages.x86_64-linux.default = acmclock;

      nixosConfigurations.acmclock = nixpkgs.lib.nixosSystem {
        system = "x86-64_linux";
        modules = [
          ./nix/system.nix
          agenix.nixosModules.default
        ];
        specialArgs = { inherit self; };
      };

    };
}
