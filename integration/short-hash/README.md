# Short Hash Expansion Tests

This directory contains a dedicated integration/performance test suite for DPG's adaptive abbreviated context hash system (`ctxHash`).

The goal of these tests is to validate:

- abbreviated-hash collision handling
- automatic `hashAbbrev` expansion
- persistence correctness
- performance characteristics
- suitability of the default `hashAbbrev` value

---

## Background

DPG stores abbreviated context hashes in `profiles.json` in order to keep profile files compact while still allowing efficient duplicate-context detection.

This behaves similarly to Git's abbreviated commit hashes:

- short hashes are used in the common case
- collisions are detected automatically
- abbreviation length expands only when needed
- correctness is preserved at all times

The repository owns this maintenance transparently during persistence.

---

## Why These Tests Exist

Abbreviated-hash collisions are intentionally rare in normal usage.

That makes them awkward to test using ordinary unit or TSV-driven integration tests.

This suite deliberately starts from an artificially tiny value:

```json
{
  "hashAbbrev": 1
}
```

and repeatedly creates profiles until automatic expansion occurs.

This allows us to:

- verify expansion correctness
- measure persistence cost
- estimate realistic collision frequency
- validate the default starting value

---

## Safety

The script runs entirely inside a temporary `$HOME` directory.

It does **not** touch the developer's real:

- `~/.dpg-v2/config.json`
- `~/.dpg-v2/profiles.json`

The temporary environment is automatically removed on completion or interruption.

---

## Measured Results

Measured on a 2019 Intel MacBook Pro.

### Expansion thresholds

| hashAbbrev reached | profiles required |
|--------------------|------------------:|
| 2                  |                 3 |
| 3                  |                29 |
| 4                  |                85 |
| 5                  |               252 |
| 6                  |               408 |
| 7                  |              1409 |

### Representative timings

| profiles              | hashAbbrev | duration |
|-----------------------|-----------:|---------:|
| 1                     |          1 |    171ms |
| 10                    |          2 |    186ms |
| 25                    |          2 |    190ms |
| 50                    |          3 |    192ms |
| 100                   |          4 |    190ms |
| 250                   |          4 |    186ms |
| 500                   |          6 |    193ms |
| 1000                  |          6 |    357ms |
| 1409 (expansion to 7) |          7 |    577ms |

---

## Observations

### Adaptive expansion is inexpensive

Even at more than 1400 profiles, the expansion event itself remained comfortably below one second.

This validates the decision to keep adaptive hash maintenance completely silent during normal CLI usage.

No progress or status message is currently required.

### `hashAbbrev = 7` is a strong default

Reaching length 7 required more than 1400 generated profiles.

This is far beyond the expected profile count for typical users.

In normal real-world usage, expansion beyond 7 is expected to be extremely rare.

### Persistence overhead remains small

Even with 1000 profiles:

```text
duration=357ms
```

for a normal profile creation operation.

This suggests that the adaptive collision checks scale well for realistic repository sizes.

---

## Running The Tests

Run the suite via:

```bash
npm run test:short-hash
```

---

## Configuration

The script exposes two useful tuning variables near the top:

```bash
HASH_LIMIT=3
HARD_STOP=500
```

### `HASH_LIMIT`

Controls how far the adaptive expansion should run before stopping.

Examples:

| HASH_LIMIT | Expected runtime |
|------------|-----------------:|
| 3          |          seconds |
| 4          |   under 1 minute |
| 5          |       ~2 minutes |
| 6          |     ~3–5 minutes |
| 7          |   ~15–20 minutes |

These are approximate timings from the 2019 Intel MacBook Pro test machine.

Faster CI runners may complete somewhat sooner.

### `HARD_STOP`

Maximum number of generated profiles before the test aborts.

This is a safety guard to prevent accidental runaway runs.

Recommended values:

| HASH_LIMIT | Suggested HARD_STOP |
|------------|--------------------:|
| 3          |                  75 |
| 4          |                 150 |
| 5          |                 300 |
| 6          |                 600 |
| 7          |                1500 |
| 8          |                7500 |

## Reference Runs

The `results/` directory contains archived transcripts from long-running manual short-hash expansion experiments performed on real hardware.

These are not part of CI, but serve as:

- performance reference data
- scalability validation
- regression comparison material
- empirical justification for the default `hashAbbrev = 7`

Example observed expansion points:

| hashAbbrev reached | profiles required |
|--------------------|------------------:|
| 7                  |              1409 |
| 8                  |              7100 |

The `hashAbbrev = 8` measurement was performed on a 2024 Apple M4 Max MacBook Pro and still completed expansion comfortably within normal interactive CLI times.

---

## Notes

These tests intentionally exercise pathological collision scenarios by starting from `hashAbbrev = 1`.

Real-world repositories start at the default:

```json
{
  "hashAbbrev": 7
}
```

and therefore experience dramatically fewer collision checks and expansions.
