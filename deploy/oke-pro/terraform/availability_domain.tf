data "oci_identity_availability_domain" "ad1" {
  compartment_id = var.ociTenancyOcid
  ad_number      = 1
}

resource "random_string" "key" {
  length  = 4
  special = false
  upper   = false
  numeric = true
}

locals {
  effective_key = var.runKey != "" ? var.runKey : random_string.key.result
  app_label     = "${var.runName}-${local.effective_key}"
}
