/**
 * PM2 Process Supervisor Configuration
 * Gujarat Police AI CCTV Intelligence Platform
 */

module.exports = {
  apps: [
    {
      name: "gujarat-police-cctv-intelligence",
      script: "server.ts",
      interpreter: "node",
      interpreter_args: "--import tsx",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3000
      },
      exp_backoff_restart_delay: 100,
      restart_delay: 2000,
      kill_timeout: 8000,
      listen_timeout: 10000,
      max_restarts: 50,
      min_uptime: "10s",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    }
  ]
};
