# 🚀 OCI Deployment Guide - AI Resume Orchestrator

**Yes, OCI is actually BETTER than Railway for your project!** Here's why and how to deploy.

## 🎯 **Why OCI is Superior to Railway**

| Feature | OCI | Railway |
|---------|-----|---------|
| **Docker Compose** | ✅ Native support | ❌ Forces monolithic |
| **Multi-container** | ✅ Full support | ❌ Limited |
| **Performance** | ✅ Enterprise-grade | ⚠️ Limited |
| **Scalability** | ✅ Auto-scaling | ⚠️ Basic |
| **Cost** | ✅ Often cheaper | 💰💰 More expensive |
| **Control** | ✅ Full control | ❌ Platform limitations |
| **Production-ready** | ✅ Enterprise features | ⚠️ Limited |

## 🚀 **Deployment Methods**

### **Method 1: Quick Deploy (Compute + Docker) - Recommended**

**Perfect for getting started quickly with your existing `docker-compose.yml`**

#### **Step 1: Prerequisites**
```bash
# Install OCI CLI
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"

# Configure OCI CLI
oci setup config
```

#### **Step 2: Run the deployment script**
```bash
# Make script executable
chmod +x deployments/oci/deploy-oci.sh

# Edit the script with your OCI details
nano deployments/oci/deploy-oci.sh

# Run deployment
./deployments/oci/deploy-oci.sh
```

#### **Step 3: Set environment variables**
```bash
# SSH into your instance
ssh opc@YOUR_PUBLIC_IP

# Edit environment file
cd Latex-Resume
nano .env

# Add your API keys:
# GROQ_API_KEY=your_groq_api_key
# ANTHROPIC_API_KEY=your_claude_api_key
# GOOGLE_API_KEY=your_gemini_api_key

# Start services
docker-compose up -d --build
```

### **Method 2: Infrastructure as Code (Terraform) - Production**

**Best for production deployments with full infrastructure control**

#### **Step 1: Setup Terraform**
```bash
# Install Terraform
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Navigate to terraform directory
cd deployments/oci/terraform
```

#### **Step 2: Configure variables**
```bash
# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

#### **Step 3: Deploy infrastructure**
```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Deploy infrastructure
terraform apply
```

#### **Step 4: Deploy application**
```bash
# Get public IP from Terraform output
terraform output instance_public_ip

# SSH into instance
ssh opc@$(terraform output -raw instance_public_ip)

# Clone and setup application
git clone https://github.com/your-username/Latex-Resume.git
cd Latex-Resume

# Setup environment
cp .env.example .env
nano .env  # Add your API keys

# Start services
docker-compose up -d --build
```

### **Method 3: Container Instances (Serverless) - Advanced**

**For serverless container deployment (requires OCI Container Instances)**

#### **Step 1: Build and push images to OCI Registry**
```bash
# Login to OCI Registry
docker login your-region.ocir.io

# Build images
docker build -t your-region.ocir.io/your-namespace/resume-dashboard:latest ./dashboard
docker build -t your-region.ocir.io/your-namespace/resume-orchestrator:latest ./orchestrator
docker build -t your-region.ocir.io/your-namespace/resume-texlive:latest ./texlive

