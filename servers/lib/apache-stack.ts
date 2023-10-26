import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecsp from 'aws-cdk-lib/aws-ecs-patterns';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import path = require('path');
import { Configs, configs } from './configs'
import { Construct } from 'constructs';

export class ApacheStack extends cdk.Stack {

  public readonly apacheServer: ecsp.ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, id: string, configs: Configs) {
    super(scope, id, configs);

    // Get the secret as it contains information that we will need
    const secret = secretsmanager.Secret.fromSecretNameV2(this, 'Secret', configs.dbSecret.name);

    const vpc = ec2.Vpc.fromLookup(this, 'Liferay VPC', {
      vpcId: secret.secretValueFromJson('vpcId').toString(),
    });

    // Get the apache image
    // const apacheImage = ecs.ContainerImage.fromRegistry(configs.apache.uri);
    const apacheImage = new DockerImageAsset(
      this,
      configs.apache.name,
      {
        directory: path.resolve(__dirname, configs.apache.dir)
      }
    );

    // Create ECS service using the provided image
    this.apacheServer = new ecsp.ApplicationLoadBalancedFargateService(
      this,
      id,
      {
        vpc: vpc,
        cpu: 256,
        desiredCount: 1,
        taskImageOptions: {
          image: ecs.ContainerImage.fromDockerImageAsset(apacheImage),
          containerPort: 80,
          containerName: configs.apache.name,
          enableLogging: true,
          // environment: {
          //   PROXY_PASS_HOST: props.proxyPassHost? props.proxyPassHost : '',
          // }
        },
        circuitBreaker: {
          rollback: true,
        },
        publicLoadBalancer: true,
      }
    );

    // Create the fargate task definition
    // const taskDefinition = new ecs.FargateTaskDefinition(this, 'ApacheFargateTask');

    // Add a container to the task definition
    // taskDefinition.addContainer('ApacheContainer', {
    //   image: apacheImage,
    //   memoryLimitMiB: 1024,
    //   portMappings: [{containerPort: 80}],
    // });

    // Create the fargate service
    // const apacheService = new ecs.FargateService(this, 'ApacheFargateService', {
    //   cluster: new ecs.Cluster(this, 'ApacheCluster', {
    //     vpc,
    //   }),
    //   taskDefinition,
    // });
  }
}