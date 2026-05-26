# Backlog Dashboard - Quick Reference

## K3s Deployment with Traefik

### One-Command Deploy
```bash
# Build, import, and deploy
docker build -t backlog-dashboard:latest . && \
docker save backlog-dashboard:latest | sudo k3s ctr images import - && \
helm install backlog ./helm/backlog-dashboard -f ./helm/backlog-dashboard/values-k3s.yaml
```

### Access
- **URL**: https://backlog.internetisalie.net
- **API**: https://backlog.internetisalie.net/api/backlog

### Common Commands

```bash
# Check status
kubectl get pods,svc,ingress -l app.kubernetes.io/name=backlog-dashboard

# View logs
kubectl logs -l app.kubernetes.io/name=backlog-dashboard -f

# Restart
kubectl rollout restart deployment/backlog-dashboard

# Update after code changes
docker build -t backlog-dashboard:latest . && \
docker save backlog-dashboard:latest | sudo k3s ctr images import - && \
kubectl rollout restart deployment/backlog-dashboard

# Upgrade configuration
helm upgrade backlog ./helm/backlog-dashboard -f ./helm/backlog-dashboard/values-k3s.yaml

# Uninstall
helm uninstall backlog
```

### Debug

```bash
# Exec into pod
kubectl exec -it deployment/backlog-dashboard -- sh

# Check config
kubectl exec -it deployment/backlog-dashboard -- cat /config/backlogs.yaml

# Check repos
kubectl exec -it deployment/backlog-dashboard -- ls -la /repos/

# Test API internally
kubectl exec -it deployment/backlog-dashboard -- wget -O- http://localhost:3000/api/backlog | head

# Verify Traefik
kubectl get pods -n kube-system -l app.kubernetes.io/name=traefik
kubectl logs -n kube-system -l app.kubernetes.io/name=traefik | tail -50
```

### Configuration Files

| File | Purpose |
|------|---------|
| `values-k3s.yaml` | Basic k3s deployment with Traefik |
| `values-k3s-traefik-advanced.yaml` | With security headers & compression |
| `values-local.yaml` | Local development (NodePort) |
| `values.yaml` | Template/default values |
| `traefik-middleware.yaml` | Traefik middlewares (security, compression, rate-limit) |

### Traefik Configuration

**Domain**: backlog.internetisalie.net  
**TLS Secret**: internetisalie-net-fullcert  
**Ingress Class**: traefik  
**Entry Point**: websecure (HTTPS)

### HostPath Volumes

```yaml
/home/mini/Documents/src/glimmer-project → /repos/glimmer-project
/home/mini/Documents/src/lua/lunar/docs  → /repos/lunar/docs
```

### Resources

```yaml
Requests: 100m CPU, 128Mi RAM
Limits:   500m CPU, 512Mi RAM
```

## Local Development

### Without Kubernetes

```bash
# Dev server (port 3000)
npm run dev

# Build and run production
npm run build && npm run start
```

### Config Location

- **Host**: `~/.config/backlog/backlog-dashboard/backlogs.yaml`
- **Container**: `/config/backlogs.yaml`
- **Cache**: `/home/nextjs/.cache/backlog/backlog-dashboard/`

## Troubleshooting

| Issue | Check |
|-------|-------|
| Empty data | Check logs for "backlog-watcher", verify repo paths exist |
| 404 on domain | Verify DNS, check Traefik logs, ensure ingress exists |
| TLS errors | Verify secret exists: `kubectl get secret internetisalie-net-fullcert` |
| Pod won't start | Check events: `kubectl describe pod -l app.kubernetes.io/name=backlog-dashboard` |
| Config not loading | Check ConfigMap: `kubectl describe cm backlog-dashboard-config` |

## Documentation

- `README.md` - Project overview
- `DEPLOYMENT.md` - General deployment guide
- `K3S_DEPLOYMENT.md` - K3s/Traefik specific guide
- `DOCKER_DIAGNOSIS.md` - Container troubleshooting
- `helm/backlog-dashboard/README.md` - Helm chart documentation
