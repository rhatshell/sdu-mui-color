pipeline {
    agent {
        kubernetes {
      label 'sdu-mui-color-main'
      yaml """
--- 
apiVersion: v1
kind: Pod
metadata: 
  namespace: shared-services
spec: 
  containers: 
    - 
      image: "alpine:3.8"
      name: alpine
      command: 
        - cat
      tty: true
"""
        }
    }
    stages {
        // first build and push the image
        // and return the image tag
        stage('Build') {
            steps {
                script {
                    BuildResult = build ( 
                        job: "/sdu-faultcrawler/sdu-mui-color/$BRANCH_NAME", 
                        propagate: true, 
                        wait: true 
                    )
                    env.REPOSITORY_NAME = BuildResult.getBuildVariables().REPOSITORY_NAME
                    env.IMAGE_BUILD_TAG = BuildResult.getBuildVariables().IMAGE_BUILD_TAG
                }
            }
        }
        // use the image tag from the previous step for deploying
        stage('Deploy to SDU-DEV-APPS') {
            steps {
                script {
                    SduDevAppsResult = build (
                        job: "/sdu-faultcrawler/sdu-mui-color-deploy/$BRANCH_NAME",
                        parameters: [
                            string ( name: 'REPOSITORY_NAME', value: env.REPOSITORY_NAME ),
                            string ( name: 'IMAGE_BUILD_TAG', value: env.IMAGE_BUILD_TAG ),
                            string ( name: 'TARGET_ENV', value: 'sdu-dev-apps' )
                        ],
                        propagate: true, 
                        wait: true
                    )
                }
            }
        }
        stage('Deploy to SDU-PRE-PROD') {
            when {
                beforeAgent true
                branch "master"
            }
            steps {
                input ( message: "Deploy to Pre-Prod" )
                script {
                    SduPreProdResult = build (
                        job: "/sdu-faultcrawler/sdu-mui-color-deploy/$BRANCH_NAME",
                        parameters: [
                            string ( name: 'REPOSITORY_NAME', value: env.REPOSITORY_NAME ),
                            string ( name: 'IMAGE_BUILD_TAG', value: env.IMAGE_BUILD_TAG ),
                            string ( name: 'TARGET_ENV', value: 'sdu-pre-prod' )
                        ],
                        propagate: true, 
                        wait: true
                    )
                }
            }
        }
        stage('Deploy to SDU-PROD') {
            when {
                beforeAgent true
                branch "master"
            }
            steps {
                input ( message: "Deploy to Prod" )
                script {
                    SduProdResult = build (
                        job: "/sdu-faultcrawler/sdu-mui-color-deploy/$BRANCH_NAME",
                        parameters: [
                            string ( name: 'REPOSITORY_NAME', value: env.REPOSITORY_NAME ),
                            string ( name: 'IMAGE_BUILD_TAG', value: env.IMAGE_BUILD_TAG ),
                            string ( name: 'TARGET_ENV', value: 'sdu-prod' )
                        ],
                        propagate: true, 
                        wait: true 
                    )
                }
            }
        }
    }
}