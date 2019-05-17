// Constants
// The id of the operations account
SDU_OPS_ACCOUNT_ID = "679923227529"
// The hostname part of the repository
REPOSITORY_ADDRESS = "${SDU_OPS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com"
// The image we will use for deploying
SDU_DEPLOYER_IMAGE = "${SDU_OPS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/sdu/deployer:c01f5696abec1466f251f05d8748233b0f2dd6d9"
// The image we will use for validation
SDU_VALIDATOR_IMAGE = "${SDU_OPS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/sdu/validator:c01f5696abec1466f251f05d8748233b0f2dd6d9"

// The account id of the target environment, ie, where we will be deploying
TARGET_ACCOUNT_MAP = [
  'sdu-dev-apps': '355262519757',
  'sdu-pre-prod': '144499913329',
  'sdu-prod'    : '191176410401'
]

TARGET_ENV=params.TARGET_ENV

// Get the target environment ID number from the env parameter
TARGET_ENV_ACCOUNT_ID = TARGET_ACCOUNT_MAP[TARGET_ENV]
// strip the 'SDU-' of the TARGET_ENV so we can use it in the DNS name
DNS_DOMAIN = TARGET_ENV.substring(4)

// The role we assume with permissions to deploy to the cluster
// Use either iam-sharedservices-terraform-jenkins-appdeveloper or iam-sharedservices-terraform-jenkins-dataplatform here
ROLE = "arn:aws:iam::${TARGET_ENV_ACCOUNT_ID}:role/sdu-faultcrawler-jenkins"
// The path to the cluster configuration file
// Use either 'sharedservices' or 'dataplatform' here
KUBECONFIGPATH = "s3://sdu-ops-terraform-state/us-east-1/${TARGET_ENV}/sharedservices/kubeconfig"

pipeline {
    agent {
    kubernetes {
      label 'sdu-faultcrawler-app-deploy'
      defaultContainer 'jnlp'
      yaml """
--- 
apiVersion: v1
kind: Pod
metadata: 
  namespace: shared-services
  annotations: 
    iam.amazonaws.com/role: $ROLE
spec: 
  containers: 
    -
      name: sdu-deployer
      image: "$SDU_DEPLOYER_IMAGE"
      command: 
        - cat
      tty: true
    -
      name: sdu-validator
      image: "$SDU_VALIDATOR_IMAGE"
      command:
        - cat
      tty: true
  volumes: 
    - 
      emptyDir: {}
      name: docker-graph-storage

"""
    }
  }
  stages {
    // Replace VERSION in the k8s resource manifests with the build tag
    stage('Prepare') {
      steps {
        container ("sdu-deployer") {
          sh """ 
            # This assumes the resource manifests for Kubernetes are in the k8s/ directory
            sed -i -e 's/VERSION/${params.IMAGE_BUILD_TAG}/' k8s/*
            sed -i -e 's/ENVIRONMENT/${DNS_DOMAIN}/' k8s/*
          """
        }      
      } 
    }
    // Run validation on the Kubernetes manifests
    stage('Validate') {
      steps {
        container ("sdu-validator") {
          sh '''
            # kubeyaml validation
            for file in $( find ./k8s -name '*yaml' ); do
              cat $file | kubeyaml
            done
            # kubeval validation
            for file in $( find ./k8s -name '*yaml' ); do
              if [ "$file" != "./k8s/servicemonitor.yaml" ]; then
                kubeval $file
              fi
            done
          '''
        }
      }
    }
    // Deploy the application on the Kubernetes cluster
    stage('Deploy') {
      steps{
        container ("sdu-deployer") {
          sh """
            mkdir -p ~/.kube
            aws s3 cp $KUBECONFIGPATH ~/.kube/config
            kubectl apply --filename k8s/ --record
            # Get the public address of the loadbalancer here:
            kubectl get svc --namespace sdu-faultcrawler
          """
        }
      }
    }
  }
}
