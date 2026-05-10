#!/usr/bin/env bash
set -uo pipefail

REAL_HOME="$HOME"
TEST_HOME="$(mktemp -d)"
HASH_LIMIT=4
HARD_STOP=500

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

mkdir -p "$DPG_DIR"

cat > "$CONFIG_FILE" <<'JSON'
{
  "timeout": 90,
  "sortBy": "label",
  "editor": "",
  "hashAbbrev": 1
}
JSON

cat > "$PROFILES_FILE" <<'JSON'
[]
JSON

echo "Running short-hash expansion test..."
echo "Test HOME: $TEST_HOME"
echo
START_TS=$(date +%s)
START_TIME=$(date +"%H:%M:%S")

n=0

while true; do
  label=$(printf "label_%04d" "$n")

  start_ms=$(node -e 'console.log(Date.now())')

  output=$(dpg-cli --new "$label" 2>&1)
  exit_code=$?

  end_ms=$(node -e 'console.log(Date.now())')
  duration_ms=$((end_ms - start_ms))

  if [[ "$exit_code" -ne 0 ]]; then
    echo "FAIL: dpg-cli --new $label exited $exit_code"
    echo "$output"
    exit 1
  fi

  hash_abbrev=$(node -e '
    const fs = require("fs")
    const cfg = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))
    console.log(cfg.hashAbbrev)
  ' "$CONFIG_FILE")

  profile_count=$(node -e '
    const fs = require("fs")
    const profiles = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))
    console.log(profiles.length)
  ' "$PROFILES_FILE")

  hash_lengths=$(node -e '
    const fs = require("fs")
    const profiles = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))
    console.log([...new Set(profiles.map(p => p.ctxHash?.length ?? 0))].join(","))
  ' "$PROFILES_FILE")

  printf "n=%04d profiles=%s hashAbbrev=%s ctxHashLengths=%s duration=%sms\n" \
    "$n" "$profile_count" "$hash_abbrev" "$hash_lengths" "$duration_ms"

  if [[ "$hash_abbrev" -ge $HASH_LIMIT ]]; then
    break
  fi

  n=$((n + 1))

  if [[ "$n" -gt "$HARD_STOP" ]]; then
    echo "FAIL: hashAbbrev did not reach $HASH_LIMIT within $HARD_STOP profiles"
    exit 1
  fi
done

echo
echo "PASS: short-hash expansion reached hashAbbrev=${hash_abbrev}"

END_TS=$(date +%s)
DURATION=$(awk "BEGIN { printf \"%.2f\", $END_TS - $START_TS }")

echo "   Start at  $START_TIME"
echo "   Duration  ${DURATION}s"
