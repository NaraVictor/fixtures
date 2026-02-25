# Supabase config

- **tables.json** – Machine-readable tables config: table names, columns (name, type, nullable, default, references), unique constraints, indexes, RLS, and policies. Matches `../migrations/001_initial_schema.sql`. Use for docs, codegen, or tooling. Seed section documents the default `ranking_config` row.

Source of truth for DDL remains the migration SQL; this file is a reflection for reference.
