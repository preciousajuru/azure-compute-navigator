# Azure App Service vs Container Apps vs AKS: How Do You Choose the Right One?

*A practical guide to matching an Azure hosting platform to your application and the work your team is prepared to own.*

By **Precious Ajuru** · Technical information reviewed **31 October 2026**

You have built an application.

It works locally.

Now it needs somewhere to run in Azure.

App Service looks reasonable. Container Apps does too. Then Kubernetes enters the conversation, and a hosting decision starts to sound like a platform strategy.

All three can run production applications. But they offer different operating models. The most sophisticated option is not automatically the right one.

The useful question is what your application needs, which constraints matter, and how much infrastructure your team wants to manage.

## Start with the application

"We need to host an application" is not much of a requirement. A static frontend, an HTTP API, a queue worker and a nightly task do different jobs. They need not run on the same service.

Neither does the packaging answer the hosting question. A Docker image tells us how software is packaged; it does not mean Kubernetes is necessary. A managed-model API does not mean you host the model or need a GPU.

For a new application, you can choose the runtime and deployment approach together. For a migration, first inventory what exists: runtime versions, plugins, scheduled work, private network paths and files the application writes. A service that can run your language may still be the wrong destination if a required dependency does not work there.

With that in mind, here is the central distinction.

## Azure App Service: When a web app is just a web app

[Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/overview) is a managed platform for web applications and APIs. You can deploy supported application code or a supported custom container.

Imagine an ASP.NET Core API serving customer records from Azure SQL. The team needs HTTPS, deployment automation and predictable web hosting, but no Kubernetes API or independently managed worker fleet. App Service is a sensible starting point.

App Service plans determine the hosting capacity and which capabilities are available. On eligible tiers, deployment slots let a team validate a running version before switching traffic. They help with code releases; they do not reverse database changes if a new release alters the schema.

