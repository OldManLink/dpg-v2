#!/usr/bin/env bash

set -uo pipefail

PASS=0
FAIL=0

GREEN="\033[0;32m"
RED="\033[0;31m"
RESET="\033[0m"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

DPG_DIR="${HOME}/.dpg-v2"
PROFILES_FILE="${DPG_DIR}/profiles.json"
CONFIG_FILE="${DPG_DIR}/config.json"

PROFILES_BACKUP_FILE="${DPG_DIR}/profiles.json.bak.integration"
CONFIG_BACKUP_FILE="${DPG_DIR}/config.json.bak.integration"

restore_files() {
  if [[ -f "$PROFILES_BACKUP_FILE" ]]; then
    mv -f "$PROFILES_BACKUP_FILE" "$PROFILES_FILE"
    echo
    echo "Restored original profiles.json"
  else
    rm -f "$PROFILES_FILE"
    echo
    echo "Removed test profiles.json"
  fi

  if [[ -f "$CONFIG_BACKUP_FILE" ]]; then
    mv -f "$CONFIG_BACKUP_FILE" "$CONFIG_FILE"
    echo "Restored original config.json"
  else
    rm -f "$CONFIG_FILE"
    echo "Removed test config.json"
  fi
}

match_output() {
  local mode="$1"
  local expected="$2"
  local actual="$3"

  if [[ "$expected" == "-" ]]; then
    expected=""
  fi

  case "$mode" in
    exact)
      [[ "$actual" == "$expected" ]]
      ;;
    contains)
      [[ "$actual" == *"$expected"* ]]
      ;;
    *)
      echo "Unknown match mode: $mode" >&2
      return 2
      ;;
  esac
}

cleanup() {
  restore_files
  rm -rf "$FAKE_BIN_DIR"
}

trap cleanup EXIT

FAKE_BIN_DIR="$(mktemp -d)"

cp "${SCRIPT_DIR}/fake-bin/xclip" "${FAKE_BIN_DIR}/xclip"
chmod +x "${FAKE_BIN_DIR}/xclip"

export PATH="${FAKE_BIN_DIR}:$PATH"

mkdir -p "$DPG_DIR"

if [[ -f "$PROFILES_FILE" ]]; then
  mv -f "$PROFILES_FILE" "$PROFILES_BACKUP_FILE"
  echo "Backed up existing profiles.json"
else
  echo "No existing profiles.json found; test suite will create its own"
fi

if [[ -f "$CONFIG_FILE" ]]; then
  mv -f "$CONFIG_FILE" "$CONFIG_BACKUP_FILE"
  echo "Backed up existing config.json"
else
  echo "No existing config.json found; test suite will create its own"
fi

cp "${SCRIPT_DIR}/profiles.json" "$PROFILES_FILE"
cp "${SCRIPT_DIR}/config.json" "$CONFIG_FILE"

echo "Running integration tests..."
echo

while IFS= read -r line || [[ -n "$line" ]]; do
[[ -z "$line" || "$line" == \#* ]] && continue
IFS=$'\t' read -r name cmd stdin expected_exit stdout_match expected_stdout stderr_match expected_stderr <<< "$line"

if [[ -z "$stdout_match" || -z "$stderr_match" ]]; then
  echo -e "${RED}FAIL${RESET}: malformed TSV row"
  echo "$line"
  ((FAIL++))
  echo
  continue
fi

  echo "→ $name"

stdout_file="$(mktemp)"
stderr_file="$(mktemp)"

if [[ "$stdin" != "-" ]]; then
  printf '%s\n' "$stdin" | eval "$cmd" >"$stdout_file" 2>"$stderr_file"
  exit_code=$?
else
  eval "$cmd" >"$stdout_file" 2>"$stderr_file"
  exit_code=$?
fi

stdout_content="$(cat "$stdout_file")"
stderr_content="$(cat "$stderr_file")"

rm -f "$stdout_file" "$stderr_file"

if [[ "$exit_code" != "$expected_exit" ]]; then
  echo -e "${RED}FAIL${RESET}: expected exit $expected_exit, got $exit_code"
  echo "stdout:"
  echo "$stdout_content"
  echo "stderr:"
  echo "$stderr_content"
  ((FAIL++))
  echo
  continue
fi

if ! match_output "$stdout_match" "$expected_stdout" "$stdout_content"; then
  echo -e "${RED}FAIL${RESET}: stdout mismatch ($stdout_match)"
  echo "Expected stdout:"
  echo "$expected_stdout"
  echo "Actual stdout:"
  echo "$stdout_content"
  ((FAIL++))
  echo
  continue
fi

if ! match_output "$stderr_match" "$expected_stderr" "$stderr_content"; then
  echo -e "${RED}FAIL${RESET}: stderr mismatch ($stderr_match)"
  echo "Expected stderr:"
  echo "$expected_stderr"
  echo "Actual stderr:"
  echo "$stderr_content"
  ((FAIL++))
  echo
  continue
fi

echo -e "${GREEN}PASS${RESET}"
((PASS++))
echo

done < <(tail -n +2 "${SCRIPT_DIR}/tests.tsv")

echo "Summary: $PASS passed, $FAIL failed"

if [[ "$FAIL" -ne 0 ]]; then
  exit 1
fi
