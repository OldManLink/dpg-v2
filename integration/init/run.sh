#!/usr/bin/env bash
set -uo pipefail

REAL_HOME="$HOME"
TEST_HOME="$(mktemp -d)"

START_TS=$(date +%s)
START_TIME=$(date +"%H:%M:%S")

cleanup() {
  export HOME="$REAL_HOME"
  rm -rf "$TEST_HOME"
}

on_interrupt() {
  cleanup
  exit 130
}

trap cleanup EXIT
trap on_interrupt INT TERM

export HOME="$TEST_HOME"

DPG_DIR="${HOME}/.dpg-v2"
CONFIG_FILE="${DPG_DIR}/config.json"
PROFILES_FILE="${DPG_DIR}/profiles.json"

echo "Running init integration tests..."
echo "Test HOME: $TEST_HOME"
echo

fail() {
  echo "FAIL: $1"
  exit 1
}

assert_file_exists() {
  local file="$1"
  [[ -f "$file" ]] || fail "Expected file to exist: $file"
}

assert_contains() {
  local haystack="$1"
  local needle="$2"
  [[ "$haystack" == *"$needle"* ]] || fail "Expected output to contain: $needle"
}

assert_json_value() {
  local file="$1"
  local expression="$2"
  local expected="$3"

  local actual
  actual="$(node -e "
    const fs = require('fs')
    const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'))
    console.log($expression)
  " "$file")"

  [[ "$actual" == "$expected" ]] || fail "Expected $expression to be '$expected', got '$actual'"
}

# Fresh init
output="$(dpg-cli --init 2>&1)"
exit_code=$?

[[ "$exit_code" -eq 0 ]] || fail "dpg-cli --init exited $exit_code: $output"

assert_contains "$output" "Created config.json"
assert_contains "$output" "Created profiles.json"

assert_file_exists "$CONFIG_FILE"
assert_file_exists "$PROFILES_FILE"

assert_json_value "$CONFIG_FILE" "data.timeout" "90"
assert_json_value "$CONFIG_FILE" "data.sortBy" "label"
assert_json_value "$CONFIG_FILE" "data.editor" ""
assert_json_value "$CONFIG_FILE" "data.hashAbbrev" "7"

profile_count="$(node -e "
  const fs = require('fs')
  const profiles = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'))
  console.log(profiles.length)
" "$PROFILES_FILE")"

[[ "$profile_count" == "0" ]] || fail "Expected empty profiles.json, got $profile_count profiles"

echo "PASS: fresh init creates config.json and profiles.json"

# Idempotency
output="$(dpg-cli --init 2>&1)"
exit_code=$?

[[ "$exit_code" -eq 0 ]] || fail "second dpg-cli --init exited $exit_code: $output"
assert_contains "$output" "Nothing to initialize"

echo "PASS: repeated init is idempotent"

END_TS=$(date +%s)
DIFF=$((END_TS - START_TS))

if date -d @0 +%H:%M:%S >/dev/null 2>&1; then
  ELAPSED=$(date -u -d "@$DIFF" +%H:%M:%S)
else
  ELAPSED=$(date -u -r "$DIFF" +%H:%M:%S)
fi

echo
echo "PASS: init integration tests completed"
echo "   Start at  $START_TIME"
echo "   Duration  $ELAPSED"
