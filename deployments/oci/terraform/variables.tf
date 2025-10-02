# OCI Terraform Variables
variable "region" {
  description = "OCI region"
  type        = string
  default     = "us-ashburn-1"
}

variable "compartment_id" {
  description = "Compartment OCID where resources will be created"
  type        = string
}

variable "ssh_public_key" {
  description = "SSH public key for instance access"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository URL"
  type        = string
  default     = "https://github.com/your-username/Latex-Resume.git"
}

variable "instance_shape" {
  description = "Instance shape"
  type        = string
  default     = "VM.Standard.E4.Flex"
}

variable "ocpu_count" {
  description = "Number of OCPUs"
  type        = number
  default     = 2
}

variable "memory_in_gbs" {
  description = "Memory in GB"
  type        = number
  default     = 8
}
