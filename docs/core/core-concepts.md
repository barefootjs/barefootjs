---
title: Core Concepts
description: The four design principles and a technical overview of how BarefootJS works
---

# Core Concepts

BarefootJS solves a specific problem: **adding interactive UI to server-rendered apps without adopting a full SPA framework or locking into Node.js.**

Write components once in JSX. The compiler outputs server templates and minimal client JS — for any backend language. No virtual DOM, no framework runtime, no build-time lock-in.

## Backend Freedom

**Problem:** UI component libraries only work with Node.js. Your Go / Python / Ruby backend can't use them.

BarefootJS compiles JSX into backend-agnostic IR, then generates templates for your server — Hono, Go `html/template`, or any custom adapter. One component library, any backend. No Node.js lock-in.

## MPA-style Development

**Problem:** Adding interactivity to a server-rendered app means either jQuery-style scripting or rewriting the whole frontend as a SPA.

BarefootJS is a middle path. Every component is server-rendered HTML by default. Add `"use client"` only where you need interactivity — that component gets client JS, the rest stays zero-JS. Your routing, data fetching, and templates stay exactly as they are.

## Fine-grained Reactivity

**Problem:** React re-renders the entire component subtree when state changes. Virtual DOM diffing is overhead you pay even when only one text node changed.

BarefootJS uses signals (inspired by SolidJS). When state changes, only the exact DOM node that depends on it updates — no diffing, no component re-render. The compiler statically wires each signal to its DOM target at build time.

## AI-native Development

**Problem:** UI component tests are slow because they need a browser or JSDOM. AI agents can't efficiently iterate on UI code.

The compiler produces a structured IR (JSON) that captures everything about a component — structure, signals, events, accessibility. `renderToTest()` runs assertions against this IR in milliseconds, no browser needed. A CLI (`barefoot search`, `barefoot ui`) gives both humans and AI agents structured access to component APIs.

## How It Works

Two-phase compilation, hydration markers, and clean overrides — a technical overview of the implementation.
