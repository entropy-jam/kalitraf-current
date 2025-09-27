# CHP Traffic Scraper Docker Container (HTTP-based)
# Cache buster: 2025-01-26-v1 - Migrated to HTTP requests, removed Chrome/WebDriver
FROM python:3.9-bullseye

# Install system dependencies and Node.js (no Chrome needed for HTTP requests)
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    unzip \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Python requirements and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Node.js package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy application source code
COPY src/ ./src/
COPY bin/ ./bin/
COPY js/ ./js/
COPY assets/ ./assets/
COPY data/ ./data/
COPY index.html ./

# Create logs directory
RUN mkdir -p logs

# Create non-root user for security
RUN useradd -m -u 1000 scraper && chown -R scraper:scraper /app
USER scraper

# Expose ports
EXPOSE 8080 3000

# Health check (simple process check)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD pgrep -f "continuous_scraper.py" || exit 1

# Default command - run the continuous scraper
CMD ["python", "src/scrapers/continuous_scraper.py"]
