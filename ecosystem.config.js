module.exports = {
  apps: [
    {
      name: 'vervoer',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Configuración para HTTPS
        HTTPS: 'true',
        // Headers para proxy
        TRUST_PROXY: 'true'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Configuración para HTTPS
        HTTPS: 'true',
        // Headers para proxy
        TRUST_PROXY: 'true'
      }
    }
  ]
};
