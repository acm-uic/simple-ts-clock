{ config, pkgs, self, ... }:

{
  imports = [
    # Include the results of the hardware scan.
    ./hardware-configuration.nix
  ];

  nix = {
    settings.experimental-features = "nix-command flakes";
  };

  age.secrets.acmclock = {
    file = "${self}/enc.env";
  };

  # Use the systemd-boot EFI boot loader.
  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  networking.hostName = "acmclock"; # Define your hostname.
  # Pick only one of the below networking options.
  # networking.wireless.enable = true;  # Enables wireless support via wpa_supplicant.
  networking.networkmanager.enable = true; # Easiest to use and most distros use this by default.

  # Set your time zone.
  time.timeZone = "America/Chicago";


  # Enable sound.
  # sound.enable = true;
  hardware.pulseaudio.enable = true;

  # Enable touchpad support (enabled default in most desktopManager).
  #  services.xserver.libinput.enable = true;

  # Define a user account. Don't forget to set a password with ‘passwd’.
  users.users.acmrunner = {
    isNormalUser = true;
    extraGroups = [ "docker" ]; # Enable ‘sudo’ for the user.
    packages = with pkgs; [ ];
  };
  users.users.acmadmin = {
    isNormalUser = true;
    extraGroups = [
      "wheel"
      "docker"
    ]; # Enable ‘sudo’ for the user.
    packages = with pkgs; [ ];
    hashedPassword = "$6$HduAaAHn/F1Ji1x0$DLwEDbLHNJTlD4MAQ4KseOpM5/q2BPOMzjZLDMqxl63CnsfQhW4EdODRQsWkxwtJc4Jl1mED/MYj8I9u3CDak.";
    openssh = {
      authorizedKeys = {
        keys = [
          "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDoa0YA2ib7vs3VgjivUW1BL/1qVCq6+tMbx91NdDU5EljYYT9ToaGisaT8/OcbmsUAES0t/lDa65v26PWR9yhuj1UJoqVNZfnQTvaGaVaXWrBEY1wEb+bxJNws1xTUzjTwuWkH0uKz/vwpNzAPzMnLGAjcnLcwm4Yvxd9Ec76U835Cl8wI8/f51flHChkPi5HKQSYAR3aM1ZJ+j93pe5XxXA6l5QTDm4+3nmZHzzbYODSAznkTfPQ5F/iXG0xNN3zRaiBcYIbG/MV644U+ycdy7kAB3AMgwjgz2TaChBy5wQt81U7shAQGVY4NKruhXa/gRltYJ7fqkbTT97fQ3Spho1A9/ZtftAFKZAeGfBPHg/WglUFNpbg8LMgCOfUNcfXcNB1DkzorIj41zQuTGoRAB5U3DGbIvayH11v0WRAVpd/+TRjpln2Mr+Idvf7qs+uxUkUR+qVP65GI6dIyWKEsLpRTr85PbrRsNkEThG1F7Yp+bUZ57SpmnWHUob0en3k= chase"
        ];
      };
    };
  };

  services.cage = let
    run = pkgs.writeScriptBin "rotator" ''
       #!/usr/bin/env bash
       ret=1;  
       while test $ret -ne 0; do
             ${pkgs.wlr-randr}/bin/wlr-randr --output DP-3 --transform=90
             ret=$?
       done 
       ${pkgs.google-chrome}/bin/google-chrome-stable --simulate-outdated-no-au="01 Jan 2099" --kiosk "http://localhost:8080";
      '';
in {
    enable = true;
    program = "${run}/bin/rotator";
    user = "acmrunner";
    # extraArguments = [ "-r" ];
  };

  # wait for network and DNS
  # systemd.services."cage-tty1" = {
  #   wants =  [
  #     "graphical.target"
  #   ];
  #   wantedBy =  [];
  #   before = [];
 
  #   # Restart cage if it closes
  #   serviceConfig = {
  #     Restart = "always";
  #   };
  #   unitConfig = {
  #     StartLimitBurst = 10;
  #   };
  # };

  systemd.services."acmclock" = {
    name = "acmclock.service";
    wantedBy = [ "multi-user.target" ];
    serviceConfig = {
      ExecStart = "${self.packages.x86_64-linux.default}/bin/simple-ts-clock";
      Restart = "always";
      EnvironmentFile = config.age.secrets.acmclock.path;
    };
    enable = true;
  };
 

  # List packages installed in system profile. To search, run:
  # $ nix search wget
  environment.systemPackages = with pkgs; [
    neovim # Do not forget to add an editor to edit configuration.nix! The Nano editor is also installed by default.
    wget
    curl
    google-chrome
    git
    docker-compose
    self.inputs.agenix.packages."${system}".default
  ];

  # Some programs need SUID wrappers, can be configured further or are
  # started in user sessions.
  # programs.mtr.enable = true;
  programs.gnupg.agent = {
    enable = true;
    enableSSHSupport = true;
  };

  # Install additional fonts for emojis and other utilized fonts
  fonts.packages = with pkgs; [
    noto-fonts
    noto-fonts-cjk-sans
    noto-fonts-emoji
  ];

  # Installing Docker
  virtualisation.docker.enable = true;

  # List services that you want to enable:

  # Enable the OpenSSH daemon.
  services.openssh.enable = true;

  # Open ports in the firewall.
  networking.firewall.allowedTCPPorts = [ 22 ];
  # networking.firewall.allowedUDPPorts = [ ... ];
  # Or disable the firewall altogether.
  # networking.firewall.enable = false;

  # Copy the NixOS configuration file and link it from the resulting system
  # (/run/current-system/configuration.nix). This is useful in case you
  # accidentally delete configuration.nix.
  # system.copySystemConfiguration = true;

  # This value determines the NixOS release from which the default
  # settings for stateful data, like file locations and database versions
  # on your system were taken. It‘s perfectly fine and recommended to leave
  # this value at the release version of the first install of this system.
  # Before changing this value read the documentation for this option
  # (e.g. man configuration.nix or on https://nixos.org/nixos/options.html).
  system.stateVersion = "22.11"; # Did you read the comment?
  nixpkgs.config.allowUnfree = true;
}
