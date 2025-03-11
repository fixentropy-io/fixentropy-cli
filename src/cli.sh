#!/usr/bin/env bash
set -euo pipefail

# Define script path and directory (equivalent to __filename and __dirname)
script_path="$(realpath "$0")"
script_dir="$(dirname "$script_path")"

# Get platform and architecture information
platform="$(uname -s)"
architecture="$(uname -m)"

if [[ -n "${FAKE_OS:-}" ]]; then platform="$FAKE_OS"; fi
if [[ -n "${FAKE_ARCH:-}" ]]; then architecture="$FAKE_ARCH"; fi

executablePath=""

case "$platform" in
  Darwin)
    if [[ "$architecture" == "x86_64" || "$architecture" == "x64" ]]; then
      executablePath="$script_dir/dragee-macos-x64"
    elif [[ "$architecture" == "arm64" || "$architecture" == "aarch64" ]]; then
      executablePath="$script_dir/dragee-macos-arm64"
    else
      echo "Could not find a proper executable for your device." >&2
      exit 1
    fi
    ;;
  Linux)
    executablePath="$script_dir/dragee-linux"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    executablePath="$script_dir/dragee-windows.exe"
    ;;
  *)
    echo "Not running on a supported platform."
    exit 1
    ;;
esac

# Optional: Check if the executable exists and is executable
if [ ! -x "$executablePath" ]; then
  echo "Executable $executablePath is not found or not executable." >&2
  exit 1
fi

# Print debugging information
echo "*** script_dir: $script_dir, script_path: $script_path ***"
# Trim unwanted newlines
executablePath="$(echo "$executablePath" | tr -d '\n' | tr -d '\r')"
echo "Attempting to execute: $executablePath with arguments: $*"



# Launch the executable with additional arguments and environment variables
NODE_ENV=production TOTO="i feel the rain" "$executablePath" "$@"
exit_code=$?

echo "Process exited with code $exit_code"
exit $exit_code