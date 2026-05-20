resource "oci_containerengine_cluster" "sprintops" {
  compartment_id     = var.ociCompartmentOcid
  kubernetes_version = var.kubernetesVersion
  name               = "${local.app_label}-cluster"
  vcn_id             = oci_core_vcn.okevcn.id

  endpoint_config {
    is_public_ip_enabled = true
    subnet_id            = oci_core_subnet.endpoint.id
  }

  options {
    service_lb_subnet_ids = [oci_core_subnet.svclb.id]
    add_ons {
      is_kubernetes_dashboard_enabled = false
      is_tiller_enabled               = false
    }
    admission_controller_options {
      is_pod_security_policy_enabled = false
    }
    kubernetes_network_config {
      pods_cidr     = "10.244.0.0/16"
      services_cidr = "10.96.0.0/16"
    }
  }
}

resource "oci_containerengine_node_pool" "main_pool" {
  cluster_id         = oci_containerengine_cluster.sprintops.id
  compartment_id     = var.ociCompartmentOcid
  kubernetes_version = var.kubernetesVersion
  name               = "${local.app_label}-pool"
  node_shape         = var.nodeShape

  # node_shape_config solo aplica para shapes Flex (E3.Flex, E4.Flex, A1.Flex, etc.)
  dynamic "node_shape_config" {
    for_each = endswith(var.nodeShape, ".Flex") ? [1] : []
    content {
      ocpus         = var.nodeOcpus
      memory_in_gbs = var.nodeMemoryGbs
    }
  }

  node_config_details {
    placement_configs {
      availability_domain = data.oci_identity_availability_domain.ad1.name
      subnet_id           = oci_core_subnet.nodepool.id
    }
    size = var.nodeCount
  }

  node_source_details {
    image_id    = local.oracle_linux_image_id
    source_type = "IMAGE"
  }

  ssh_public_key = var.sshPublicKey
}

# Auto-detectar la imagen Oracle Linux 8 mas reciente compatible con el shape
data "oci_containerengine_node_pool_option" "options" {
  node_pool_option_id = "all"
  compartment_id      = var.ociCompartmentOcid
}

locals {
  # Para shapes ARM (A1.Flex) Oracle pone "aarch64" en el nombre. Para los demas (E3, E4, etc.) es x86_64.
  is_arm = length(regexall("A1\\.", var.nodeShape)) > 0
  matching_images = [
    for source in data.oci_containerengine_node_pool_option.options.sources :
    source.image_id
    if (
      local.is_arm
      ? length(regexall("Oracle-Linux-8.*-aarch64-20[0-9]*", source.source_name)) > 0
      : (length(regexall("Oracle-Linux-8.*-20[0-9]*", source.source_name)) > 0 && length(regexall("aarch64", source.source_name)) == 0)
    )
  ]
  oracle_linux_image_id = local.matching_images[0]
}
