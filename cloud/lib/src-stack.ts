import { Duration, Stack, StackProps, RemovalPolicy} from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';
const constants = require('./constants');

export class SrcStack extends Stack {


  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

  //   const queue = new sqs.Queue(this, 'SrcQueue', {
  //     visibilityTimeout: Duration.seconds(300)
  //   });

  //   const topic = new sns.Topic(this, 'SrcTopic');

  //   topic.addSubscription(new subs.SqsSubscription(queue));

    const sagemakerExecutionRole = new iam.Role(this, 'SagemakerExecutionRoleForFeatureStore',{
      assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
      roleName: `SagemakerExec-${constants.appName}-${constants.region}`
    })

    // const sagemakerDomain = new sagemaker.CfnDomain(this,`SagemakerDomain-${constants.appName}`,{
    //   authMode:"IAM",
    //   defaultUserSettings: userSettings
    // })

    // const profile = {'team':'rl-demo-team','name':'james'}

    // const userProfile = new sagemaker.CfnUserProfile(this, `Team-${profile.team}-User-${profile.name}`,{
    //   domainId: sagemakerDomain.attrDomainId
    // })

    const s3offlineStore = new s3.Bucket(this, 'OfflineStoreBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    
    const onlineStoreKey = new Key(this, `${constants.appName}-flights-featurestore-online-key`, { removalPolicy: RemovalPolicy.DESTROY });

    const offlineStoreKey = new Key(this, `${constants.appName}-flights-featurestore-offline-key`, { removalPolicy: RemovalPolicy.DESTROY });

    const onlineStoreConfig: sagemaker.CfnFeatureGroup.OnlineStoreConfigProperty = {
      enableOnlineStore: true,
      securityConfig: {
        kmsKeyId: onlineStoreKey.keyId,
      },
    };

    const offlineStoreConfig: sagemaker.CfnFeatureGroup.OfflineStoreConfigProperty = {
      s3StorageConfig: {
        s3Uri: s3offlineStore.bucketWebsiteUrl,
    
        // the properties below are optional
        kmsKeyId: offlineStoreKey.keyId,
      },
    
      // the properties below are optional
      // dataCatalogConfig: {
      //   catalog: 'catalog',
      //   database: 'database',
      //   tableName: 'tableName',
      // },
      // disableGlueTableCreation: false,
      // tableFormat: 'tableFormat',
    };

    const FeatureGroup = new sagemaker.CfnFeatureGroup(this, `${constants.appName}-FeatureGroup`,{
      eventTimeFeatureName: 'record_timestamp',
      featureDefinitions: [
      {
        featureName: 'record_timestamp',
        featureType: 'String',
      },
      {
        featureName: 'flight_id',
        featureType: 'String',
      },
      {
        featureName: 'days_out',
        featureType: 'Integral',
      },
      {
        featureName:'departure_code',
        featureType:'String'
      },
      {
        featureName:'destination_code',
        featureType:'String'
      },
      {
        featureName:'price_usd',
        featureType:'Fractional',
      }
    ],
      featureGroupName: `${constants.appName}-flights-FeatureGroup`,
      recordIdentifierFeatureName: 'flight_id',
      description: 'description',
      offlineStoreConfig: offlineStoreConfig,
      onlineStoreConfig: onlineStoreConfig,
      // roleArn: 'roleArn',
    })

  
  // declare const offlineStoreConfig: any;
  // declare const onlineStoreConfig: any;
  // const cfnFeatureGroup = new sagemaker.CfnFeatureGroup(this, 'MyCfnFeatureGroup', {
  //   eventTimeFeatureName: 'eventTimeFeatureName',
  //   featureDefinitions: [{
  //     featureName: 'featureName',
  //     featureType: 'featureType',
  //   }],
  //   featureGroupName: 'featureGroupName',
  //   recordIdentifierFeatureName: 'recordIdentifierFeatureName',

  //   // the properties below are optional
  //   description: 'description',
  //   offlineStoreConfig: offlineStoreConfig,
  //   onlineStoreConfig: onlineStoreConfig,
  //   roleArn: 'roleArn',
  //   tags: [{
  //     key: 'key',
  //     value: 'value',
  //   }],
  // });



  }
  
}
