![License: MIT](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Node](https://img.shields.io/badge/node-18%2B-brightgreen)
# DPG v2

> Local-first deterministic password generator.  
> No vault. No sync. No cloud. No password storage.

DPG v2 derives site-specific passwords from a master password plus structured profile metadata, so the same inputs always produce the same password.

## Current status

- Working CLI
- Profile-driven workflow
- Argon2id-based derivation
- Full automated test suite
- Planned offline browser UI

## Quick start

```bash
npm install
npm test
npm link
dpg-cli -p github-main
```

## Deterministic Password Generator

DPG v2 is a local-first password generator that **does not store passwords at all**.

Instead, it derives site-specific passwords deterministically from:

* a master password
* structured profile metadata (site, account, counter, etc.)

No vault. No sync. No cloud. No surprises.

---

## ✨ Why this exists

Traditional password managers store encrypted password vaults.

DPG v2 takes a different approach:

> **Store intent, not secrets — and recompute passwords when needed.**

This reduces:

* vault breach risk
* sync complexity
* dependency on external services

---

## 🧠 How it works

For each site, DPG v2:

1. Builds a **canonical context** from profile data
2. Derives a **site key** using Argon2id
3. Expands deterministic bytes using HMAC
4. Maps bytes to characters (without bias)
5. Guarantees required character classes
6. Deterministically shuffles the result

Same inputs → same password
Different inputs → completely different password

---

## 🔐 Security model

DPG v2 is **not** a password manager.

It relies on:

* a **strong master password**
* deterministic derivation
* no password storage

### Key properties

* No generated passwords are stored
* Profiles contain only low-risk metadata
* Password rotation is explicit (via `counter`)
* Entire system works offline

### Important caveats

* If your master password is weak, everything is weak
* Clipboard usage is inherently unsafe
* A hosted web version should be treated as a demo, not trusted for real use
* This is a tool for technically literate users

---

## 🧰 Features (current)

* Deterministic password generation
* Argon2id-based key derivation
* Canonical context encoding
* Bias-free character selection
* Profile-driven workflow
* Cross-platform CLI with profile generation, listing, and bump/save workflow
* Full test suite (fast + slow paths)

---

## 📁 Example profile

See `profiles.sample.json` in the repository root.

Example:

```
{
  "service": "github.com",
  "account": "name@example.com",
  "counter": 1,
  "length": 20,
  "require": ["lower", "upper", "digit", "symbol"]
}
```

---

## 🚀 Usage (development)

```
npm install
npm test
```

Verbose output (fast and slow tests):

```
npm run test:all
```

Slow Argon2 tests only:

```
npm run test:slow
```

---

## 🚀 Initialization

Before first use, initialize DPG storage:

```bash
dpg-cli --init
```

This creates:

- `~/.dpg-v2/config.json`
- `~/.dpg-v2/profiles.json`

Example output:

```text
Created config.json
Created profiles.json
```

The command is safe to run repeatedly.

If files already exist, DPG will leave them intact and only add any missing default config values when needed.

Example:

```text
Nothing to initialize
```

or:

```text
Updated config.json
```

---

## 💻 CLI

DPG v2 includes a CLI for generating passwords from existing profiles.

### Generate from profile

    dpg-cli -p github-main

This will:

- load the profile with label `github-main`
- prompt for the master password
- generate the current password
- copy it to the clipboard

### Show the generated password

    dpg-cli -p github-main --show

This also prints the generated password to stdout.

### Create a new profile

    dpg-cli --new github-work

Creates a new profile with sensible defaults.

Rules:
- label must be unique
- label may contain only letters, digits, dot, underscore, and hyphen
- spaces are not allowed

### Editing a profile

```bash
dpg-cli --edit <label>
```

Opens the specified profile in your editor as JSON.

You can modify the following fields:

- service
- account
- counter
- length
- require
- symbolSet

The following fields are not editable:

- label
- version
- createdAt
- updatedAt

#### Behavior

After saving and exiting the editor:

- The edited JSON is parsed and validated
- Invalid JSON or invalid values will be rejected and no changes will be saved
- If no changes were made, the command exits with:

```text
No changes made
```

- If changes were made:
    - The changed fields are listed
    - A warning is shown that the generated password will be affected
    - You are prompted to confirm before saving

Example:

```bash
dpg-cli --edit github-main
```

#### ⚠️ Important

Changes to a profile will affect the **generated password**.

---

### Editor configuration

You can configure which editor is used:

```bash
dpg-cli --config editor=vim
```

Editor selection follows this order:

1. Configured editor
2. $EDITOR environment variable
3. Fallback (vi)

### Delete a profile

    dpg-cli -D github-main

Prompts for confirmation before deleting the profile.

Only an explicit `y` confirms deletion. Any other response cancels it.

### List profiles

    dpg-cli --list

This prints the available profiles in sorted order.

### Bump a profile counter without saving

    dpg-cli -b github-main

This will:

- load the profile
- increment the counter in memory only
- generate the password for the bumped counter
- copy it to the clipboard
- report the old and new counter values

### Bump and save

    dpg-cli -b github-main --save

This does the same thing, but also persists the incremented counter back to `profiles.json`, and reports it as saved.

### Bump, save, and show

    dpg-cli -b github-main --save --show

This also prints the generated password to stdout.

### Show a profile

    dpg-cli --show-profile github-main

Prints the full profile as pretty-printed JSON.

Useful for:
- debugging
- verifying stored fields
- piping into tools such as `jq`

### Show config

    dpg-cli --config

Prints the current config as pretty-printed JSON.

### Update config

    dpg-cli --config timeout=900
    dpg-cli --config sortBy=label

Supported keys:
- `editor` — your preferred tool for editing profiles
- `hashAbbrev` — internal used, defaults to 7
- `sortBy` — currently only `label`
- `timeout` — non-negative integer seconds

### Help

    dpg-cli --help

### Profiles file location

DPG v2 looks for profiles here by default:

- macOS/Linux: `~/.dpg-v2/profiles.json`
- Windows: `%USERPROFILE%\.dpg-v2\profiles.json`

### Installation for local development

    npm install
    npm link

After that, the `dpg-cli` command should be available in your shell.

### Clipboard support

DPG v2 uses native platform tools:

- macOS: `pbcopy`
- Windows: `clip`
- Linux: `wl-copy`, `xclip`, or `xsel`
- (planned) Best-effort clipboard cleaning where supported
 
---

## 🚨 Duplicate Password Detection

DPG detects when two or more profiles would derive the same password and emits a warning during normal CLI usage.

Example:

```text
Warning: profiles derive the same password: github-home, github-work
```

Warnings are shown on commands such as:

- `--list`
- `--show-profile`
- `--profile`
- `--bump`
- `--edit`

This feature helps prevent accidental password reuse caused by duplicate profile contexts.

### How detection works

Each profile stores a `ctxHash` value derived from its canonical context.

The canonical context includes fields that affect password derivation, such as:

- service
- account
- counter
- length
- required character classes
- symbol set (when symbols are required)

Profiles with identical canonical contexts will produce identical passwords and therefore identical `ctxHash` values.

Duplicate detection works by grouping profiles with matching `ctxHash` values.

### Performance

`ctxHash` values are persisted in `profiles.json` so DPG does not need to recompute hashes for every profile on every command invocation.

Missing hashes are automatically backfilled when profiles are loaded.

`hashAbbrev` is managed automatically by DPG and should not be edited manually.

### Important note about manual editing

Manual editing of `profiles.json` is strongly discouraged.

If profile fields are modified outside DPG without updating the corresponding `ctxHash`, duplicate detection may produce false negatives (i.e. duplicates may not be detected).

DPG automatically keeps `ctxHash` values up to date when profiles are created or modified through the CLI.

---

## 🌐 Usage (planned)

The target deployment model is:

* download a `.zip`
* unpack anywhere
* open `index.html`
* generate passwords locally

No install. No backend. No network required.

---

## 🧪 Testing philosophy

The test suite uses two modes:

* **fast tests** with reduced Argon2 parameters
* **slow tests** with production parameters

This keeps development fast while still verifying the real KDF path.

### Test suites

- `npm test` — fast tests (includes golden regression checks)
- `npm run test:slow` — slow tests only
- `npm run test:all` — full test suite

## Integration test harness

A lightweight TSV-driven CLI integration harness lives in `integration/`.

Run it with:

    ./integration/run.sh

---

## 🧭 Project goals

* Keep the core logic simple and auditable
* Avoid hidden state or magic behavior
* Make the system easy to reason about months later
* Support fully local, offline usage
* Build a UI that feels like a proper desktop utility (yes, including buttons 😄)

---

## 🚫 Non-goals

DPG v2 is not trying to be:

* a cloud password manager
* a browser extension
* an enterprise identity system
* a “set and forget” solution

---

## ⚠️ Disclaimer

This project is under active development.

Before using it for real passwords:

* read the code
* understand the model
* test it yourself
* run it locally

---

## 📜 License

See `LICENSE`

## ₿ Support / Tip Jar

If you find this project useful, feel free to send a small tip:

**Bitcoin (BTC)**  
`bc1q33q5908wfmwt7h59zl70ad3260e4esnfjtj4xw`

No pressure — just a nod to the idea that sparked this project.
