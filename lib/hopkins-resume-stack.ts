import { Stack, StackProps, CfnOutput, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

export class HopkinsResumeStack extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const domainName = 'hopkinsresu.me';

    const zone: route53.IHostedZone = route53.HostedZone.fromLookup(this, 'HopkinsResumeZone', { domainName: domainName });

    // S3 site content bucket
    const siteBucket: Bucket = new Bucket(this, 'HopkinsResumeBucket', {
      bucketName: domainName,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });

    // TLS certificate
    const certificate = new acm.Certificate(this, 'HopkinsResumeCertificate', {
      domainName: domainName,
      subjectAlternativeNames: ['*.' + domainName],
      validation: acm.CertificateValidation.fromDns(zone),
    });
    new CfnOutput(this, 'Certificate', { value: certificate.certificateArn });

    // CloudFront distribution with Origin Access Control
    const distribution = new cloudfront.Distribution(this, 'HopkinsResumeDistribution', {
      certificate: certificate,
      defaultRootObject: 'index.html',
      domainNames: [domainName, '*.' + domainName],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 403,
          responsePagePath: '/error.html',
          ttl: Duration.minutes(30),
        },
      ],
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
    });

    new CfnOutput(this, 'DistributionId', { value: distribution.distributionId });

    // Route53 alias records
    const apexRecord = new route53.ARecord(this, 'SiteAliasRecord', {
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone,
    });

    new route53.ARecord(this, 'WWWApexRecordAlias', {
      recordName: 'www.' + domainName,
      target: route53.RecordTarget.fromAlias(new targets.Route53RecordTarget(apexRecord)),
      zone,
    });

    // Deploy site contents to S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployWithInvalidation', {
      sources: [s3deploy.Source.asset('./site-contents')],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });
  }
}
