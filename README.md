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
dpg -p github-main
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

Verbose output:

```
npm run test:verbose
```

Slow Argon2 tests only:

```
npm run test:slow
```

---

## CLI

DPG v2 includes a CLI for generating passwords from existing profiles.

### Generate from profile

    dpg -p github-main

This will:

- load the profile with label `github-main`
- prompt for the master password
- generate the current password
- copy it to the clipboard

### Show the generated password

    dpg -p github-main --show

This also prints the generated password to stdout.

### Create a new profile

    dpg --new github-work

Creates a new profile with sensible defaults.

Rules:
- label must be unique
- label may contain only letters, digits, dot, underscore, and hyphen
- spaces are not allowed

### List profiles

    dpg --list

This prints the available profiles in sorted order.

### Bump a profile counter without saving

    dpg -b github-main

This will:

- load the profile
- increment the counter in memory only
- generate the password for the bumped counter
- copy it to the clipboard
- report the old and new counter values

### Bump and save

    dpg -b github-main --save

This does the same thing, but also persists the incremented counter back to `profiles.json`, and reports it as saved.

### Bump, save, and show

    dpg -b github-main --save --show

This also prints the generated password to stdout.

### Help

    dpg --help

### Profiles file location

DPG v2 looks for profiles here by default:

- macOS/Linux: `~/.dpg-v2/profiles.json`
- Windows: `%USERPROFILE%\.dpg-v2\profiles.json`

### Installation for local development

    npm install
    npm link

After that, the `dpg` command should be available in your shell.

### Clipboard support

DPG v2 uses native platform tools:

- macOS: `pbcopy`
- Windows: `clip`
- Linux: `wl-copy`, `xclip`, or `xsel`
- (planned) Best-effort clipboard cleaning where supported

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
