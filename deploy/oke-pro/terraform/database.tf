# Oracle Autonomous Database Transaction Processing.
# Always Free permite 2 ADBs gratis para siempre con 1 OCPU / 20 GB cada una.

resource "oci_database_autonomous_database" "sprintops_db" {
  compartment_id           = var.ociCompartmentOcid
  db_name                  = upper(replace("${var.runName}${local.effective_key}", "-", ""))
  display_name             = "${local.app_label}-db"
  admin_password           = var.adbAdminPassword
  cpu_core_count           = var.adbCpuCoreCount
  data_storage_size_in_tbs = var.adbStorageTbs
  db_workload              = "OLTP"
  is_free_tier             = var.adbIsFreeTier
  license_model            = var.adbIsFreeTier ? "LICENSE_INCLUDED" : "BRING_YOUR_OWN_LICENSE"
  is_auto_scaling_enabled  = false

  # Habilitar acceso publico con TLS mutuo (default). Suficiente para que pods de OKE conecten via wallet.
}

# Generar el wallet (zip con TNS aliases + tlskey + ojdbc.properties) para meterlo como Secret en K8s.
resource "oci_database_autonomous_database_wallet" "sprintops_wallet" {
  autonomous_database_id = oci_database_autonomous_database.sprintops_db.id
  password               = var.adbAdminPassword
  generate_type          = "SINGLE"
  base64_encode_content  = true
}

resource "local_file" "wallet_zip" {
  content_base64 = oci_database_autonomous_database_wallet.sprintops_wallet.content
  filename       = "${path.module}/wallet.zip"
  file_permission = "0600"
}
