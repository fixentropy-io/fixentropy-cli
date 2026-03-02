# Fixentropy CLI

> Command-line interface for the Fixentropy ecosystem — analyze your architecture, generate reports, and visualize dependency graphs.

## ✨ Features

| Command              | Alias | Description                                      |
|----------------------|-------|--------------------------------------------------|
| `report`             | `r`   | Analyze dragees and build asserter rules reports |
| `draw`               | `d`   | Generate dependency graphs from graphers         |
| `clear-registry`     | `cr`  | Clear the local asserters/graphers registry      |
| `generate-asserter`  | —     | Scaffold a new asserter project                  |
| `generate-grapher`   | —     | Scaffold a new grapher project                   |
| `newsletter`         | —     | Subscribe to project updates by email            |

## 📦 Installation

### From release binaries

1. Download the appropriate binary for your platform from the [latest release](https://github.com/fixentropy-io/fixentropy-cli/releases):

   | Platform       | Binary name                 |
   |----------------|-----------------------------|
   | Linux (x64)    | `fixentropy-linux`          |
   | Windows (x64)  | `fixentropy-windows`        |
   | macOS Intel    | `fixentropy-macos-x64`      |
   | macOS Silicon  | `fixentropy-macos-arm64`    |

2. Add the binary to your `$PATH`.

### macOS — unsigned binary notice

The macOS binary is unsigned. You need to remove the quarantine attribute before use:

```bash
chmod +x ~/Downloads/fixentropy-macos-arm64
xattr -d com.apple.metadata:kMDItemWhereFroms ~/Downloads/fixentropy-macos-arm64
xattr -d com.apple.quarantine ~/Downloads/fixentropy-macos-arm64
```

Alternatively, you can allow the binary from **System Settings → Privacy & Security** after the first launch attempt:

![Allow unsigned binary from macOS Security settings](assets/README/disable-security-on-unsigned-macos-binary.png)

See the [Apple documentation](https://support.apple.com/en-us/102445) for more details.

## 🛠️ Development

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.2.5

### Setup

```bash
# Install dependencies
bun install

# Configure environment variables
cp .env.example .env
```

### Run locally

```bash
bun run index.ts
```

### Build

```bash
# Build for current platform
bun run build

# Build for all platforms (linux, windows, macOS Intel & Silicon)
bun run build:all
```

### Code quality

```bash
# Format, lint, and apply auto-fixes
bun run check
```

## 🚀 Usage

> All examples below use `bun run index.ts` for development.  
> In production, replace with the `fixentropy` binary.

### `report` — Generate an architecture rules report

Looks up dragees in the source directory, downloads matching asserters, executes their rules, and outputs the report.

```bash
fixentropy report --from-dir <source> [--to-dir <output>]
```

**Options:**

| Flag                       | Description                       | Default            |
|----------------------------|-----------------------------------|--------------------|
| `--from-dir <path>`        | Directory containing dragees      | `.`                |
| `--to-dir <path>`          | Output directory for reports      | `./dragee/reports` |

**Example:**

```bash
fixentropy report --from-dir ./test/approval/sample/
```

---

### `draw` — Generate dependency graphs

Looks up dragees in the source directory, downloads matching graphers, and generates visual dependency graphs.

```bash
fixentropy draw --from-dir <source> --to-dir <output>
```

**Options:**

| Flag                       | Description                       | Default            |
|----------------------------|-----------------------------------|--------------------|
| `--from-dir <path>`        | Directory containing dragees      | `.`                |
| `--to-dir <path>`          | Output directory for graphs       | `./dragee/reports` |

**Example:**

```bash
fixentropy draw --from-dir ./test/approval/sample/ --to-dir ./output
```

---

### `clear-registry` — Reset local registry

Clears all previously downloaded asserters and graphers from the local registry (`~/.fixentropy/registry`).

```bash
fixentropy clear-registry
```

---

### `generate-asserter` — Scaffold a new asserter

Generates a new asserter project skeleton.

```bash
fixentropy generate-asserter --name <asserter-name> --output-dir <directory>
```

**Example:**

```bash
fixentropy generate-asserter --name my-asserter --output-dir ./asserters
```

---

### `generate-grapher` — Scaffold a new grapher

Generates a new grapher project skeleton.

```bash
fixentropy generate-grapher --name <grapher-name> --output-dir <directory>
```

**Example:**

```bash
fixentropy generate-grapher --name my-grapher --output-dir ./graphers
```

---

### `newsletter` — Subscribe to updates

Opt-in to receive email notifications about new features and releases.

```bash
fixentropy newsletter
```

## 📁 Project structure

```
cli/
├── index.ts              # CLI entry point (Commander.js)
├── src/
│   ├── cli.config.ts     # Runtime configuration (~/.fixentropy)
│   ├── commands/         # Command handlers
│   ├── dragee-lookup.ts  # Dragee file discovery
│   └── namespace-lookup.ts
├── test/                 # Test suite
├── biome.json            # Linter/formatter config
└── package.json
```

## 🔗 Related packages

| Package | Description |
|---------|-------------|
| [`@fixentropy-io/type`](https://www.npmjs.com/package/@fixentropy-io/type) | Shared type definitions |
| [`@fixentropy-io/report-generator`](https://github.com/fixentropy-io/fixentropy-report-generator) | Report generation engine |
| [`@fixentropy-io/package-installer`](https://github.com/fixentropy-io/fixentropy-package-installer) | Registry package installer |
| [`@fixentropy-io/asserter-generator`](https://github.com/fixentropy-io/fixentropy-asserter-generator) | Asserter project scaffolding |
| [`@fixentropy-io/grapher-generator`](https://github.com/fixentropy-io/fixentropy-grapher-generator) | Grapher project scaffolding |