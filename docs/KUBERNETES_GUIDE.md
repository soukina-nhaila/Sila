# Guide Kubernetes (Docker Desktop)
1. Docker Desktop → *Settings → Kubernetes → Enable Kubernetes* (attendre « running »).
2. Construire les images (Docker Desktop les rend visibles au cluster local) :
```bash
docker build -t sila-backend:latest ./backend
docker build -t sila-frontend:latest ./frontend
```
3. Déployer :
```bash
kubectl apply -f devops/kubernetes/sila.yaml
kubectl -n sila get pods
kubectl -n sila port-forward svc/frontend 3000:3000   # terminal 1
kubectl -n sila port-forward svc/backend 8000:8000    # terminal 2
```
4. Les données de démo : `kubectl -n sila exec deploy/backend -- python -m app.seed`.
Le manifeste contient : Namespace, ConfigMap, Secret (valeur d'exemple à remplacer), Deployments, Services, Ingress, limites de ressources, probes, `securityContext`, NetworkPolicy (Mongo accessible seulement par le backend).
Limites : volume MongoDB en `emptyDir` (démo) ; Ingress nécessite un contrôleur (nginx) et une entrée `sila.local` dans le fichier hosts ; `NEXT_PUBLIC_API_URL` est figé au build. **Non testé** dans l'environnement de génération.
