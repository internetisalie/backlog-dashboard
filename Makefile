.PHONY: help build push deploy build-push build-push-deploy clean

DOCKER_IMAGE ?= backlog-dashboard
DOCKER_REGISTRY ?= registry.internetisalie.net
VERSION := $(shell node -e "console.log(require('./package.json').version)")
DOCKER_TAG ?= $(VERSION)
IMAGE_FULL = $(DOCKER_REGISTRY)/$(DOCKER_IMAGE):$(DOCKER_TAG)
HELM_RELEASE ?= backlog
HELM_CHART = ./helm/backlog-dashboard
HELM_VALUES ?= ./helm/backlog-dashboard/values-k3s.yaml
K8S_NAMESPACE ?= default

help:
	@echo "Backlog Dashboard Deployment Commands"
	@echo "======================================"
	@echo ""
	@echo "Build and Deploy:"
	@echo "  make build              - Build Docker image"
	@echo "  make push               - Push image to registry"
	@echo "  make deploy             - Deploy with Helm"
	@echo "  make build-push         - Build and push (no deploy)"
	@echo "  make build-push-deploy  - Full build, push, and deploy"
	@echo ""
	@echo "Individual Steps:"
	@echo "  make docker-build       - Build Docker image locally"
	@echo "  make docker-push        - Push to registry"
	@echo "  make helm-install       - Install Helm chart"
	@echo "  make helm-upgrade       - Upgrade existing Helm release"
	@echo "  make helm-status        - Show Helm release status"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean              - Clean local Docker images"
	@echo "  make logs               - Tail pod logs"
	@echo ""
	@echo "Variables:"
	@echo "  DOCKER_IMAGE=$(DOCKER_IMAGE)"
	@echo "  DOCKER_REGISTRY=$(DOCKER_REGISTRY)"
	@echo "  DOCKER_TAG=$(DOCKER_TAG)"
	@echo "  HELM_RELEASE=$(HELM_RELEASE)"
	@echo "  HELM_VALUES=$(HELM_VALUES)"
	@echo "  K8S_NAMESPACE=$(K8S_NAMESPACE)"
	@echo ""
	@echo "Example:"
	@echo "  make build-push-deploy DOCKER_TAG=v1.0.0"

docker-build:
	@echo "🐳 Building Docker image: $(IMAGE_FULL)"
	docker build -t $(DOCKER_IMAGE):$(DOCKER_TAG) .
	docker tag $(DOCKER_IMAGE):$(DOCKER_TAG) $(IMAGE_FULL)
	@echo "✅ Build complete: $(IMAGE_FULL)"

docker-push: docker-build
	@echo "📤 Pushing to registry: $(IMAGE_FULL)"
	docker push $(IMAGE_FULL)
	@echo "✅ Push complete"

build: docker-build

push: docker-push

helm-install:
	@echo "📦 Installing Helm chart..."
	helm install $(HELM_RELEASE) $(HELM_CHART) \
		-f $(HELM_VALUES) \
		-n $(K8S_NAMESPACE) \
		--create-namespace
	@echo "✅ Helm install complete"

helm-upgrade:
	@echo "📦 Upgrading Helm release..."
	helm upgrade $(HELM_RELEASE) $(HELM_CHART) \
		-f $(HELM_VALUES) \
		-n $(K8S_NAMESPACE) \
		--set image.tag=$(DOCKER_TAG)
	@echo "✅ Helm upgrade complete"

deploy: helm-upgrade

helm-status:
	@echo "📊 Helm release status:"
	helm status $(HELM_RELEASE) -n $(K8S_NAMESPACE)
	@echo ""
	@echo "📋 Pod status:"
	kubectl get pods -n $(K8S_NAMESPACE) -l app.kubernetes.io/name=$(DOCKER_IMAGE)
	@echo ""
	@echo "🌐 Ingress status:"
	kubectl get ingress -n $(K8S_NAMESPACE) -l app.kubernetes.io/name=$(DOCKER_IMAGE)

build-push: docker-push
	@echo "✅ Build and push complete"

build-push-deploy: docker-push helm-upgrade
	@echo "✅ Build, push, and deploy complete"
	@echo ""
	$(MAKE) helm-status

logs:
	@echo "📋 Following logs for $(DOCKER_IMAGE)..."
	kubectl logs -f -n $(K8S_NAMESPACE) -l app.kubernetes.io/name=$(DOCKER_IMAGE) --all-containers=true

clean:
	@echo "🗑️  Cleaning Docker images..."
	docker rmi $(DOCKER_IMAGE):$(DOCKER_TAG) 2>/dev/null || true
	docker rmi $(IMAGE_FULL) 2>/dev/null || true
	@echo "✅ Clean complete"

.DEFAULT_GOAL := help
