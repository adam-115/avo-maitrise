# Guide Complet d'Installation, de Configuration et de Sauvegarde des VPS

Ce guide détaille pas-à-pas la configuration d'un serveur vierge (sous Ubuntu 22.04/24.04 ou Debian), la sécurisation de base, l'installation de Docker, ainsi que la stratégie de sauvegarde locale automatisée.

---

## Étape 1 : Préparation et Sécurisation du Serveur (À faire sur chaque VPS)

Par défaut, vous vous connectez en tant que `root`. Il est fortement recommandé de créer un utilisateur dédié.

### 1.1 Mettre à jour le système
```bash
apt update && apt upgrade -y
```

### 1.2 Créer un utilisateur non-root
Remplacez `deployer` par le nom d'utilisateur que vous souhaitez.
```bash
adduser deployer
# Suivez les instructions pour définir un mot de passe sécurisé

# Ajouter l'utilisateur au groupe sudo pour lui donner les droits d'administration
usermod -aG sudo deployer
```

Passez sur ce nouvel utilisateur pour la suite :
```bash
su - deployer
```

---

## Étape 2 : Installation de Docker et Docker Compose (À faire sur chaque VPS)

Utilisez le script officiel de Docker pour une installation rapide et sécurisée.

```bash
# Télécharger et lancer le script d'installation officiel
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter votre utilisateur au groupe docker pour éviter de taper 'sudo' à chaque fois
sudo usermod -aG docker $USER

# Activer Docker au démarrage
sudo systemctl enable docker
sudo systemctl start docker
```
*Note : Vous devrez vous déconnecter puis vous reconnecter pour que les droits du groupe `docker` s'appliquent.*

---

## Étape 3 : Configuration du Pare-feu UFW

La sécurisation des ports est vitale, en particulier pour le VPS 3 (Ollama) qui n'a pas de proxy exposé au public.

### Pour le VPS 1 (SSO) et le VPS 2 (Client)
Ces serveurs utilisent Caddy, ils ont besoin des ports Web ouverts.
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Pour le VPS 3 (IA - Ollama)
**CRITIQUE :** Si vous utilisez une communication par IP publique, ne laissez pas le port 11434 ouvert à tout le monde.
```bash
sudo ufw allow OpenSSH
# N'autoriser QUE l'adresse IP du VPS 2 à accéder au port d'Ollama
sudo ufw allow from [METTRE_L_IP_DU_VPS_2] to any port 11434
sudo ufw enable
```

---

## Étape 4 : Déploiement (Application des docker-compose)

Sur chaque VPS, créez le dossier de projet, insérez le fichier `docker-compose.yml` (voir le Blueprint), et lancez-le.

```bash
mkdir mon-app
cd mon-app
nano docker-compose.yml
# Collez le contenu du docker-compose correspondant au VPS
# Sauvegardez avec Ctrl+O, Entrée, puis Ctrl+X

# Lancer les services en arrière-plan
docker compose up -d
```

---

## Étape 5 : Sauvegardes Locales (Backups)

Nous allons créer des scripts de sauvegarde et les automatiser avec `cron`. Créez d'abord un dossier pour stocker les sauvegardes :

```bash
sudo mkdir -p /backups
sudo chown deployer:deployer /backups
```

### 5.1 Sauvegarde du VPS 1 (Keycloak / PostgreSQL)

Créez le fichier de script : `nano ~/backup_vps1.sh`

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/backups"

# 1. Sauvegarde de la base de données PostgreSQL
docker exec -t mon-app-postgres-1 pg_dumpall -c -U keycloak > $BACKUP_DIR/keycloak_db_$DATE.sql

# Compression pour gagner de l'espace
gzip $BACKUP_DIR/keycloak_db_$DATE.sql

# 2. Suppression des sauvegardes de plus de 7 jours (Rotation)
find $BACKUP_DIR -name "keycloak_db_*.sql.gz" -type f -mtime +7 -delete
```

### 5.2 Sauvegarde du VPS 2 (Client : MySQL, Minio, Qdrant)

Créez le fichier de script : `nano ~/backup_vps2.sh`

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/backups"

# 1. Sauvegarde MySQL (Base de données relationnelle)
docker exec mon-app-mysql-1 sh -c 'exec mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" si-legale' > $BACKUP_DIR/mysql_$DATE.sql
gzip $BACKUP_DIR/mysql_$DATE.sql

# 2. Sauvegarde de Minio (Documents) 
# Minio stocke les fichiers dans le volume Docker, on archive le contenu du volume.
docker run --rm --volumes-from mon-app-minio-1 -v $BACKUP_DIR:/backup ubuntu tar cvzf /backup/minio_data_$DATE.tar.gz /data

# 3. Sauvegarde de Qdrant (Base Vectorielle)
docker run --rm --volumes-from mon-app-qdrant-1 -v $BACKUP_DIR:/backup ubuntu tar cvzf /backup/qdrant_data_$DATE.tar.gz /qdrant/storage

# 4. Rotation : Garder uniquement les 7 derniers jours
find $BACKUP_DIR -name "*.gz" -type f -mtime +7 -delete
```

### 5.3 Sauvegarde du VPS 3 (IA - Ollama)

Il n'est pas strictement nécessaire de sauvegarder le dossier d'Ollama quotidiennement, car il ne contient que les modèles téléchargés (qui peuvent être retéléchargés via `ollama run`). Cependant, si vous souhaitez conserver les modèles en local :

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M-%S)
docker run --rm --volumes-from mon-app-ollama-1 -v /backups:/backup ubuntu tar cvzf /backup/ollama_models_$DATE.tar.gz /root/.ollama
```

### 5.4 Automatisation (Tâche Cron)

Rendez vos scripts exécutables :
```bash
chmod +x ~/backup_vps*.sh
```

Ajoutez la tâche au planificateur (Cron) pour qu'elle s'exécute automatiquement **tous les jours à 2h du matin** :
```bash
crontab -e
```
Ajoutez cette ligne à la fin du fichier :
```text
0 2 * * * /home/deployer/backup_vps1.sh >> /home/deployer/backup.log 2>&1
```
*(Modifiez `backup_vps1.sh` par le nom du script correspondant à votre VPS).*
