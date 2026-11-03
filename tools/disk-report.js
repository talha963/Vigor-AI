#!/usr/bin/env node
/**
 * Read-only Docker storage report.
 *
 *   node tools/disk-report.js      (npm run disk:report)
 *
 * Reports what Vigor itself occupies, and what is reclaimable on this machine.
 * It deletes NOTHING. It prints the commands and says which are safe, because
 * `docker system prune -a` on a machine with other projects on it removes
 * images those projects need, and that is not a decision a report should make
 * on anyone's behalf.
 */

import { execFileSync } from "node:child_process";

const docker = (args) => {
  try {
    return execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (err) {
    return null;
  }
};

const probe = docker(["version", "--format", "{{.Server.Version}}"]);
if (!probe) {
  console.error("Docker is not reachable. Is Docker Desktop running?");
  process.exit(1);
}

const bytes = (n) => {
  if (!Number.isFinite(n)) return "?";
  const u = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)}${u[i]}`;
};

/* ------------------------------------------------------- overall footprint */

console.log("Docker storage\n");

const df = docker(["system", "df", "--format", "{{.Type}}\t{{.TotalCount}}\t{{.Size}}\t{{.Reclaimable}}"]);
if (df) {
  for (const line of df.trim().split(/\r?\n/)) {
    const [type, count, size, reclaimable] = line.split("\t");
    console.log(`  ${type.padEnd(16)} ${String(count).padStart(4)}  ${String(size).padStart(10)}  reclaimable ${reclaimable}`);
  }
}

/* ------------------------------------------------------------ Vigor itself */

console.log("\nVigor's own footprint\n");

const images = docker(["images", "--format", "{{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.ID}}"]) ?? "";
const imageRows = images
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => {
    const [ref, size, id] = l.split("\t");
    return { ref, size, id };
  });

// Vigor builds nothing. It reuses whatever N8N_IMAGE points at, and the opt-in
// mongo image. So its image cost is zero unless those were pulled for it.
const n8nImages = imageRows.filter((r) => /n8n/i.test(r.ref));
if (n8nImages.length === 0) {
  console.log("  images            none yet — `npm run stack:up` will pull one n8n image");
} else {
  console.log("  images            shared, not built by Vigor:");
  for (const r of n8nImages) console.log(`                      ${r.ref.padEnd(40)} ${r.size}`);
  if (n8nImages.length > 1) {
    console.log("\n  NOTE: more than one n8n image is present. Vigor needs exactly one.");
    console.log("        Point N8N_IMAGE in .env at the one you want to keep, then remove");
    console.log("        the others IF no other project of yours uses them.");
  }
}

const volumes = docker(["volume", "ls", "--format", "{{.Name}}"]) ?? "";
const vigorVolumes = volumes
  .trim()
  .split(/\r?\n/)
  .filter((v) => v.startsWith("vigor"));

if (vigorVolumes.length === 0) {
  console.log("  volumes           none yet");
} else {
  console.log("  volumes:");
  for (const v of vigorVolumes) {
    const inspect = docker(["system", "df", "-v", "--format", "{{json .Volumes}}"]);
    let size = "";
    if (inspect) {
      try {
        const match = JSON.parse(inspect).find((x) => x.Name === v);
        if (match) size = match.Size;
      } catch {
        /* formatting varies by docker version; the name alone is still useful */
      }
    }
    console.log(`                      ${v.padEnd(40)} ${size}`);
  }
}

console.log("\n  Vigor builds no images and has no Dockerfile, so it adds nothing");
console.log("  to the build cache. Its only growing artefact is the n8n-data");
console.log("  volume (SQLite + execution history), which EXECUTIONS_DATA_PRUNE");
console.log("  and EXECUTIONS_DATA_PRUNE_MAX_COUNT keep bounded.");

/* ------------------------------------------------------------ what to free */

console.log("\n" + "-".repeat(72));
console.log("\nReclaiming space — safest first. Nothing below has been run.\n");

const buildCache = docker(["system", "df", "--format", "{{.Type}}\t{{.Reclaimable}}"]) ?? "";
const cacheLine = buildCache
  .trim()
  .split(/\r?\n/)
  .find((l) => l.startsWith("Build Cache"));

console.log("1. Build cache. Safe: it only slows the next rebuild of whatever");
console.log("   project created it. Vigor does not use it at all.");
if (cacheLine) console.log(`   Currently reclaimable: ${cacheLine.split("\t")[1]}`);
console.log("     docker builder prune -af\n");

console.log("2. Stopped containers. Safe unless you want to read their logs.");
console.log("     docker container prune -f\n");

console.log("3. Dangling images — layers no tagged image references. Safe.");
console.log("     docker image prune -f\n");

console.log("4. Unused volumes. CHECK FIRST: this deletes databases belonging to");
console.log("   any project whose containers are not currently running.");
console.log("     docker volume ls");
console.log("     docker volume rm <name>        one at a time, deliberately\n");

console.log("NOT recommended here:");
console.log("  docker system prune -a           removes every image not used by a");
console.log("                                   RUNNING container, including the ones");
console.log("                                   your other projects need. On this");
console.log("                                   machine that means re-pulling many GB.");

console.log("\nSee docs/07-docker-and-storage.md for the reasoning behind each step.");
