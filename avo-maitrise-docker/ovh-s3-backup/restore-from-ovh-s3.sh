#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# AVO-MAÎTRISE — RESTAURATION DEPUIS OVHCLOUD OBJECT STORAGE (S3)
# Usage :
#   ./restore-from-ovh-s3.sh list                    -> lister les snapshots du cabinet
#   ./restore-from-ovh-s3.sh latest [dossier_cible]  -> restaurer la dernière sauvegarde
#   ./restore-from-ovh-s3.sh <SNAPSHOT_ID> [cible]   -> restaurer une date précise
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${OVH_BACKUP_ENV:-$SCRIPT_DIR/ovh-backup.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[ERREUR] Fichier de configuration introuvable : $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

export AWS_DEFAULT_REGION="$OVH_S3_REGION"
export RESTIC_REPOSITORY="s3:https://s3.${OVH_S3_REGION}.io.cloud.ovh.net/${OVH_S3_BUCKET}/${CABINET_ID}"
export RESTIC_PASSWORD

ACTION="${1:-list}"
TARGET_DIR="${2:-/home/adam/restore-${CABINET_ID}-$(date +%Y%m%d-%H%M%S)}"

if [[ "$ACTION" == "list" ]]; then
  echo "=== Snapshots disponibles sur OVH S3 pour le cabinet : ${CABINET_ID} ==="
  restic snapshots
  exit 0
fi

echo "=================================================================="
echo "Restauration du cabinet : ${CABINET_ID}"
echo "Snapshot sélectionné    : ${ACTION}"
echo "Dossier de destination  : ${TARGET_DIR}"
echo "=================================================================="

mkdir -p "$TARGET_DIR"
restic restore "$ACTION" --target "$TARGET_DIR"

echo ""
echo "[OK] Fichiers restaurés dans : ${TARGET_DIR}"
echo "Étapes suivantes sur le serveur de secours :"
echo "  1. Vérifier les fichiers .env et docker-compose.yml restaurés"
echo "  2. Restaurer MySQL (gunzip -c <dump>.sql.gz | docker exec -i avo-mysql mysql -uroot -p si-legale)"
echo "  3. Restaurer MinIO/SeaweedFS (extraire l'archive dans minio/data)"
echo "  4. Restaurer Keycloak (gunzip -c <dump>.dump.gz | docker exec -i keycloak-postgres pg_restore ...)"
echo "  5. Redémarrer Caddy et Avo-App (docker compose up -d --force-recreate)"
