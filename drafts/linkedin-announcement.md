# LinkedIn draft

I have been working on Azure Compute Navigator, an interactive guide to a question that comes up often: where should an application run on Azure?

App Service, Container Apps and AKS can all be part of a container or API architecture, but they do not carry the same operational model. A Docker image does not automatically mean Kubernetes, and calling a managed AI model does not mean you need a GPU.

I built the guide to make those decisions easier to explore, with a workload assessment that explains its reasoning and shows when more information is needed. It is an independent educational project, not a substitute for validating production requirements.

I would welcome technical feedback, especially on scenarios where the trade-offs could be clearer.

Try Azure Compute Navigator: https://preciousajuru.github.io/azure-compute-navigator/

Read the companion article: https://preciousajuru.github.io/azure-compute-navigator/article/choosing-azure-compute.html

Source repository: https://github.com/preciousajuru/azure-compute-navigator
