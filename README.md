# Hopkins Resume (https://HopkinsResu.me) - AWS CDK

This repo deploys *Matt Hopkins' Resume Website* on AWS. The site uses CloudFront's global edge network for high availability and performance. Entirely serverless and leveraging free tier, the project costs only pennies a month.

## Architecture Diagram
![HopkinsResu.me diagram](hopkins-resume-diagram.png)

## Features

- **Fully Serverless Architecture**: S3, CloudFront (with OAC), ACM, and Route53
- **Infrastructure as Code**: AWS CDK v2 (TypeScript) for repeatable, version-controlled infrastructure
- **CI/CD Pipeline**: GitHub Actions for automated linting, formatting, and testing
- **Cost Optimization**: Leverages AWS free tier resources
- **Code Quality**: ESLint, HTMLHint, Prettier, and Jest integrated

## Getting started

### Setup
Install or update the [AWS CDK CLI](https://github.com/aws/aws-cdk) from npm (requires [Node.js >= 20.x](https://nodejs.org/)).

```bash
npm i -g aws-cdk
```

Clone this repo locally.

```bash
git clone https://github.com/moebaca/hopkins-resume.git

cd hopkins-resume
```

Now install NPM dependencies.

```bash
npm install
```

### Local Development

You can preview the site locally using any static file server:

```bash
npx http-server site-contents
```

### Linting and Formatting

The project includes ESLint, HTMLHint, and Prettier for code quality:

```bash
npm run format
npm run lint

# Run all checks (lint, format verification, tests)
npm run ci
```

### Bootstrap CDK environment

Before you deploy the application you need to make sure the environment
where you are planning to deploy the site to has been bootstrapped,
specifically with the newest version of the bootstrapping stack.

You only need to do this one time per environment.

```bash
cdk bootstrap --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
```

### Run unit tests

```bash
npm run test
```

Output should look similar to this though the number and description of test cases may vary:
![test-cases.png](test-cases.png)

### Deploy

You must register and own the `hopkinsresu.me` domain in Route53 in the same account for this to work as-is.

```bash
cdk deploy -c accountId=1234567890
```

### Tear down

```bash
cdk destroy -c accountId=1234567890
```

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration:

- **Automatic Linting**: JavaScript and HTML files are checked for issues
- **Code Formatting**: All files are verified to follow consistent style
- **CDK Synthesis**: Infrastructure code is validated via unit tests

## Customization

To use this for your own resume:

1. Register your own domain in Route53
2. Update the `domainName` variable in `lib/hopkins-resume-stack.ts`
3. Replace the content in `site-contents/` with your own resume
4. Deploy using the instructions above

## License

MIT
