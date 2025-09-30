FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the MCP server
COPY . .

# Make scripts executable
RUN chmod +x server.py server-direct.py

# Expose port for HTTP/SSE transport
EXPOSE 8000

# Default command (STDIO transport)
CMD ["python", "server-direct.py"]
