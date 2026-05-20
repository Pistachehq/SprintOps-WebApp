variable "ociTenancyOcid" {
  description = "OCID de tu tenancy"
  type        = string
}

variable "ociUserOcid" {
  description = "OCID del usuario que crea los recursos (para tags y, en algunas configs, autenticacion)"
  type        = string
  default     = ""
}

variable "ociCompartmentOcid" {
  description = "OCID del compartimento donde se crean los recursos"
  type        = string
}

variable "ociRegionIdentifier" {
  description = "Identificador de region OCI, p.ej. mx-queretaro-1"
  type        = string
}

variable "runName" {
  description = "Nombre corto del deploy (3-13 chars, alfanumerico, empieza con letra)"
  type        = string
  default     = "sprintops"
  validation {
    condition     = can(regex("^[a-z][a-z0-9]{2,12}$", var.runName))
    error_message = "runName debe tener 3-13 caracteres, alfanumericos en minusculas, empezando por letra."
  }
}

variable "runKey" {
  description = "Sufijo unico de 4 chars para los nombres de recursos (se autogenera si no se da)"
  type        = string
  default     = ""
}

variable "nodeShape" {
  description = "Shape de los nodos del cluster. E3.Flex es de pago pero capacidad garantizada."
  type        = string
  default     = "VM.Standard.E3.Flex"
}

variable "nodeOcpus" {
  description = "OCPUs por nodo"
  type        = number
  default     = 2
}

variable "nodeMemoryGbs" {
  description = "Memoria por nodo en GB"
  type        = number
  default     = 12
}

variable "nodeCount" {
  description = "Numero de nodos en el pool"
  type        = number
  default     = 3
}

variable "kubernetesVersion" {
  description = "Version de Kubernetes para el cluster. Si la version queda obsoleta, OCI rechaza la creacion; revisa versiones disponibles en https://docs.oracle.com/en-us/iaas/Content/ContEng/Concepts/contengaboutk8sversions.htm."
  type        = string
  default     = "v1.34.2"
}

variable "adbCpuCoreCount" {
  description = "OCPU count para Autonomous DB. 1 OCPU entra en Always Free."
  type        = number
  default     = 1
}

variable "adbStorageTbs" {
  description = "Storage en TB para Autonomous DB. 1 TB (= 20 GB Always Free) o mas."
  type        = number
  default     = 1
}

variable "adbIsFreeTier" {
  description = "Crear la DB como Always Free Autonomous DB (gratis para siempre, capa limitada)."
  type        = bool
  default     = true
}

variable "adbAdminPassword" {
  description = "Password de ADMIN para la Autonomous DB. 12-30 chars, minuscula+mayuscula+digito, sin la palabra admin."
  type        = string
  sensitive   = true
}

variable "sshPublicKey" {
  description = "Llave publica SSH que se asigna a los worker nodes (para debuggear via bastion)"
  type        = string
}
