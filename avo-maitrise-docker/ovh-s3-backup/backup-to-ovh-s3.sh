#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# AVO-MAÎTRISE — SAUVEGARDE CHIFFRÉE VERS OVHCLOUD OBJECT STORAGE (S3)
# Un dossier isolé par cabinet : s3://BUCKET/<CABINET_ID>/
# Usage : ./backup-to-ovh-s3.sh [chemin/vers/ovh-backup.env]
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${1:-$SCRIPT_DIR/ovh-backup.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[ERREUR] Fichier de configuration introuvable : $ENV_FILE"
  echo "Copiez ovh-backup.env.example en ovh-backup.env et renseignez vos clés OVH S3."
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

export AWS_DEFAULT_REGION="$OVH_S3_REGION"
export RESTIC_REPOSITORY="s3:https://s3.${OVH_S3_REGION}.io.cloud.ovh.net/${OVH_S3_BUCKET}/${CABINET_ID}"
export RESTIC_PASSWORD

echo "=================================================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Début sauvegarde OVH S3 — Cabinet : ${CABINET_ID}"
echo "Dépôt cible : ${RESTIC_REPOSITORY}"
echo "=================================================================="

# 1. Initialiser le dépôt S3 du cabinet automatiquement lors de la première exécution
if ! restic snapshots >/dev/null 2>&1; then
  echo "[INFO] Première exécution pour '${CABINET_ID}' : initialisation du dépôt chiffré..."
  restic init
fi

# 2. Construire la liste des dossiers/fichiers existants à sauvegarder
PATHS_TO_BACKUP=()
for p in \
  "${STACK_ROOT}/mysql/backup" \
  "${STACK_ROOT}/mysql/.env" \
  "${STACK_ROOT}/mysql/docker-compose.yml" \
  "${STACK_ROOT}/minio/backup" \
  "${STACK_ROOT}/minio/.env" \
  "${STACK_ROOT}/minio/docker-compose.yml" \
  "${KEYCLOAK_BACKUP_DIR}" \
  "${STACK_ROOT}/keycloak-server/.env" \
  "${STACK_ROOT}/keycloak-server/docker-compose.yml" \
  "${STACK_ROOT}/keycloak-server/docker-compose.override.yml" \
  "${STACK_ROOT}/keycloak-server/caddy" \
  "${STACK_ROOT}/keycloak-server/avo-theme" \
  "${STACK_ROOT}/avo-app/.env" \
  "${STACK_ROOT}/avo-app/docker-compose.yml" \
  "${STACK_ROOT}/caddy/Caddyfile" \
  "${STACK_ROOT}/caddy/.env" \
  "${STACK_ROOT}/caddy/docker-compose.yml" \
  "${STACK_ROOT}/qdrant/backup" \
  "${STACK_ROOT}/qdrant/.env" \
  "${STACK_ROOT}/qdrant/docker-compose.yml" \
  "${STACK_ROOT}/ollama/Modelfile" \
  "${STACK_ROOT}/ollama/.env" \
  "${STACK_ROOT}/ollama/docker-compose.yml" \
  "${STACK_ROOT}/portainer/docker-compose.yml"
do
  if [[ -e "$p" ]]; then
    PATHS_TO_BACKUP+=("$p")
  fi
done

if [[ ${#PATHS_TO_BACKUP[@]} -eq 0 ]]; then
  echo "[ERREUR] Aucun dossier de sauvegarde trouvé sous STACK_ROOT=${STACK_ROOT}"
  exit 1
fi

# 3. Exécuter la sauvegarde incrémentale chiffrée
echo "[INFO] Envoi de ${#PATHS_TO_BACKUP[@]} éléments vers OVH S3..."
restic backup "${PATHS_TO_BACKUP[@]}" \
  --tag "${CABINET_ID}" \
  --tag "auto" \
  --exclude="*.log" \
  --exclude="*.tmp"

# 4. Appliquer la politique de rétention et nettoyer les anciens blocs
echo "[INFO] Application de la rétention (${KEEP_DAILY:-7}j / ${KEEP_WEEKLY:-4}sem / ${KEEP_MONTHLY:-6}mois)..."
restic forget \
  --keep-daily "${KEEP_DAILY:-7}" \
  --keep-weekly "${KEEP_WEEKLY:-4}" \
  --keep-monthly "${KEEP_MONTHLY:-6}" \
  --prune

# 5. Vérification rapide d'intégrité des métadonnées
restic check

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sauvegarde OVH S3 terminée avec succès pour '${CABINET_ID}'."
