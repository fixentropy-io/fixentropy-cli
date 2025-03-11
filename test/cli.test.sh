#!/usr/bin/env bats

setup() {
  tmpdir="$(mktemp -d)"
  export SCRIPT_DIR="$tmpdir"

  # Copy cli.sh to tmpdir
  cp ./dist/cli.sh "$tmpdir/cli.sh"
  chmod +x "$tmpdir/cli.sh"

  # Create dummy executables
  for exe in dragee-macos-x64 dragee-macos-arm64 dragee-linux dragee-windows.exe; do
    echo '#!/usr/bin/env bash' > "$tmpdir/$exe"
    echo "echo \"Executed $exe: \$@\"" >> "$tmpdir/$exe"
    chmod +x "$tmpdir/$exe"
  done
}

teardown() {
  rm -rf "$tmpdir"
}

@test "Should execute macOS x64 binary" {
  export FAKE_OS="Darwin" FAKE_ARCH="x86_64" SCRIPT_DIR="$tmpdir"
  run bash "$SCRIPT_DIR/cli.sh" arg1 arg2 arg1 arg2
  # echo "Output: $output"
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Executed dragee-macos-x64: arg1 arg2" ]]
}

@test "Should execute macOS arm64 binary" {
  export FAKE_OS="Darwin" FAKE_ARCH="arm64" SCRIPT_DIR="$tmpdir"
  run bash "$SCRIPT_DIR/cli.sh" arg1 arg2 arg1
  # echo "Output: $output"
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Executed dragee-macos-arm64: arg1" ]]
}

@test "Should execute Linux binary" {
  export FAKE_OS="Linux" FAKE_ARCH="x86_64" SCRIPT_DIR="$tmpdir"
  run bash "$SCRIPT_DIR/cli.sh" arg1 arg2 --test
  # echo "Output: $output"
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Executed dragee-linux: arg1 arg2 --test" ]]
}

@test "Should execute Windows binary" {
  export FAKE_OS="MINGW64_NT-10.0" FAKE_ARCH="x86_64" SCRIPT_DIR="$tmpdir"
  run bash "$SCRIPT_DIR/cli.sh" arg1 arg2 test1 test2
  # echo "Output: $output"
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Executed dragee-windows.exe: arg1 arg2 test1 test2" ]]
}

@test "Should fail if no valid platform is detected" {
  export FAKE_OS="Solaris" FAKE_ARCH="sparc" SCRIPT_DIR="$tmpdir"
  run bash "$SCRIPT_DIR/cli.sh" arg1 arg2
  # echo "Output: $output"
  [ "$status" -ne 0 ]
  [[ "$output" =~ "Not running on a supported platform." ]]
}
