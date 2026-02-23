import test from "node:test";
import assert from "node:assert/strict";
import { buildTrpcUrl, resolveMainSiteUrl } from "../url-utils";

test("resolveMainSiteUrl prefers panel override", () => {
  assert.equal(
    resolveMainSiteUrl("https://main.example.com/", "https://env.example.com", "http://localhost:3000"),
    "https://main.example.com",
  );
});

test("resolveMainSiteUrl falls back to env url", () => {
  assert.equal(
    resolveMainSiteUrl("", "https://env.example.com/", "http://localhost:3000"),
    "https://env.example.com",
  );
});

test("resolveMainSiteUrl falls back to localhost", () => {
  assert.equal(resolveMainSiteUrl("", "", "http://localhost:3000"), "http://localhost:3000");
});

test("buildTrpcUrl appends API path once", () => {
  assert.equal(buildTrpcUrl("https://main.example.com/"), "https://main.example.com/api/trpc");
});
