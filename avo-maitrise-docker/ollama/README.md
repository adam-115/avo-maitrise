# Serveur LLM (Ollama + Qwen) — VPS dédié

VPS OVH VPS-4 (8 vCores, 24 Go RAM, sans GPU), séparé du serveur applicatif.

- Chat : `avo-qwen` = Qwen3.6-35B-A3B en UD-Q3_K_XL (~16 Go), défini dans `Modelfile`
- Embeddings : `nomic-embed-text` (le même modèle qu'avant, donc pas besoin de réindexer Qdrant)

## Démarrage

```bash
cp .env.example .env        # puis adapter OLLAMA_BIND_IP
docker compose up -d
docker compose logs -f ollama-init     # premier téléchargement ~16 Go
docker exec -it ollama ollama run avo-qwen --verbose "Bonjour"
```

## Sécurité

Ollama n'a **aucune authentification**, et **Docker contourne ufw**. Il faut donc une de ces protections :

1. Tunnel WireGuard/Tailscale entre les deux VPS, avec `OLLAMA_BIND_IP=<IP du tunnel>` (recommandé)
2. Pare-feu réseau OVH : n'autoriser le port 11434 que depuis l'IP du VPS applicatif
3. `iptables -I DOCKER-USER -p tcp --dport 11434 ! -s <IP_VPS_APP> -j DROP` (à rendre persistant)

Pour vérifier : `curl http://<IP_VPS_LLM>:11434` doit échouer depuis toute machine autre que le VPS applicatif.

## Côté application

- `.env` de `avo-app` : `OLLAMA_BASE_URL=http://<IP_VPS_LLM>:11434` (embeddings)
- Écran d'administration IA : provider `OLLAMA`, URL `http://<IP_VPS_LLM>:11434`, modèle `avo-qwen`
- Désactiver le mode « thinking » de Qwen (`think=false`). Sinon, chaque réponse prend plusieurs minutes sur CPU.
