const { execFileSync, spawn } = require("child_process");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const commands = [
  { name: "server", cwd: path.join(rootDir, "server") },
  { name: "client", cwd: path.join(rootDir, "client") },
];

const cleanupPort = (port) => {
  if (process.platform !== "win32") return;

  try {
    const output = execFileSync("cmd.exe", ["/d", "/s", "/c", `netstat -ano | findstr :${port}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    const pids = new Set();
    for (const line of output.split(/\r?\n/)) {
      const match = line.match(/\s(\d+)\s*$/);
      if (match) pids.add(match[1]);
    }

    for (const pid of pids) {
      try {
        execFileSync("taskkill", ["/PID", pid, "/F"], {
          stdio: ["ignore", "ignore", "ignore"],
        });
      } catch {
        // Ignore failures if the process already exited.
      }
    }
  } catch {
    // No listener on this port.
  }
};

cleanupPort(5000);
cleanupPort(5173);

const children = commands.map(({ name, cwd }) => {
  const isWindows = process.platform === "win32";
  const child = isWindows
    ? spawn("cmd.exe", ["/d", "/s", "/c", "npm run dev"], {
        cwd,
        stdio: "inherit",
        shell: false,
      })
    : spawn("npm", ["run", "dev"], {
        cwd,
        stdio: "inherit",
        shell: false,
      });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`${name} dev process exited with code ${code}`);
      process.exitCode = code;
      shutdown();
    }
  });

  return child;
});

const shutdown = () => {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
};

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});