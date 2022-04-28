import { Template, Match } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import { HopkinsResumeStack }  from '../lib/hopkins-resume-stack';

describe("HopkinsResumeStack", () => {
  
  /**
   * Setup the template for test cases with dummy values.
   */
   const app = new cdk.App();
   const stack = new cdk.Stack(app, 'TestStack', {
     env: {
       account: '1234567890',
       region: 'us-east-1',
     }
   });
   new HopkinsResumeStack(stack, 'HopkinsResumeTestStack', {})
  const template = Template.fromStack(stack);

  /**
   * Run test cases.
   */
  test('Origin Access Identity Created', () => {
    template.resourceCountIs("AWS::CloudFront::CloudFrontOriginAccessIdentity", 1);
  });

  test('Static Site S3 Bucket Created', () => {
    template.resourceCountIs("AWS::S3::Bucket", 1);
    template.hasResourceProperties("AWS::S3::Bucket", {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      },
    })
  });

  test('Origin Access IAM Policy for S3 Bucket Created', () => {
    template.hasResourceProperties("AWS::S3::BucketPolicy", {
      PolicyDocument: {
        Statement: [
          Match.objectLike({
            Action: ['s3:GetBucket*', 's3:List*', 's3:DeleteObject*'],
            Effect: "Allow",
          }),
          Match.objectLike({
            Action: 's3:GetObject',
            Effect: "Allow",
          }),
        ]
      },
    })
  });

  test('CloudFront Distribution Created', () => {
    template.resourceCountIs("AWS::CloudFront::Distribution", 1)
  });

  test('Site Alias Record in Route53 Created', () => {
    template.hasResourceProperties("AWS::Route53::RecordSet", {
      Name: "hopkinsresu.me.",
      Type: "A",
    })
  });

  test('WWW Alias Record for Apex in Route53 Created', () => {
    template.hasResourceProperties("AWS::Route53::RecordSet", {
      Name: "www.hopkinsresu.me.",
      Type: "A",
    })
  });
});