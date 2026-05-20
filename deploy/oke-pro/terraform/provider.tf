terraform {
  required_version = ">= 1.0"
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.5"
    }
  }
}

# Cloud Shell ya autentica al provider de OCI con un delegation token (instance principal).
# Si corres fuera de Cloud Shell, configura ~/.oci/config como de costumbre y borra estos blocks.
provider "oci" {
  auth                = "InstancePrincipal"
  region              = var.ociRegionIdentifier
  tenancy_ocid        = var.ociTenancyOcid
}

provider "random" {}