Networking is also more specific than “private access”. [VNet integration](https://learn.microsoft.com/en-us/azure/app-service/overview-vnet-integration) gives the app outbound access to resources such as a private database. Private inbound access is a separate configuration. Check the plan, traffic direction and DNS before choosing the topology.

App Service is not limited to small or unimportant applications. It is a good fit when the workload is primarily web hosting and the platform does the job.

## Azure Container Apps: When applications need more flexibility

[Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/overview) is for containerised services and jobs when a team wants container flexibility without directly operating a Kubernetes cluster.

Picture an API that accepts customer documents. It stores each document, sends a message to a queue and returns a tracking number. A worker processes the document afterwards. The API scales with HTTP traffic; the worker scales with queue demand. They can be deployed and scaled independently.

Container Apps revisions represent application versions. Scaling rules use KEDA-backed signals, including supported event sources. A continuing worker can run as an app; a finite task can run as a [Container Apps Job](https://learn.microsoft.com/en-us/azure/container-apps/jobs). Optional Dapr integrations support selected distributed-application patterns, but they do not remove the need to design reliable message handling.

Some configurations can scale replicas to zero. That depends on the scaling rule and minimum-replica settings, and a waking service may have startup delay. It is not a blanket cost or availability guarantee.

Networking depends on the environment as well as the app's ingress. Public access, private endpoints, DNS and egress requirements should be checked together. Container Apps is attractive when independently scaled containers or jobs are useful; it is not an “AI platform” that every AI workload needs.

## AKS: When Kubernetes is a requirement

Kubernetes gives teams an API for describing how container workloads run, scale and connect. AKS is Azure's managed Kubernetes service. Azure manages the control plane; your team still works with Kubernetes resources and remains responsible for application behaviour, permissions, policies, state and recovery.

Kubernetes is justified when the application depends on its ecosystem: perhaps a vendor supplies an operator or Helm chart, the workload needs custom Kubernetes resources, or an established platform requires Kubernetes APIs. A Dockerfile alone is not that requirement.

### AKS Automatic

AKS Automatic offers a more opinionated operating model. Azure manages more cluster setup, node provisioning, scaling and upgrades. You still need to understand the workload, test required extensions and networking, and operate the application on Kubernetes.

### AKS Standard

AKS Standard gives the platform team broader cluster and node configuration choices. Choose it when a verified requirement falls outside Automatic's supported model, not simply because more settings are available. Standard is still managed Kubernetes; it does not mean every cluster operation becomes yours. AKS Standard as an operating model is also distinct from an AKS pricing or SLA tier.

GPU alone does not require AKS Standard. Current [AKS GPU guidance](https://learn.microsoft.com/en-us/azure/aks/best-practices-gpu) recommends Automatic as the starting point for many production AKS GPU workloads. Compare Container Apps or model-serving services too, then check hardware, region, quota and workload constraints.

## What about Azure Functions?

For a discrete event or scheduled task, [Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-scale) may be simpler than a continuously running service. Hosting plans have different scaling, networking and container support, so check the one that matches the workload.

## What about a static frontend?

A static frontend may suit [Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/overview), with its API hosted separately. The backend need not share the frontend's deployment.

## Azure Virtual Machines: when OS control is a requirement

Choose an [Azure Virtual Machine](https://learn.microsoft.com/en-us/azure/virtual-machines/overview) when the application has a verified guest-OS or server-level dependency that a managed platform cannot satisfy. That control comes with patching, hardening, monitoring and recovery responsibilities.

## A practical comparison

| Service | Deployment model | Consider it when | Your team still owns |
|---|---|---|---|
| App Service | Supported code or custom container | The workload is a web app or API | Application, plan, configuration and network design |
| Container Apps | Container apps and finite jobs | Services, workers or jobs need independent scaling | Images, scaling rules, environment and application reliability |
| AKS Automatic | Kubernetes resources on managed defaults | Kubernetes is required and the supported model fits | Workload manifests, access, policy and application operations |
| AKS Standard | Kubernetes with broader cluster choices | A concrete requirement needs more platform configuration | More node, network, upgrade and security decisions |
| Functions | Triggered function code; containers on selected plans | Work fits an event or timer execution model | Triggers, retries, state and plan constraints |
| Static Web Apps | Built static frontend assets | The frontend does not need a server process | Frontend build, API boundary and access controls |
| Virtual Machines | Guest operating system and application | OS-level control is genuinely necessary | Guest OS, security, availability, backup and recovery |

These are starting points, not feature guarantees. Plans, regions, quotas and networking can change the answer. Compare the whole system, including database, storage and operations, rather than assuming one host is universally cheaper.

## Four practical scenarios

### A conventional REST API

A team has an ASP.NET Core API, steady demand and a private database. App Service is a natural first candidate: its web-hosting model fits, and outbound VNet access may support the database connection.

Container Apps can also host the API, particularly if the team already runs containers. Kubernetes adds little unless the API depends on Kubernetes features. A higher business profile is not, on its own, a reason to run a cluster.

### An API with background processing

An application accepts uploaded documents and processes them asynchronously. A queue separates the short HTTP request from the longer work.

Container Apps can run the API and worker with different scaling rules, or use a job for work that starts and exits. App Service plus a queue-triggered Function is another option when the processing fits the Functions model. In either design, make retries safe and handle messages that repeatedly fail.

### Kubernetes-native software

A product depends on a Kubernetes operator and custom resources. A platform without direct Kubernetes APIs is not an equivalent substitute. AKS is a reasonable shortlist.

Check whether Automatic supports the exact operator, permissions and networking. If it does, its managed defaults may reduce infrastructure work. If a concrete requirement falls outside that model, consider Standard. Test installation and upgrades; starting a pod successfully is not the same as proving production compatibility.

### WordPress moving from Linux with MariaDB

Suppose a WordPress site runs on an on-premises Linux VM. It needs PHP, its plugins and themes, uploads, scheduled tasks and a MySQL-compatible database. App Service on Linux may be a suitable compute option if the runtime, extensions, write paths and network requirements fit.

[WordPress recommends](https://wordpress.org/about/requirements/) PHP 8.3 or later and MariaDB 10.11 or MySQL 8.0 or later. [Azure Database for MySQL Flexible Server](https://learn.microsoft.com/en-us/azure/mysql/flexible-server/concepts-migrate-dump-restore) may be a managed database destination to evaluate, but MariaDB and MySQL compatibility must be tested. Check versions, schema, collations, plugins and the restore process against representative data. Azure SQL Database is not WordPress's native, drop-in database replacement.

Files are a separate dependency. WordPress uploads must survive restarts and remain available to the instances that need them. App Service runtime and custom-container persistence settings differ; test the actual paths and storage configuration. Plan backups, cutover and recovery for both files and database.

The compute and database decisions are related, but separate. A suitable web host does not make the database migration compatible. [Azure Database for MariaDB retired in 2025](https://learn.microsoft.com/en-us/lifecycle/announcements/azure-products-retirement-september-2025); that service retirement does not mean that the MariaDB engine itself retired.

![Azure Compute Navigator assessment for an existing WordPress site using MariaDB. The result presents App Service as a compute starting point and lists database and file checks separately.](https://preciousajuru.github.io/azure-compute-navigator/assets/screenshots/azure-compute-navigator-assessment.png)

*The navigator keeps the compute recommendation separate from database and file checks.*

## Try Azure Compute Navigator

To make these decisions easier to explore, I built **Azure Compute Navigator**, an interactive guide that helps you compare hosting options against your application's requirements. Describe the workload through categorical answers, then review a starting point or shortlist, the reasoning, alternatives and unresolved requirements.

Try [Azure Compute Navigator](https://preciousajuru.github.io/azure-compute-navigator/#assessment).

The tool is independent educational guidance, not a production architecture approval. Check current Microsoft documentation and the intended plan, region, quota and network before implementation.

## Final thoughts

Start with what the application does and what it depends on.

App Service may be enough. Containers may need independent scaling without Kubernetes. Kubernetes may be the requirement. A VM may be justified by a real operating-system dependency.

Good architecture is not about choosing the platform with the most controls. It is about meeting the workload's needs and understanding the operational work that comes with the choice.

---

*Technical guidance checked against the linked Microsoft and WordPress documentation on 31 October 2026. Features and availability change; validate them before production use. Copyright © 2026 Precious Ajuru. This original article is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode). Azure Compute Navigator is an independent educational project, not an official Microsoft tool.*