# Push images
docker push your-region.ocir.io/your-namespace/resume-dashboard:latest
docker push your-region.ocir.io/your-namespace/resume-orchestrator:latest
docker push your-region.ocir.io/your-namespace/resume-texlive:latest
```

#### **Step 2: Deploy using Container Instances**
```bash
# Apply container instance configuration
kubectl apply -f deployments/oci/container-instance.yaml
```

## 🔧 **Configuration Details**

### **Required OCI Resources:**
- **Compartment** - Your OCI compartment
- **VCN** - Virtual Cloud Network
- **Subnet** - Public subnet for internet access
- **Security List** - Firewall rules for ports 22, 80, 3000, 4000, 5001
- **Internet Gateway** - For internet access
- **Compute Instance** - VM to run your application

### **Instance Specifications:**
- **Shape:** VM.Standard.E4.Flex (2 OCPUs, 8GB RAM)
- **OS:** Oracle Linux 8
- **Storage:** 50GB boot volume
- **Network:** Public IP with internet access

### **Port Configuration:**
- **22** - SSH access
- **3000** - Dashboard (Next.js)
- **4000** - Orchestrator API
- **5001** - TeXLive service

## 💰 **Cost Comparison**

### **OCI Costs (Monthly):**
- **Compute Instance:** ~$30-50 (VM.Standard.E4.Flex)
- **Storage:** ~$5 (50GB)
- **Data Transfer:** ~$5-10
- **Total:** ~$40-65/month

### **Railway Costs (Monthly):**
- **Basic Plan:** $5/month (limited resources)
- **Pro Plan:** $20/month (better resources)
- **Team Plan:** $100/month (team features)

**OCI is often cheaper and more powerful!**

## 🎯 **Why OCI is Better for Your Project**

### **1. Native Docker Compose Support**
- ✅ **No conversion needed** - Use your existing `docker-compose.yml`
- ✅ **Multi-container architecture** - Keep your 3 services separate
- ✅ **Service communication** - Internal networking works perfectly

### **2. Better Performance**
- ✅ **More powerful instances** - Better CPU and memory
- ✅ **Faster storage** - NVMe SSD storage
- ✅ **Better networking** - Low latency, high bandwidth

### **3. Production Features**
- ✅ **Load balancing** - OCI Load Balancer
- ✅ **Auto-scaling** - Auto Scaling Groups
- ✅ **Monitoring** - OCI Monitoring and Logging
- ✅ **Backup** - Automated backups
- ✅ **Security** - VCN, Security Lists, WAF

### **4. Cost Efficiency**
- ✅ **Pay-per-use** - Only pay for what you use
- ✅ **Reserved instances** - Discounts for long-term usage
- ✅ **Spot instances** - Up to 90% discount for non-critical workloads

## 🚀 **Quick Start Commands**

### **Deploy with OCI CLI:**
```bash
# 1. Install OCI CLI
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"

# 2. Configure OCI CLI
oci setup config

# 3. Deploy
./deployments/oci/deploy-oci.sh
```

### **Deploy with Terraform:**
```bash
# 1. Install Terraform
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip

# 2. Deploy infrastructure
cd deployments/oci/terraform
terraform init
terraform apply

# 3. Deploy application
ssh opc@$(terraform output -raw instance_public_ip)
git clone https://github.com/your-username/Latex-Resume.git
cd Latex-Resume && docker-compose up -d
```

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **SSH Connection Failed**
   - Check security list allows port 22
   - Verify SSH key is correct
   - Wait for instance to fully boot

2. **Docker Compose Fails**
   - Check if Docker is running: `sudo systemctl status docker`
   - Check logs: `docker-compose logs`
   - Verify environment variables

3. **Services Not Accessible**
   - Check security list allows ports 3000, 4000, 5001
   - Verify services are running: `docker-compose ps`
   - Check firewall: `sudo iptables -L`

## 🎉 **Expected Result**

After deployment, you'll have:
- ✅ **Dashboard** at `http://YOUR_IP:3000`
- ✅ **API** at `http://YOUR_IP:4000`
- ✅ **TeXLive** at `http://YOUR_IP:5001`
- ✅ **Full Docker Compose** architecture
- ✅ **Production-ready** infrastructure

## 🏆 **Conclusion**

**OCI is definitely the better choice for your project!**

- **Easier deployment** - No need to convert to monolithic
- **Better performance** - More powerful infrastructure
- **Lower costs** - Often cheaper than Railway
- **Production-ready** - Enterprise-grade features
- **Full control** - Complete infrastructure control

**Skip Railway, go straight to OCI!** 🚀
