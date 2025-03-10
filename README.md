# dragee-cli

To install dependencies:

```bash
bun install
```

To set dev environment variables:

```bash
cp .env.example .env
```

To run:

```bash
bun run index.ts
```

### report

To generate a dragee result report, based on asserters rules

```bash
bun run index.ts report --from-dir <path-to-dir> --to-dir <path-to-dir>
```

Example

```bash
bun run index.ts report --from-dir ./test/approval/sample/
```

### draw

To generate a dragee graph, based on graphers

```bash
bun run index.ts draw --from-dir <path-to-dir> --to-dir <path-to-dir>
```

Example

```bash
bun run index.ts draw --from-dir ./test/approval/sample/ --to-dir ./output
```

### clear-registry

To clear the local dragee registry (asserters/graphers)

```bash
bun run index.ts clear-registry
```

### generate-asserter

From [dragee-asserter-generator](https://github.com/dragee-io/dragee-asserter-generator)
To generate a new dragee asserter

```bash
bun run index.ts generate-asserter --name <asserter name> --output-dir <output directory>
```

Example

```bash
bun run index.ts generate-asserter --name zzz --output-dir E:\Projets\Dragee.io
```

### generate-grapher

From [dragee-grapher-generator](https://github.com/dragee-io/dragee-grapher-generator)
To generate a new dragee grapher

```bash
bun run index.ts generate-grapher --name <grapher name> --output-dir <output directory>
```

Example

```bash
bun run index.ts generate-grapher --name zzz --output-dir E:\Projets\Dragee.io
```

### newsletter

To get updates from the project by email

```bash
bun run index.ts newsletter
```

This project was created using `bun init` in bun v1.0.22. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.