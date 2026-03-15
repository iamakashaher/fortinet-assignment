# Fortinet Form Builder Assignment

A dynamic form builder application built with Angular 21. Create custom form schemas, collect records, and view submitted data in a sortable, filterable data grid.

## Features

- **Form Builder** — add and configure form fields (text, integer, decimal, textarea, datetime, email, phone, URL)
- **Record Form** — dynamically generated form based on the current schema
- **Data Grid** — sortable, filterable, paginated view of submitted records
- **Persistence** — form schema and records are saved to `localStorage`

## Tech Stack

- Angular 21 (standalone components, OnPush change detection)
- SCSS with CSS custom properties

## Getting Started

```bash
npm install
npm start        # Dev server at http://localhost:4200
```

## Project Structure

```
src/
  app/
    core/
      models/        # FormField, FormSchema, FormRecord types
      services/      # FormStateService (single source of truth)
    features/
      home/          # Dashboard
      builder/       # Field configuration UI
      records/       # Record form and data grid
```

## Routes

| Path | Description |
|------|-------------|
| `/` | Home dashboard |
| `/builder` | Build and configure form schema |
| `/records/new` | Submit a new record |
| `/records` | View all submitted records |
