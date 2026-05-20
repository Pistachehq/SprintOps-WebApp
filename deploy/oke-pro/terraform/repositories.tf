# Repos en Oracle Container Registry (OCIR) para las imagenes de backend y frontend.
# is_public = true los hace accesibles sin auth desde fuera; util para no pelear con imagePullSecrets.
# Si manejas datos sensibles en las imagenes, ponlo en false y mantenemos el ocir-pull secret.

resource "oci_artifacts_container_repository" "backend" {
  compartment_id = var.ociCompartmentOcid
  display_name   = "${var.runName}-backend"
  is_public      = false
}

resource "oci_artifacts_container_repository" "frontend" {
  compartment_id = var.ociCompartmentOcid
  display_name   = "${var.runName}-frontend"
  is_public      = false
}
