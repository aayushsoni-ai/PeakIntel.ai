FROM python:3.12-slim

WORKDIR /app

# Ensure Python output is logged in real-time
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY packages/agents/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY packages/agents/src ./src
COPY packages/agents/run_agents.py ./

# Required for agents to access logic
ENV PYTHONPATH="${PYTHONPATH}:/app"

EXPOSE 8001

HEALTHCHECK CMD curl --fail http://localhost:8001/health || exit 1

CMD ["python", "run_agents.py"]
