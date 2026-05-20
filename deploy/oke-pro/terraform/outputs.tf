output "cluster_id" {
  description = "OCID del cluster OKE"
  value       = oci_containerengine_cluster.sprintops.id
}

output "cluster_name" {
  description = "Nombre del cluster"
  value       = oci_containerengine_cluster.sprintops.name
}

output "ocir_namespace" {
  description = "Tenancy namespace de OCIR"
  value       = data.oci_objectstorage_namespace.ns.namespace
}

output "ocir_backend_repo" {
  description = "Nombre del repo de backend en OCIR"
  value       = oci_artifacts_container_repository.backend.display_name
}

output "ocir_frontend_repo" {
  description = "Nombre del repo de frontend en OCIR"
  value       = oci_artifacts_container_repository.frontend.display_name
}

output "adb_id" {
  description = "OCID de la Autonomous Database"
  value       = oci_database_autonomous_database.sprintops_db.id
}

output "adb_db_name" {
  description = "DB name (sirve para los TNS aliases <DB_NAME>_high, _medium, _low)"
  value       = oci_database_autonomous_database.sprintops_db.db_name
}

output "wallet_zip_path" {
  description = "Path al wallet.zip que el script kubectl-mete-como-Secret"
  value       = local_file.wallet_zip.filename
}

output "region" {
  description = "Region OCI"
  value       = var.ociRegionIdentifier
}

output "app_label" {
  description = "Etiqueta unica del deploy"
  value       = local.app_label
}

data "oci_objectstorage_namespace" "ns" {
  compartment_id = var.ociTenancyOcid
}
