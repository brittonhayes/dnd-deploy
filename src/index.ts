/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import { Service, CDN } from './components';

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

const service = new Service('dnd-api-service', {
  vpc: vpc,
  tags: tags,
});

const cdn = new CDN('dnd-cdn', {
  loadbalancer: service.loadBalancer.loadBalancer,
  tags: tags,
});

export const lbDomain = service.loadBalancer.loadBalancer.dnsName;
export const cdnDomain = cdn.distribution.domainName;
