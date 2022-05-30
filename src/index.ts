/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

const tags: aws.Tags = {
  owner: 'github.com/5e-bits',
  service: 'dnd5eapi',
};

const vpc = new awsx.ec2.Vpc('vpc', {
  tags: tags,
});

const securityGroup = new awsx.ec2.SecurityGroup('vpc-security-group', {
  tags: tags,
  vpc: vpc,
});

const cluster = new awsx.ecs.Cluster('cluster', {
  tags: tags,
  vpc: vpc,
  name: 'dnd-api-cluster',
});

const apiLogs = new aws.cloudwatch.LogGroup('api-service-logs', {
  tags: tags,
  namePrefix: '/ecs/',
  retentionInDays: 1,
});

const apiLoadBalancer = new awsx.elasticloadbalancingv2.NetworkLoadBalancer('api-loadbalancer', {
  tags: tags,
  vpc: vpc,
  external: true,
});

const apiTargetGroup = apiLoadBalancer.createTargetGroup('api-service-target-group', {
  port: 3000,
});

const apiListener = apiTargetGroup.createListener('api-service-listener', {
  vpc: vpc,
  port: 80,
});

const service = new awsx.ecs.FargateService('service', {
  tags: tags,
  name: 'dnd-api-service',
  cluster: cluster,
  desiredCount: 1,
  waitForSteadyState: false,
  forceNewDeployment: true,
  assignPublicIp: true,
  taskDefinitionArgs: {
    logGroup: apiLogs,
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

export const apiUrl = apiLoadBalancer.loadBalancer.dnsName;
