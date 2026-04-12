# DPG v2

**Deterministic Password Generator**

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
* Clipboard usage is inherently unsafe (best-effort clearing only)
* A hosted web version should be treated as a demo, not trusted for real use
* This is a tool for technically literate users

---

## 🧰 Features (current)

* Deterministic password generation
* Argon2id-based key derivation
* Canonical context encoding
* Bias-free character selection
* Profile-driven workflow
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
