#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { HopkinsResumeStack } from '../lib/hopkins-resume-stack';

class HopkinsStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props);
    new HopkinsResumeStack(this, 'Site');
  }
}

const app = new cdk.App();

new HopkinsStack(app, 'HopkinsResumeStack', {
  env: {
    account: app.node.tryGetContext('accountId'),
    region: 'us-east-1',
  },
});

app.synth();
