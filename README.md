# 🚀 Deploy

> AWS deployment of the [D&D 5e REST API](https://dnd5eapi.co) using AWS ECS/Fargate.

## Usage

Deploying the application to AWS with [Pulumi](https://www.pulumi.com/).

```shell
# Clone the repository
gh repo clone brittonhayes/dnd-deploy

# Install dependencies
npm install

# Deploy with pulumi
pulumi up
```

## Infrastructure

The compute infrastructure is built on [AWS Elastic Container Service](https://aws.amazon.com/ecs/) with request caching handled by [AWS Cloudfront](https://aws.amazon.com/cloudfront/) and routing handled by [AWS Elastic Load Balancing](https://aws.amazon.com/elasticloadbalancing/)

1. 1x AWS ECS Cluster - dnd-api-cluster
1. 1x ECS Service - dnd-api-service
1. 3x AWS ECS Tasks - api + db + cache
1. 1x AWS Application Loadbalancer - dnd-api-loadbalancer
1. 1x Cloudfront Distribution

## Development

All source code for infrastructure configurations are located in the `src/` directory. Infrastructure component definitions can be found in `src/components`.
