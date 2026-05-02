import { Template, Match } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import { HopkinsResumeStack } from '../lib/hopkins-resume-stack';

describe('HopkinsResumeStack', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'TestStack', {
    env: {
      account: '1234567890',
      region: 'us-east-1',
    },
  });
  new HopkinsResumeStack(stack, 'HopkinsResumeTestStack');
  const template = Template.fromStack(stack);

  test('Static Site S3 Bucket Created', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('CloudFront Distribution Created', () => {
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
  });

  test('CloudFront Distribution Uses OAC', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Origins: [
          Match.objectLike({
            S3OriginConfig: {
              OriginAccessIdentity: '',
            },
          }),
        ],
      },
    });
  });

  test('Site Alias Record in Route53 Created', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'hopkinsresu.me.',
      Type: 'A',
    });
  });

  test('WWW Alias Record for Apex in Route53 Created', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'www.hopkinsresu.me.',
      Type: 'A',
    });
  });

  test('ACM Certificate Created', () => {
    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      DomainName: 'hopkinsresu.me',
      ValidationMethod: 'DNS',
    });
  });

  test('CloudFront Uses HTTPS Redirect', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: Match.objectLike({
          ViewerProtocolPolicy: 'redirect-to-https',
          Compress: true,
        }),
      },
    });
  });
});
