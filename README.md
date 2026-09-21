# egg-pi

A [pi](https://pi.dev) package.

## Package contents

Add pi resources to the corresponding directory:

- `extensions/` — JavaScript or TypeScript extensions
- `skills/` — directories containing `SKILL.md` files
- `prompts/` — prompt templates
- `themes/` — theme JSON files

The package manifest is defined in `package.json` under the `pi` key.

## Use locally

```bash
pi install .
```

To try the package for one run without adding it to settings:

```bash
pi -e .
```
