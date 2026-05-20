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

  depends_on = [oci_containerengine_cluster.sprintops]
}

# Imagenes validas para ESTE cluster (version K8s ya aplicada). Evita mezclar ARM con E3.Flex.
data "oci_containerengine_node_pool_option" "options" {
  compartment_id = var.ociCompartmentOcid
  cluster_id       = oci_containerengine_cluster.sprintops.id
}

locals {
  # E3/E4 = x86_64. A1.Flex = ARM (aarch64 en el nombre de la imagen).
  is_arm_shape = length(regexall("A1\\.", var.nodeShape)) > 0

  arch_matching_sources = [
    for source in data.oci_containerengine_node_pool_option.options.sources :
    source
    if source.source_type == "IMAGE" && (
      local.is_arm_shape
      ? length(regexall("(?i)aarch64|arm64", source.source_name)) > 0
      : length(regexall("(?i)aarch64|arm64", source.source_name)) == 0
    )
  ]

  # Mismo criterio que el lab: Oracle Linux reciente, ya filtrado por cluster_id + arquitectura.
  oracle_linux_sources = [
    for source in local.arch_matching_sources :
    source
    if length(regexall("Oracle-Linux-[0-9]+\\.[0-9]+-20[0-9]+", source.source_name)) > 0
      || (
        local.is_arm_shape
        ? length(regexall("Oracle-Linux-8.*-aarch64", source.source_name)) > 0
        : length(regexall("Oracle-Linux-8.*-20[0-9]+", source.source_name)) > 0
      )
  ]

  selected_node_source = length(local.oracle_linux_sources) > 0 ? local.oracle_linux_sources[length(local.oracle_linux_sources) - 1] : local.arch_matching_sources[length(local.arch_matching_sources) - 1]
  oracle_linux_image_id = local.selected_node_source.image_id
}
