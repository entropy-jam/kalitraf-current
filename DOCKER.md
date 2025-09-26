# Docker Setup for CHP Traffic Scraper

## Quick Start

### Build and Run Locally
```bash
# Build the container
./docker-commands.sh build

# Run the container
./docker-commands.sh run

# View logs
./docker-commands.sh logs

# Stop the container
./docker-commands.sh stop
```

### Development Environment
```bash
# Start with docker-compose (includes volume mounting)
./docker-commands.sh dev
```

## What's Included

The Docker container includes:
- ✅ **Python 3.9** with all dependencies
- ✅ **Google Chrome** (headless)
- ✅ **ChromeDriver** (via webdriver-manager)
- ✅ **Node.js** dependencies
- ✅ **Your entire application** (scrapers, frontend, data)
- ✅ **WebSocket server** on port 8080
- ✅ **Frontend server** on port 3000

## Access Points

- **Frontend**: http://localhost:3000
- **WebSocket**: ws://localhost:8080
- **Data**: Persisted in `./data/` directory
- **Logs**: Available via `docker logs chp-scraper`

## Railway Deployment

1. **Push your code** (with Dockerfile)
2. **Railway detects Dockerfile** automatically
3. **Railway builds and runs** your container
4. **Done!**

## Troubleshooting

### Container won't start
```bash
# Check logs
./docker-commands.sh logs

# Check status
./docker-commands.sh status
```

### Rebuild after changes
```bash
# Stop current container
./docker-commands.sh stop

# Rebuild
./docker-commands.sh build

# Run again
./docker-commands.sh run
```

### Clean up
```bash
# Remove old containers and images
./docker-commands.sh clean
```
