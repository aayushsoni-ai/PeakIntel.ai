FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY packages/agents/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY packages/agents/src ./src
COPY packages/agents/run_agents.py ./

EXPOSE 8001

CMD ["python", "run_agents.py"]
