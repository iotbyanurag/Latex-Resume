#!/bin/bash

# OCI Deployment Script for AI Resume Orchestrator
set -e

echo "🚀 Starting OCI deployment for AI Resume Orchestrator..."

# Configuration
COMPARTMENT_ID="ocid1.compartment.oc1..your-compartment-id"
SUBNET_ID="ocid1.subnet.oc1..your-subnet-id"
AVAILABILITY_DOMAIN="your-ad"
SHAPE="VM.Standard.E4.Flex"
OCPU_COUNT=2
MEMORY_IN_GB=8
IMAGE_ID="ocid1.image.oc1..your-image-id"  # Oracle Linux 8
SSH_KEY_FILE="~/.ssh/id_rsa.pub"

# Create compute instance
echo "📦 Creating OCI compute instance..."
INSTANCE_ID=$(oci compute instance launch \
  --compartment-id $COMPARTMENT_ID \
  --availability-domain $AVAILABILITY_DOMAIN \
  --shape $SHAPE \
  --shape-config '{"ocpus":'$OCPU_COUNT',"memoryInGBs":'$MEMORY_IN_GB'}' \
  --image-id $IMAGE_ID \
  --subnet-id $SUBNET_ID \
  --assign-public-ip true \
  --ssh-authorized-keys-file $SSH_KEY_FILE \
  --display-name "resume-orchestrator" \
  --wait-for-state RUNNING \
  --query 'data.id' \
  --raw-output)

echo "✅ Instance created: $INSTANCE_ID"

# Get public IP
PUBLIC_IP=$(oci compute instance list-vnics \
  --instance-id $INSTANCE_ID \
  --query 'data[0]."public-ip"' \
  --raw-output)

echo "🌐 Public IP: $PUBLIC_IP"

# Wait for instance to be ready
echo "⏳ Waiting for instance to be ready..."
sleep 60

# Install Docker and Docker Compose
echo "🐳 Installing Docker and Docker Compose..."
ssh -o StrictHostKeyChecking=no opc@$PUBLIC_IP << 'EOF'
  # Update system
  sudo yum update -y
  
  # Install Docker
  sudo yum install -y docker
  sudo systemctl start docker
  sudo systemctl enable docker
  sudo usermod -a -G docker opc
  
  # Install Docker Compose
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  
  # Install Git
  sudo yum install -y git
EOF

# Clone repository
echo "📥 Cloning repository..."
ssh -o StrictHostKeyChecking=no opc@$PUBLIC_IP << EOF
  git clone https://github.com/your-username/Latex-Resume.git
  cd Latex-Resume
EOF

# Create environment file
echo "🔧 Setting up environment..."
ssh -o StrictHostKeyChecking=no opc@$PUBLIC_IP << 'EOF'
  cd Latex-Resume
  cp .env.example .env
  # Edit .env with your API keys
  echo "Please edit .env file with your API keys"
EOF

# Start services
echo "🚀 Starting services..."
ssh -o StrictHostKeyChecking=no opc@$PUBLIC_IP << 'EOF'
  cd Latex-Resume
  docker-compose up -d --build
EOF

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Test services
echo "🧪 Testing services..."
if curl -f http://$PUBLIC_IP:3000 > /dev/null 2>&1; then
    echo "✅ Dashboard is running at http://$PUBLIC_IP:3000"
else
    echo "❌ Dashboard is not responding"
fi

if curl -f http://$PUBLIC_IP:4000/runs > /dev/null 2>&1; then
    echo "✅ Orchestrator API is running at http://$PUBLIC_IP:4000"
else
    echo "❌ Orchestrator API is not responding"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📊 Service URLs:"
echo "  Dashboard: http://$PUBLIC_IP:3000"
echo "  API: http://$PUBLIC_IP:4000"
echo "  TeX Builder: http://$PUBLIC_IP:5001"
echo ""
echo "🔧 Management commands:"
echo "  SSH: ssh opc@$PUBLIC_IP"
echo "  View logs: ssh opc@$PUBLIC_IP 'cd Latex-Resume && docker-compose logs -f'"
echo "  Restart: ssh opc@$PUBLIC_IP 'cd Latex-Resume && docker-compose restart'"
echo "  Stop: ssh opc@$PUBLIC_IP 'cd Latex-Resume && docker-compose down'"
echo ""
