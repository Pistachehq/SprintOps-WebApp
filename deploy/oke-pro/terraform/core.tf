# VCN + subnets + gateways + security lists para el cluster OKE.
# Mismo patron del lab: una subnet para el API endpoint del control plane,
# otra (privada) para los worker nodes y una tercera (publica) para los Load Balancers.

resource "oci_core_vcn" "okevcn" {
  cidr_block     = "10.0.0.0/16"
  compartment_id = var.ociCompartmentOcid
  display_name   = "${local.app_label}-vcn"
  dns_label      = "${var.runName}vcn"
}

resource "oci_core_internet_gateway" "igw" {
  compartment_id = var.ociCompartmentOcid
  display_name   = "${local.app_label}-igw"
  vcn_id         = oci_core_vcn.okevcn.id
}

resource "oci_core_nat_gateway" "ngw" {
  compartment_id = var.ociCompartmentOcid
  vcn_id         = oci_core_vcn.okevcn.id
  display_name   = "${local.app_label}-ngw"
  block_traffic  = "false"
}

data "oci_core_services" "services" {
  filter {
    name   = "name"
    values = ["All .* Services In Oracle Services Network"]
    regex  = true
  }
}

resource "oci_core_service_gateway" "sgw" {
  compartment_id = var.ociCompartmentOcid
  vcn_id         = oci_core_vcn.okevcn.id
  display_name   = "${local.app_label}-sgw"
  services {
    service_id = data.oci_core_services.services.services.0.id
  }
}

# Default route table = ruta publica
resource "oci_core_default_route_table" "public" {
  manage_default_resource_id = oci_core_vcn.okevcn.default_route_table_id
  display_name               = "${local.app_label}-public-rt"
  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.igw.id
  }
}

# Ruta privada: salida a internet via NAT y a Oracle Services via SGW
resource "oci_core_route_table" "private" {
  compartment_id = var.ociCompartmentOcid
  vcn_id         = oci_core_vcn.okevcn.id
  display_name   = "${local.app_label}-private-rt"
  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_nat_gateway.ngw.id
  }
  route_rules {
    destination       = data.oci_core_services.services.services.0.cidr_block
    destination_type  = "SERVICE_CIDR_BLOCK"
    network_entity_id = oci_core_service_gateway.sgw.id
  }
}

# === Subnet del API endpoint de OKE (control plane) ===
resource "oci_core_subnet" "endpoint" {
  cidr_block                 = "10.0.0.0/28"
  compartment_id             = var.ociCompartmentOcid
  vcn_id                     = oci_core_vcn.okevcn.id
  security_list_ids          = [oci_core_security_list.endpoint.id]
  display_name               = "${local.app_label}-endpoint-subnet"
  prohibit_public_ip_on_vnic = false
  route_table_id             = oci_core_vcn.okevcn.default_route_table_id
  dns_label                  = "endpoint"
}

resource "oci_core_security_list" "endpoint" {
  compartment_id = var.ociCompartmentOcid
  vcn_id         = oci_core_vcn.okevcn.id
  display_name   = "${local.app_label}-endpoint-sl"
  # Egress: comunicacion con Oracle Services y workers
  egress_security_rules {
    destination      = data.oci_core_services.services.services.0.cidr_block
    destination_type = "SERVICE_CIDR_BLOCK"
    protocol         = "6"
    tcp_options { min = 443; max = 443 }
  }
  egress_security_rules {
    destination = "10.0.10.0/24"
    protocol    = "6"
  }
  egress_security_rules {
    destination = "10.0.10.0/24"
    protocol    = "1"
    icmp_options { type = 3; code = 4 }
  }
  # Ingress: trafico desde internet al API endpoint y desde workers
  ingress_security_rules {
    source   = "0.0.0.0/0"
    protocol = "6"
    tcp_options { min = 6443; max = 6443 }
    description = "Acceso externo al API endpoint de Kubernetes"
  }
  ingress_security_rules {
    source   = "10.0.10.0/24"
    protocol = "6"
    tcp_options { min = 6443; max = 6443 }
    description = "Workers al API endpoint"
  }
  ingress_security_rules {
    source   = "10.0.10.0/24"
    protocol = "6"
    tcp_options { min = 12250; max = 12250 }
    description = "Workers al control plane"
  }
}

# === Subnet privada de los worker nodes ===
resource "oci_core_subnet" "nodepool" {
  cidr_block                 = "10.0.10.0/24"
  compartment_id             = var.ociCompartmentOcid
  vcn_id                     = oci_core_vcn.okevcn.id
  security_list_ids          = [oci_core_security_list.nodepool.id]
  display_name               = "${local.app_label}-nodepool-subnet"
  prohibit_public_ip_on_vnic = true
  route_table_id             = oci_core_route_table.private.id
  dns_label                  = "nodepool"
}

resource "oci_core_security_list" "nodepool" {
  compartment_id = var.ociCompartmentOcid
  vcn_id         = oci_core_vcn.okevcn.id
  display_name   = "${local.app_label}-nodepool-sl"
  # Egress
  egress_security_rules { destination = "10.0.10.0/24"; protocol = "all" }
  egress_security_rules {
    destination = "10.0.0.0/28"
    protocol    = "6"
    tcp_options { min = 6443; max = 6443 }
  }
  egress_security_rules {
    destination = "10.0.0.0/28"
    protocol    = "6"
    tcp_options { min = 12250; max = 12250 }
  }
  egress_security_rules {
    destination      = data.oci_core_services.services.services.0.cidr_block
    destination_type = "SERVICE_CIDR_BLOCK"
    protocol         = "6"
    tcp_options { min = 443; max = 443 }
  }
  egress_security_rules { destination = "0.0.0.0/0"; protocol = "all" }
  # Ingress
  ingress_security_rules { source = "10.0.10.0/24"; protocol = "all" }
  ingress_security_rules {
    source   = "10.0.0.0/28"
    protocol = "6"
  }
  ingress_security_rules {
    source   = "0.0.0.0/0"
    protocol = "6"
    tcp_options { min = 22; max = 22 }
    description = "SSH a worker nodes"
  }
}

# === Subnet publica de los Load Balancers (donde aparece la IP publica del frontend) ===
resource "oci_core_subnet" "svclb" {
  cidr_block                 = "10.0.20.0/24"
  compartment_id             = var.ociCompartmentOcid
  vcn_id                     = oci_core_vcn.okevcn.id
  security_list_ids          = [oci_core_security_list.svclb.id]
  display_name               = "${local.app_label}-svclb-subnet"
  prohibit_public_ip_on_vnic = false
  route_table_id             = oci_core_vcn.okevcn.default_route_table_id
  dns_label                  = "svclb"
}

resource "oci_core_security_list" "svclb" {
  compartment_id = var.ociCompartmentOcid
  vcn_id         = oci_core_vcn.okevcn.id
  display_name   = "${local.app_label}-svclb-sl"
  egress_security_rules { destination = "0.0.0.0/0"; protocol = "6" }
  ingress_security_rules { source = "0.0.0.0/0"; protocol = "6" }
}
