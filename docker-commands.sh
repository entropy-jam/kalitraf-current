#!/bin/bash
# Docker Management Script for CHP Traffic Scraper

echo "🐳 CHP Traffic Scraper Docker Management"
echo "========================================"

case "$1" in
    "build")
        echo "🔨 Building Docker container..."
        docker build -t chp-scraper .
        echo "✅ Build complete!"
        ;;
    "run")
        echo "🚀 Running Docker container..."
        docker run -d -p 8080:8080 -p 3000:3000 --name chp-scraper chp-scraper
        echo "✅ Container running!"
        echo "📡 WebSocket: ws://localhost:8080"
        echo "🌐 Frontend: http://localhost:3000"
        ;;
    "stop")
        echo "🛑 Stopping Docker container..."
        docker stop chp-scraper
        docker rm chp-scraper
        echo "✅ Container stopped and removed!"
        ;;
    "logs")
        echo "📋 Showing container logs..."
        docker logs -f chp-scraper
        ;;
    "status")
        echo "📊 Container status:"
        docker ps -a | grep chp-scraper
        ;;
    "clean")
        echo "🧹 Cleaning up Docker resources..."
        docker system prune -f
        echo "✅ Cleanup complete!"
        ;;
    "dev")
        echo "🛠️ Starting development environment..."
        docker-compose up --build
        ;;
    *)
        echo "Usage: $0 {build|run|stop|logs|status|clean|dev}"
        echo ""
        echo "Commands:"
        echo "  build  - Build the Docker container"
        echo "  run    - Run the container in background"
        echo "  stop   - Stop and remove the container"
        echo "  logs   - Show container logs"
        echo "  status - Show container status"
        echo "  clean  - Clean up Docker resources"
        echo "  dev    - Start development environment with docker-compose"
        ;;
esac
