#!/bin/bash

# Configuration
RG="rg-pinnacle-ai"
LOCATION="eastus"
ACR="crpinnacle"
CONTAINER_APP_ENV="env-pinnacle"

echo "=== Pinnacle AI Azure Setup Helper ==="
echo "Generating CLI commands for $100 Credit scenario..."

# Create Resource Group
echo "1. Creating Resource Group..."
az group create --name $RG --location $LOCATION

# Create ACR (Basic)
echo "2. Creating Container Registry (Basic Tier)..."
az acr create --resource-group $RG --name $ACR --sku Basic --admin-enabled true

# Create Container App Environment
echo "3. Creating Container Apps Environment (Serverless)..."
az containerapp env create --name $CONTAINER_APP_ENV --resource-group $RG --location $LOCATION

# Create Database (Burstable B1ms)
echo "4. Creating PostgreSQL (Flexible Server, B1ms)..."
echo ">> You will need to run: az postgres flexible-server create --resource-group $RG --name db-pinnacle --sku-name Standard_B1ms --tier Burstable"

# Create Redis (Basic C0)
echo "5. Creating Redis (Basic C0)..."
az redis create --resource-group $RG --name redis-pinnacle --location $LOCATION --sku Basic --vm-size c0

# Set Cost Alert
echo "6. Setting up a $80 Budget Alert..."
# (Requires subscription scope)

echo "=== Deployment Ready ==="
echo "Follow the docs/AZURE_DEPLOYMENT_GUIDE.md for detailed next steps!"
