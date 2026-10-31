# Technical references

- **Last verified:** 31 October 2026.
- **Primary source policy:** Microsoft Learn and official Microsoft/Azure service documentation. Use the live documentation to re-check region, SKU, quota, plan, and feature availability before production decisions.

| Service/topic | Official source | Used for |
|---|---|---|
| App Service overview | [Overview of Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/overview) | Managed web/API hosting, supported application stacks, custom-container availability |
| App Service custom containers | [Configure a custom container](https://learn.microsoft.com/en-us/azure/app-service/configure-custom-container) | App Service can host custom container images; container deployment does not by itself require Kubernetes |
| App Service networking | [Networking features](https://learn.microsoft.com/en-us/azure/app-service/networking-features) | Inbound versus outbound networking feature distinctions and plan-specific constraints |
| App Service VNet integration | [Integrate your app with an Azure virtual network](https://learn.microsoft.com/en-us/azure/app-service/overview-vnet-integration) | VNet integration is outbound access; private endpoint is a distinct inbound private-access feature |
| App Service deployment slots | [Set up staging environments](https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots) | Slots are live apps and availability depends on the selected plan tier |
| Container Apps overview | [Azure Container Apps overview](https://learn.microsoft.com/en-us/azure/container-apps/overview) | APIs, jobs, ingress, Dapr option, KEDA scaling, revisions, internal service discovery, scale-to-zero caveat |
| Container Apps scaling | [Scaling in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/scale-app) | Scaling signals, replicas, minimum capacity, CPU/memory and scale-to-zero qualifications |
| Container Apps jobs | [Jobs in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/jobs) | Continuing applications versus finite manual, scheduled and event-driven executions |
| Container Apps plans | [Azure Container Apps plan types](https://learn.microsoft.com/en-us/azure/container-apps/plans) | Consumption and Dedicated plan trade-offs, dedicated hardware, serverless GPU path |
| Container Apps workload profiles | [Workload profiles](https://learn.microsoft.com/en-us/azure/container-apps/workload-profiles-overview) | Profile types, specialized compute, GPU and region-specific availability |
| Container Apps networking | [Networking in an Azure Container Apps environment](https://learn.microsoft.com/en-us/azure/container-apps/networking) | Environment types, custom VNet, public/internal accessibility, private endpoints, network limitations |
| Container Apps serverless GPU | [Using serverless GPUs in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/gpu-serverless-overview) | GPU profile type, supported GPU types, quota and region caveats, workload limitations |
| Container Instances | [Serverless containers in Azure](https://learn.microsoft.com/en-us/azure/container-instances/container-instances-overview) | Brief alternative for isolated containers that do not need a higher-level orchestrator |
| AKS overview | [What is Azure Kubernetes Service?](https://learn.microsoft.com/en-us/azure/aks/what-is-aks) | AKS managed Kubernetes model |
| AKS Automatic | [Introduction to AKS Automatic](https://learn.microsoft.com/en-us/azure/aks/intro-aks-automatic) | Automatic operating model and Automatic/Standard comparison |
| AKS managed system nodes | [AKS Automatic managed system node pools](https://learn.microsoft.com/en-us/azure/aks/automatic/aks-automatic-managed-system-node-pools-about) | Infrastructure automation, system-node management, Automatic limitations |
| AKS GPU guidance | [GPU best practices for AKS](https://learn.microsoft.com/en-us/azure/aks/best-practices-gpu) | Automatic as a documented default for many AKS GPU workloads; Standard for advanced customization; placement and validation remain important |
| Azure Functions hosting | [Azure Functions scale and hosting](https://learn.microsoft.com/en-us/azure/azure-functions/functions-scale) | Hosting-option differences, legacy Consumption note, plan-specific behaviors |
| Functions Flex Consumption | [Azure Functions Flex Consumption plan](https://learn.microsoft.com/en-us/azure/azure-functions/flex-consumption-plan) | Microsoft-recommended serverless plan, scaling, VNet support, always-ready instances |
| Static Web Apps | [What is Azure Static Web Apps?](https://learn.microsoft.com/en-us/azure/static-web-apps/overview) | Static asset hosting, API integration, repository deployments |
| Azure pricing | [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/) | Cost investigation; no fixed monthly prices are asserted in this project |
| App Service PHP runtime | [Configure a PHP app in Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/configure-language-php) | Check supported PHP versions and runtime configuration before hosting PHP applications |
| App Service Linux file persistence | [Use persistent shared storage](https://learn.microsoft.com/en-us/azure/app-service/configure-custom-container?pivots=container-linux#use-persistent-shared-storage) | Linux custom-container persistence is disabled by default; configure and validate `/home` or mounted storage across restarts and instances |
| App Service mounted storage | [Mount Azure Storage as a local share](https://learn.microsoft.com/en-us/azure/app-service/configure-connect-to-azure-storage?tabs=portal&pivots=container-linux) | Validate separately mounted Azure Files storage and sharing options |
| Azure Virtual Machines | [Overview of Azure virtual machines](https://learn.microsoft.com/en-us/azure/virtual-machines/overview) | Guest OS control and the operational responsibilities that accompany IaaS |
| WordPress requirements | [Requirements](https://wordpress.org/about/requirements/) | WordPress runtime and supported database requirements |
| WordPress database setup | [Installing WordPress](https://developer.wordpress.org/advanced-administration/before-install/howto-install/) | Official WordPress installation and database guidance |
| Azure Database for MariaDB retirement | [Microsoft Lifecycle retirement table](https://learn.microsoft.com/en-us/lifecycle/announcements/azure-products-retirement-september-2025) | Direct, readable confirmation of the 19 September 2025 Azure service retirement; not retirement of the MariaDB engine |
| MySQL Flexible Server dump and restore | [Migrate using dump and restore](https://learn.microsoft.com/en-us/azure/mysql/flexible-server/concepts-migrate-dump-restore) | Logical dump/restore tooling; source/target engine compatibility and application validation remain required |
| MySQL Flexible Server networking | [Networking concepts](https://learn.microsoft.com/en-us/azure/mysql/flexible-server/concepts-networking) | Public/private database access and network configuration considerations |
| Model-serving alternative | [Azure Machine Learning online endpoints](https://learn.microsoft.com/en-us/azure/machine-learning/concept-endpoints-online?view=azureml-api-2) | Model-serving lifecycle as a distinct alternative to general-purpose application hosting |

## Verification notes

- The Microsoft documentation consulted for the initial release was current on 31 October 2026. A later maintenance pass should refresh this date and recheck all service claims.
- Container Apps GPU is not a blanket statement that any model, GPU, region, or profile is supported. Serverless GPUs are for Consumption workload profiles; Dedicated GPU profiles are distinct, and availability/quotas/limitations must be checked.
- AKS Automatic can be relevant to GPU workloads. GPU alone does not force AKS Standard; cluster customization and exact supported hardware are separate decisions.
- App Service VNet integration and private endpoint solve different traffic-direction needs.
- WordPress's documented current recommendations are PHP 8.3+, MariaDB 10.11+, or MySQL 8.0+. Its supported database engine is a dependency constraint, not a compute recommendation. Validate PHP extensions, plugin behavior, database compatibility, and file persistence for the selected hosting configuration.
- Azure Database for MariaDB retired on 19 September 2025. The dump/restore guide is a starting point for MySQL Flexible Server migration planning, not a claim that MariaDB and MySQL are interchangeable without testing.
- Azure VMs are conditionally recommended only for verified guest-OS or server-level requirements. Teams must account for guest OS administration and patching.
- No price, workload benchmark, service popularity, or percentage-fit claim is included.

## Editorial review qualifications

- Container Apps app-level external ingress is not necessarily internet-public: an internal environment has no public endpoint. Read environment accessibility, public network access, private endpoints and ingress together.
- Current App Service built-in PHP support is on Linux; the Windows PHP runtime is no longer supported.
- AKS Automatic versus Standard is an operating-model distinction. It must not be confused with Free, Standard and Premium pricing/SLA tiers. Automatic has fixed, default and optional features; Standard can also use automation.
- Flex Consumption is a Linux, code-deployment hosting option, not a custom-container host. Other Functions hosting options have different capabilities.
- App Service slot swaps do not undo database schema changes. The migration scenarios deliberately require application/data compatibility and tested recovery.
- The previous Linux FAQ persistence fragment no longer exists. The article now links to the verified persistent-shared-storage section in the custom-container documentation.
- Original diagrams illustrate decision boundaries, not complete production network designs. Scenarios are fictional teaching examples, not customer case studies or benchmarks.
- The linked primary sources support this technical review. It is not an independent expert sign-off, a deployed Azure workload test or a complete accessibility audit.
