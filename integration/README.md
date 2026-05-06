# Integration Tests (TSV Harness)

Welcome to the integration test suite for **dpg-cli**.

These tests verify end-to-end CLI behavior using a simple, declarative format based on **TSV (tab-separated values)**. Each row represents a complete test case: command, input, expectations, and exit code.

The goal is to keep tests:
- easy to read
- easy to write
- easy to extend
- and robust across environments

---

## 🧠 Philosophy

This is not a general-purpose test framework.

It is a **small, purpose-built DSL** for testing CLI behavior with minimal ceremony and maximum clarity.

> Prefer clarity over cleverness, and explicit behavior over implicit magic.

---

## 📋 File format

Each test is a single TSV row with the following columns:

| Column           | Description                                  |
|------------------|----------------------------------------------|
| name             | Unique test identifier                       |
| command          | CLI command to execute                       |
| stdin            | Input to pass via stdin (`-` = none)         |
| exit             | Expected exit code                           |
| stdout mode      | `exact` or `contains`                        |
| stdout expected  | Expected stdout content                      |
| stderr mode      | `exact` or `contains`                        |
| stderr expected  | Expected stderr content                      |

Example:

```
list-basic	dpg-cli --list	-	0	contains	github-main	exact	-
```

---

## 🔤 Escaping rules

To keep the TSV file tool-friendly (GitHub, IntelliJ), we avoid literal quotes and special characters.

Instead, we use a minimal escape system:

| Sequence | Meaning        |
|----------|----------------|
| `\q`     | `"` (quote)    |
| `\n`     | newline        |

Example:

```
contains	\qsortBy\q: \qlabel\q
```

This will be interpreted by the harness as:

```
..."sortBy": "label"...
```

Multiline example:

```
exact	line1\nline2
```

This will be interpreted by the harness as:

```
line1
line2
```

---

## ⚙️ Command field

Commands are written as they would be typed in the shell.

If arguments contain spaces, wrap them using `\q`:

```
dpg-cli --config \qeditor=vi -f\q
```

The harness will unescape this before execution.

---

## 📥 stdin handling

- Use `-` to indicate no stdin
- Otherwise, provide input (supports `\n`)

Example:

```
some-test	dpg-cli --command	password123	0	exact	...	exact	-
```

stdin is passed with a trailing newline, matching typical terminal behavior.

---

## 🔍 Matching modes

### `exact`
Output must match exactly (after normalization).

### `contains`
Output must contain the expected string.

Examples:

```
exact	Success
contains	github.com
```

---

## 🧪 Writing tests

### Keep tests simple
Each row should express one behavior clearly.

### Prefer `contains` unless format is critical
Use `exact` only when the full output structure matters.

### Use real CLI output when possible
Avoid constructing artificial outputs — match what the tool actually produces.

---

## 🧹 Style guidelines

- No literal quotes (`"`); always use `\q`
- Keep rows readable — this file is meant to be scanned by humans
- Avoid clever tricks; explicit is better
- Group related tests together logically

---

## 🧓 Notes from the Grumpy Code Reviewer

- If your test needs five backslashes, your test is wrong
- If tools complain, either ignore them intentionally — or fix the format
- Tests should be boring, predictable, and hard to break

---

## 🚀 Why this exists

This harness gives us:

- fast feedback
- strong regression protection
- confidence when refactoring
- a clear, executable specification of CLI behavior

And now — thanks to normalized escaping — it also plays nicely with editors and tooling.

---

Happy testing 👣
```
