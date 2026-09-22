#!/usr/bin/env bash
set -euo pipefail

# Install codebase-memory-mcp on Arch Linux.
yay -S --needed codebase-memory-mcp-bin

# Install the shared pi packages.
packages=(
  "npm:@dietrichgebert/ponytail"
  "npm:pi-mcp-adapter"
  "npm:pi-subagents"
  "npm:pi-web-access"
  "npm:pi-cbm"
  "npm:pi-lmstudio"
)

for package in "${packages[@]}"; do
  pi install "$package"
done
