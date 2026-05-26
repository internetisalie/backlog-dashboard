# Backlog Dashboard Helm Chart

Deploy the Backlog Dashboard to Kubernetes using Helm.

## Installation

### Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- Docker image built and available: `backlog-dashboard:latest`

### Quick Start

1. **Build the Docker image:**
   ```bash
   docker build -t backlog-dashboard:latest .
   ```

2. **Customize values:**
   Edit `values.yaml` to configure your backlog repositories:
   ```yaml
   backlog:
     config:
       backlogs:
         - name: "MyProject"
           path: "/host/path/to/project"
           mountPath: "/repos/myproject"
     volumes:
       - name: myproject
         hostPath:
           path: /host/path/to/project
           type: Directory
   ```

3. **Install the chart:**
   ```bash
   helm install backlog-dashboard ./helm/backlog-dashboard
   ```

4. **Access the dashboard:**
   ```bash
   kubectl port-forward svc/backlog-dashboard 8070:3000
   # Open http://localhost:8070
   ```

## Configuration

See `values.yaml` for all configurable parameters.

## Ingress

To expose via ingress, set `ingress.enabled=true` in values.yaml.

## Uninstall

```bash
helm uninstall backlog-dashboard
```
