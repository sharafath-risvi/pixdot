module.exports = {
  apps: [
    {
      name: "pixdot-backend",
      script: "./server.js",
      cwd: "/opt/pixdot/app/backend",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};
