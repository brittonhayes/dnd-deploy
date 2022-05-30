/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

export interface CDNProperties {
  loadbalancer: aws.lb.LoadBalancer;
  tags?: aws.Tags;
}

export class CDN extends pulumi.ComponentResource {
  readonly distribution: aws.cloudfront.Distribution;

  constructor(name: string, properties: CDNProperties, opts?: pulumi.ComponentResourceOptions) {
    super('dnd:cdn', name, {}, opts);

    this.distribution = new aws.cloudfront.Distribution('dnd-api-cdn', {
      enabled: true,
      tags: properties.tags,
      defaultCacheBehavior: {
        targetOriginId: properties.loadbalancer.arn,
        viewerProtocolPolicy: 'allow-all',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
        forwardedValues: {
          cookies: { forward: 'none' },
          queryString: true,
        },
        minTtl: 0,
      },
      priceClass: 'PriceClass_100',
      origins: [
        {
          originId: properties.loadbalancer.arn,
          originPath: '/*',
          domainName: properties.loadbalancer.dnsName,
          customOriginConfig: {
            httpPort: 80,
            httpsPort: 80,
            originSslProtocols: ['TLSv1.2'],
            originProtocolPolicy: 'match-viewer',
          },
        },
      ],
      viewerCertificate: {
        cloudfrontDefaultCertificate: true,
      },
      restrictions: {
        geoRestriction: {
          restrictionType: 'none',
        },
      },
    });

    this.registerOutputs();
  }
}
