# Repos en Oracle Container Registry (OCIR) para las imagenes de backend y frontend.
# Incluimos el sufijo aleatorio en el nombre para no chocar con repos de runs previos
# (OCIR no admite recrear un repo con el mismo nombre aunque ya este vacio).

resource "oci_artifacts_container_repository" "backend" {
  compartment_id = var.ociCompartmentOcid
  display_name   = "${local.app_label}-backend"
  is_public      = false
}

resource "oci_artifacts_container_repository" "frontend" {
  compartment_id = var.ociCompartmentOcid
  display_name   = "${local.app_label}-frontend"
  is_public      = false
}
