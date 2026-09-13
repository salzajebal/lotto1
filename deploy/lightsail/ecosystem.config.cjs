const path = require("node:path");

const projectRoot = path.resolve(__dirname, "../..");

module.exports = {
  apps: [
    {
      name: "lotto-analysis",
      cwd: projectRoot,
      script: "deploy/lightsail/start-app.sh",
      interpreter: "bash",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      kill_timeout: 10000,
      time: true,
      error_file: "/var/log/lotto-analysis/error.log",
      out_file: "/var/log/lotto-analysis/output.log",
      merge_logs: true,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};