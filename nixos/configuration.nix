{ config, pkgs, ... }:

{
  imports =
    [ # Include the results of the hardware scan.
      ./hardware-configuration.nix
    ];

  # Use the systemd-boot EFI boot loader.
  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  networking.hostName = "acmclock"; # Define your hostname.
  # Pick only one of the below networking options.
  # networking.wireless.enable = true;  # Enables wireless support via wpa_supplicant.
  networking.networkmanager.enable = true;  # Easiest to use and most distros use this by default.

  # Set your time zone.
  time.timeZone = "America/Chicago";

  # Configure network proxy if necessary
  # networking.proxy.default = "http://user:password@proxy:port/";
  # networking.proxy.noProxy = "127.0.0.1,localhost,internal.domain";

  # Select internationalisation properties.
  # i18n.defaultLocale = "en_US.UTF-8";
  # console = {
  #   font = "Lat2-Terminus16";
  #   keyMap = "us";
  #   useXkbConfig = true; # use xkbOptions in tty.
  # };

  # Enable the X11 windowing system.
  # services.xserver.enable = true;
#  services.getty.autologinUser = "acmrunner";
#
#  systemd.targets = {
#    "autologin-tty1" = {
#      requires = [ "multi-user.target" ];
#      after = [ "multi-user.target" ];
#      unitConfig.AllowIsolate = "yes";
#    };
#  };
#
#  systemd.services = {
#    "autovt@tty1" = {
#      enable = true;
#      restartIfChanged = false;
#      description = "autologin service at tty1";
#      after = [ "suppress-kernel-logging.service" ];
#      wantedBy = [ "autologin-tty1.target" ];
#      serviceConfig = {
#        ExecStart =  builtins.concatStringsSep " " ([
#          "@${pkgs.utillinux}/sbin/agetty"
#          "agetty --login-program ${pkgs.shadow}/bin/login"
#          "--autologin acmrunner --noclear %I $TERM"
#        ]);
#        Restart = "always";
#        Type = "idle";
#      };
#    };
#    "suppress-kernel-logging" = {
#      enable = true;
#      restartIfChanged = false;
#      description = "suppress kernel logging to the console";
#      after = [ "multi-user.target" ];
#      wantedBy = [ "autologin-tty1.target" ];
#      serviceConfig = {
#        ExecStart = "${pkgs.utillinux}/sbin/dmesg -n 1";
#        Type = "oneshot";
#      };
#    };
#  };

  # Configure keymap in X11
  # services.xserver.layout = "us";
  # services.xserver.xkbOptions = {
  #   "eurosign:e";
  #   "caps:escape" # map caps to escape.
  # };

  # Enable CUPS to print documents.
  # services.printing.enable = true;

  # Enable sound.
  sound.enable = true;
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
    extraGroups = [ "wheel" "docker" ]; # Enable ‘sudo’ for the user.
    packages = with pkgs; [ ];
    hashedPassword = "$6$HduAaAHn/F1Ji1x0$DLwEDbLHNJTlD4MAQ4KseOpM5/q2BPOMzjZLDMqxl63CnsfQhW4EdODRQsWkxwtJc4Jl1mED/MYj8I9u3CDak.";
    openssh = {
      authorizedKeys = {
        keys = ["ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDoa0YA2ib7vs3VgjivUW1BL/1qVCq6+tMbx91NdDU5EljYYT9ToaGisaT8/OcbmsUAES0t/lDa65v26PWR9yhuj1UJoqVNZfnQTvaGaVaXWrBEY1wEb+bxJNws1xTUzjTwuWkH0uKz/vwpNzAPzMnLGAjcnLcwm4Yvxd9Ec76U835Cl8wI8/f51flHChkPi5HKQSYAR3aM1ZJ+j93pe5XxXA6l5QTDm4+3nmZHzzbYODSAznkTfPQ5F/iXG0xNN3zRaiBcYIbG/MV644U+ycdy7kAB3AMgwjgz2TaChBy5wQt81U7shAQGVY4NKruhXa/gRltYJ7fqkbTT97fQ3Spho1A9/ZtftAFKZAeGfBPHg/WglUFNpbg8LMgCOfUNcfXcNB1DkzorIj41zQuTGoRAB5U3DGbIvayH11v0WRAVpd/+TRjpln2Mr+Idvf7qs+uxUkUR+qVP65GI6dIyWKEsLpRTr85PbrRsNkEThG1F7Yp+bUZ57SpmnWHUob0en3k= chase"];
      };
    };
  };

  services.cage = {
    enable = true;
    program = "${pkgs.google-chrome}/bin/google-chrome-stable --disable-http-cache--simulate-outdated-no-au=\"01 Jan 2099\" --kiosk \"http://localhost:8080\"";
    user = "acmrunner";
    extraArguments = [ "-r" ];
  };

  # wait for network and DNS
  systemd.services."cage-tty1".after = [
    "network-online.target"
    "systemd-resolved.service"
  ];
  # Restart cage if it closes
  systemd.services."cage-tty1".serviceConfig = {
    Restart = "always";
  };
  systemd.services."cage-tty1".unitConfig= {
    StartLimitBurst = 10;
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
  ];

  # Some programs need SUID wrappers, can be configured further or are
  # started in user sessions.
  # programs.mtr.enable = true;
  programs.gnupg.agent = {
    enable = true;
    enableSSHSupport = true;
  };

  # Install additional fonts for emojis and other utilized fonts
  fonts.fonts = with pkgs; [
    noto-fonts
    noto-fonts-cjk
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
  system.copySystemConfiguration = true;

  # This value determines the NixOS release from which the default
  # settings for stateful data, like file locations and database versions
  # on your system were taken. It‘s perfectly fine and recommended to leave
  # this value at the release version of the first install of this system.
  # Before changing this value read the documentation for this option
  # (e.g. man configuration.nix or on https://nixos.org/nixos/options.html).
  system.stateVersion = "22.11"; # Did you read the comment?
  nixpkgs.config.allowUnfree = true;
}
