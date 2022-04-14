import { Stack, StackProps, CfnOutput, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as iam from 'aws-cdk-lib/aws-iam';

export class HopkinsResumeStack extends Construct {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id);

    const domainName = 'hopkinsresu.me';

    // Requires you own the domain name passed as param and hosted zone exists in R53
    const zone: route53.IHostedZone = route53.HostedZone.fromLookup(this, 'HopkinsResumeZone', { domainName: domainName });

    // Create Origin Access Identity
    const cloudfrontOAI: cloudfront.OriginAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'cloudfront-OAI', {
      comment: `OAI for ${id}`
    });
    new CfnOutput(this, 'HopkinsOAI', { value: 'https://' + domainName });

    // S3 site content bucket
    const siteBucket: Bucket = new Bucket(this, 'HopkinsResumeBucket', {
      bucketName: domainName,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Grant S3 bucket access to CloudFront
    siteBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [siteBucket.arnForObjects('*')],
      principals: [new iam.CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
    }));
    new CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });

    // TLS certificate for use with website
    const certificate: acm.DnsValidatedCertificate = new acm.DnsValidatedCertificate(this, 'HopkinsResumeCertificate', {
      domainName: domainName,
      subjectAlternativeNames: [
        '*.' + domainName
      ],
      hostedZone: zone,
      region: 'us-east-1', 
    });
    new CfnOutput(this, 'Certificate', { value: certificate.certificateArn });   
    
    // CloudFront distribution instantiation
    const s3Origin: S3Origin = new S3Origin(siteBucket, {originAccessIdentity: cloudfrontOAI});
    const distribution: cloudfront.Distribution = new cloudfront.Distribution(this, 'HopkinsResumeDistribution', {
      certificate: certificate,
      defaultRootObject: "index.html",
      domainNames: [
        domainName, 
        '*.' + domainName // Allow all sub-domains
      ],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      errorResponses:[
        {
          httpStatus: 403,
          responseHttpStatus: 403,
          responsePagePath: '/error.html',
          ttl: Duration.minutes(30),
        }
      ],
      defaultBehavior: {
        origin: s3Origin,
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      geoRestriction: cloudfront.GeoRestriction.denylist('RU', 'SG', 'AE')
    });

    new CfnOutput(this, 'DistributionId', { value: distribution.distributionId });

    // Route53 alias record for the CloudFront distribution
    const apexRecord: route53.ARecord = new route53.ARecord(this, 'SiteAliasRecord', {
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone
    });

    // Route53 alias record for the CloudFront distribution
    new route53.ARecord(this, 'WWWApexRecordAlias', {
        recordName: 'www.' + domainName,
        target: route53.RecordTarget.fromAlias(new targets.Route53RecordTarget(apexRecord)),
        zone
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
