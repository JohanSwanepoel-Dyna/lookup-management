# Lookup Management App

> **⚠️ This app is currently under active development. Features may be incomplete, change without notice, or contain known bugs.**

## Overview

The **Lookup Management App** is a [Dynatrace App](https://dt-url.net/developers) built on Dynatrace AppEngine that provides a self-service UI for managing lookup data stored in Grail.

Lookup files are tabular reference datasets stored under the `/lookups/` path in the Dynatrace Resource Store. They are used to enrich observability data at query time via DQL (`lookup`, `load`, `join` commands). Without this app, managing these files requires direct interaction with the Resource Store API.

### What it does

- **Browse lookup files** — lists all lookup tables stored in Grail with metadata (size, record count, last modified, uploaded by).
- **View lookup data** — inspect the records of any lookup file directly in a paginated, sortable data table using an editable DQL query editor.
- **Upload lookup files** — upload CSV or JSONL files from your local machine, with support for specifying a Dynatrace Pattern Language (DPL) expression to control how the file is parsed.
- **Delete lookup files** — remove lookup files from Grail with a confirmation prompt.

### Planned features

See [FEATURES.md](FEATURES.md) for the full feature backlog, including inline editing, bulk import, DQL snippet generation, folder navigation, and more.

---

## Tech Stack

- **Runtime**: Dynatrace AppEngine
- **UI**: React + TypeScript
- **Component Library**: [Strato Design System](https://dt-url.net/developers) (`@dynatrace/strato-components`)
- **Data**: Dynatrace Grail via DQL (`@dynatrace-sdk/react-hooks`, `@dynatrace-sdk/client-query`)
- **Tooling**: Dynatrace App Toolkit (`dt-app`)

---

## Getting Started with your Dynatrace App

This project was bootstrapped with Dynatrace App Toolkit.

It uses React in combination with TypeScript, to provide great developer experience.

## Available Scripts

In the project directory, you can run:

### `npm run start`

Runs the app in the development mode. A new browser window with your running app will be automatically opened.

Edit a component file in `ui` and save it. The page will reload when you make changes. You may also see any errors in the console.

### `npm run build`

Builds the app for production to the `dist` folder. It correctly bundles your app in production mode and optimizes the build for the best performance.

### `npm run deploy`

Builds the app and deploys it to the specified environment in `app.config.json`.

### `npm run uninstall

Uninstalls the app from the specified environment in `app.config.json`.

### `npm run generate:function`

Generates a new serverless function for your app in the `api` folder.

### `npm run update`

Updates @dynatrace-scoped packages to the latest version and applies automatic migrations.

### `npm run info`

Outputs the CLI and environment information.

### `npm run help`

Outputs help for the Dynatrace App Toolkit.

## Learn more

You can find more information on how to use all the features of the new Dynatrace Platform in [Dynatrace Developer](https://dt-url.net/developers).

To learn React, check out the [React documentation](https://reactjs.org/).

In the project directory, you can run:

### `npm run start`

Runs the app in the development mode. A new browser window with your running app will be automatically opened.

Edit a component file in `ui` and save it. The page will reload when you make changes. You may also see any errors in the console.

### `npm run build`

Builds the app for production to the `dist` folder. It correctly bundles your app in production mode and optimizes the build for the best performance.

### `npm run deploy`

Builds the app and deploys it to the specified environment in `app.config.json`.

### `npm run uninstall

Uninstalls the app from the specified environment in `app.config.json`.

### `npm run generate:function`

Generates a new serverless function for your app in the `api` folder.

### `npm run update`

Updates @dynatrace-scoped packages to the latest version and applies automatic migrations.

### `npm run info`

Outputs the CLI and environment information.

### `npm run help`

Outputs help for the Dynatrace App Toolkit.

## Learn more

You can find more information on how to use all the features of the new Dynatrace Platform in [Dynatrace Developer](https://dt-url.net/developers).

To learn React, check out the [React documentation](https://reactjs.org/).
