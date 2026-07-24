import { Buffer } from "node:buffer";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  combineCommandOutput,
  readFileIfPresent,
  readRepositoryFiles,
} from "../src/repository-files.js";

describe("repository file discovery", () => {
  it("normalizes every command-output combination", () => {
    expect(combineCommandOutput("out", "error")).toBe("outerror");
    expect(combineCommandOutput(null, "error")).toBe("error");
    expect(combineCommandOutput("out", null)).toBe("out");
    expect(combineCommandOutput(null, null)).toBe("");
  });

  it("reads cached and untracked paths returned by git", async () => {
    const readPaths: string[] = [];
    const files = await readRepositoryFiles("C:\\repository", {
      read: async (path) => {
        readPaths.push(path);
        return Buffer.from(path);
      },
      runGit: () => ({ output: "src/a.ts\0config.json\0", status: 0 }),
    });

    expect(files.map((file) => file.path)).toEqual(["src/a.ts", "config.json"]);
    expect(readPaths).toEqual([
      join("C:\\repository", "src/a.ts"),
      join("C:\\repository", "config.json"),
    ]);
  });

  it("rejects a failed git listing", async () => {
    await expect(
      readRepositoryFiles("C:\\repository", {
        read: async () => Buffer.from("unused"),
        runGit: () => ({ output: "not a repository\n", status: 128 }),
      }),
    ).rejects.toThrow("Unable to enumerate repository files with git: not a repository");
  });

  it("propagates a file read failure", async () => {
    await expect(
      readRepositoryFiles("C:\\repository", {
        read: async () => {
          throw new Error("unreadable");
        },
        runGit: () => ({ output: "src/a.ts\0", status: 0 }),
      }),
    ).rejects.toThrow("unreadable");
  });

  it("skips a tracked path deleted from the working tree", async () => {
    const files = await readRepositoryFiles("C:\\repository", {
      read: async () => undefined,
      runGit: () => ({ output: "deleted.ts\0", status: 0 }),
    });

    expect(files).toEqual([]);
  });

  it("distinguishes present, missing, and unreadable paths", async () => {
    const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));

    await expect(readFileIfPresent(join(repositoryRoot, "package.json"))).resolves.toBeInstanceOf(
      Buffer,
    );
    await expect(
      readFileIfPresent(join(repositoryRoot, "definitely-missing.file")),
    ).resolves.toBeUndefined();
    await expect(readFileIfPresent(repositoryRoot)).rejects.toThrow();
  });

  it("reads this repository through the default dependencies", async () => {
    const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
    const files = await readRepositoryFiles(repositoryRoot);

    expect(files.some((file) => file.path === "package.json")).toBe(true);
  });
});
