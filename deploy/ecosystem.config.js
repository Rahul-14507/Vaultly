module.exports = {
  apps: [{
    name: "vaultly",
    script: "./server/dist/index.js",
    cwd: "../", // run from workspace root
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "250M",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    }
  }]
};
