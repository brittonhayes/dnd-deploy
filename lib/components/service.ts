/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

export interface ServiceProperties {
  vpc?: awsx.ec2.Vpc;
  tags?: aws.Tags;
}

export class Service extends pulumi.ComponentResource {
  readonly cluster: awsx.ecs.Cluster;
  readonly fargateService: awsx.ecs.FargateService;
  readonly logGroup: aws.cloudwatch.LogGroup;
  readonly loadBalancer: awsx.elasticloadbalancingv2.NetworkLoadBalancer;

  constructor(name: string, properties: ServiceProperties, opts?: pulumi.ComponentResourceOptions) {
    super('dnd:Service', name, {}, opts);

    this.cluster = new awsx.ecs.Cluster('cluster', {
      tags: properties.tags,
      vpc: properties.vpc,
      name: 'dnd-api-cluster',
    });

    this.logGroup = new aws.cloudwatch.LogGroup('api-service-logs', {
      tags: properties.tags,
      namePrefix: '/ecs/',
      name: 'api-service-logs',
      retentionInDays: 1,
    });

    this.loadBalancer = new awsx.elasticloadbalancingv2.NetworkLoadBalancer('api-loadbalancer', {
      tags: properties.tags,
      vpc: properties.vpc,
      external: true,
    });

    const apiTargetGroup = this.loadBalancer.createTargetGroup('api-service-target-group', {
      port: 3000,
    });

    const apiListener = apiTargetGroup.createListener('api-service-listener', {
      vpc: properties.vpc,
      port: 80,
    });

    this.fargateService = new awsx.ecs.FargateService('service', {
      tags: properties.tags,
      name: 'dnd-api-service',
      cluster: this.cluster,
      desiredCount: 1,
      waitForSteadyState: false,
      forceNewDeployment: true,
      assignPublicIp: true,
      taskDefinitionArgs: {
        logGroup: this.logGroup,
        containers: {
          api: {
            image: 'ghcr.io/5e-bits/5e-srd-api',
            portMappings: [apiListener],
            cpu: 256,
            memory: 512,
            dependsOn: [
              {
                containerName: 'db',
                condition: 'START',
              },
              {
                containerName: 'cache',
                condition: 'START',
              },
            ],
            environment: [
              {
                name: 'MONGODB_URI',
                value: 'mongodb://localhost/5e-database',
              },
              {
                name: 'REDIS_URL',
                value: 'redis://localhost:6379',
              },
            ],
          },
          db: {
            image: 'ghcr.io/5e-bits/5e-database',
            cpu: 256,
            memory: 512,
            portMappings: [
              {
                protocol: 'tcp',
                containerPort: 27017,
                hostPort: 27017,
              },
            ],
          },
          cache: {
            image: 'redis',
            cpu: 256,
            memory: 512,
            portMappings: [
              {
                protocol: 'tcp',
                containerPort: 6379,
                hostPort: 6379,
              },
            ],
          },
        },
      },
    });

    this.registerOutputs();
  }
}
