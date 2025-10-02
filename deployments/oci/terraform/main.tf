# OCI Terraform Configuration for AI Resume Orchestrator
terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
  }
}

provider "oci" {
  region = var.region
}

# Variables
variable "region" {
  description = "OCI region"
  type        = string
  default     = "us-ashburn-1"
}

variable "compartment_id" {
  description = "Compartment OCID"
  type        = string
}

variable "ssh_public_key" {
  description = "SSH public key"
  type        = string
}

# Data sources
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_id
}

data "oci_core_images" "oracle_linux" {
  compartment_id   = var.compartment_id
  operating_system = "Oracle Linux"
  operating_system_version = "8"
  shape            = "VM.Standard.E4.Flex"
  sort_by         = "TIMECREATED"
  sort_order      = "DESC"
}

# VCN
resource "oci_core_vcn" "resume_vcn" {
  compartment_id = var.compartment_id
  cidr_blocks    = ["10.0.0.0/16"]
  display_name   = "resume-orchestrator-vcn"
  dns_label      = "resumevcn"
}

# Internet Gateway
resource "oci_core_internet_gateway" "resume_ig" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.resume_vcn.id
  display_name   = "resume-orchestrator-ig"
}

# Route Table
resource "oci_core_route_table" "resume_rt" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.resume_vcn.id
  display_name   = "resume-orchestrator-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.resume_ig.id
  }
}

# Security List
resource "oci_core_security_list" "resume_sl" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.resume_vcn.id
  display_name   = "resume-orchestrator-sl"

  # Allow SSH
  ingress_security_rules {
    protocol  = "6"
    source    = "0.0.0.0/0"
    stateless = false
    tcp_options {
      min = 22
      max = 22
    }
  }

  # Allow HTTP
  ingress_security_rules {
    protocol  = "6"
    source    = "0.0.0.0/0"
    stateless = false
    tcp_options {
      min = 80
      max = 80
    }
  }

  # Allow HTTPS
  ingress_security_rules {
    protocol  = "6"
    source    = "0.0.0.0/0"
    stateless = false
    tcp_options {
      min = 443
      max = 443
    }
  }

  # Allow custom ports
  ingress_security_rules {
    protocol  = "6"
    source    = "0.0.0.0/0"
    stateless = false
    tcp_options {
      min = 3000
      max = 3000
    }
  }

  ingress_security_rules {
    protocol  = "6"
    source    = "0.0.0.0/0"
    stateless = false
    tcp_options {
      min = 4000
      max = 4000
    }
  }

  ingress_security_rules {
    protocol  = "6"
    source    = "0.0.0.0/0"
    stateless = false
    tcp_options {
      min = 5001
      max = 5001
    }
  }

  # Allow all outbound traffic
  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
    stateless   = false
  }
}

# Subnet
resource "oci_core_subnet" "resume_subnet" {
  compartment_id      = var.compartment_id
  vcn_id              = oci_core_vcn.resume_vcn.id
  cidr_block          = "10.0.1.0/24"
  display_name        = "resume-orchestrator-subnet"
  dns_label           = "resumesubnet"
  route_table_id      = oci_core_route_table.resume_rt.id
  security_list_ids   = [oci_core_security_list.resume_sl.id]
}

# Compute Instance
resource "oci_core_instance" "resume_instance" {
  compartment_id      = var.compartment_id
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  display_name        = "resume-orchestrator"
  shape               = "VM.Standard.E4.Flex"

  shape_config {
    ocpus         = 2
    memory_in_gbs = 8
  }

  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.oracle_linux.images[0].id
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.resume_subnet.id
    assign_public_ip = true
    hostname_label   = "resume-orchestrator"
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data = base64encode(<<-EOF
      #!/bin/bash
      yum update -y
      yum install -y docker git
      systemctl start docker
      systemctl enable docker
      usermod -a -G docker opc
      
      # Install Docker Compose
      curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
      chmod +x /usr/local/bin/docker-compose
      
      # Clone and setup application
      git clone https://github.com/your-username/Latex-Resume.git /home/opc/Latex-Resume
      chown -R opc:opc /home/opc/Latex-Resume
    EOF
    )
  }
}

# Outputs
output "instance_public_ip" {
  value = oci_core_instance.resume_instance.public_ip
}

output "instance_ocid" {
  value = oci_core_instance.resume_instance.id
}

output "dashboard_url" {
  value = "http://${oci_core_instance.resume_instance.public_ip}:3000"
}

output "api_url" {
  value = "http://${oci_core_instance.resume_instance.public_ip}:4000"
}
