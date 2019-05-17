// Constants
// The id of the operations account
SDU_OPS_ACCOUNT_ID = "679923227529"
// The hostname part of the repository
REPOSITORY_ADDRESS = "${SDU_OPS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com"

// The role we assume with permissions to login to ECR
ROLE = "arn:aws:iam::355262519757:role/sdu-faultcrawler-jenkins"
// Create a unique label for this job, reusing names can create caching issues
LABEL = env.JOB_NAME.replaceAll(" |/","_")

pipeline {
    agent {
    kubernetes {
      label "$LABEL"
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
      image: "docker:18.05.0-ce"
      name: docker-builder
      command: 
        - cat
      env: 
        - 
          name: DOCKER_HOST
          value: "tcp://localhost:2375"
      tty: true
    - 
      image: "docker:18.05.0-ce-dind"
      name: dind-daemon
      securityContext: 
        privileged: true
      volumeMounts: 
        - 
          mountPath: /var/lib/docker
          name: docker-graph-storage
  volumes: 
    - 
      emptyDir: {}
      name: docker-graph-storage

"""
    }
  }
  stages {
    // Install some utilities in the docker container
    // And login to the registry
    stage('Prepare') {
      steps {
        container ("docker-builder") {
          sh "apk add --no-cache --no-progress git py2-pip && pip install awscli --upgrade --quiet && which aws"
          sh "\$(aws ecr get-login --no-include-email --region us-east-1 --registry-ids $SDU_OPS_ACCOUNT_ID)"
          // Set the tag we will use for the image
          script {
            GIT_REV = sh (
              script: "git rev-parse HEAD", 
              returnStdout: true
            )
            env.IMAGE_BUILD_TAG = GIT_REV.trim()
            GIT_ORIGIN = sh (
              script: "basename `git remote get-url origin` .git",
              returnStdout: true
            )
            env.REPOSITORY_NAME = GIT_ORIGIN.trim()
            env.CONTAINER_IMAGE = "sdu/$REPOSITORY_NAME"
            env.WEB_CONTAINER_IMAGE = "sdu/${REPOSITORY_NAME}"
          }
        }
      }
    }
    // Build the docker image(s)
    stage('Build') {
      steps {
        container ("docker-builder") {
          // Make sure this directory (app) matches your sources. 
          // It should point to wherever your Dockerfile is.
          // If Dockerfile is in the root, you can remove the 'dir ("app") { }' statement
          sh "docker build\
            --tag $REPOSITORY_ADDRESS/$WEB_CONTAINER_IMAGE:latest\
            --tag $REPOSITORY_ADDRESS/$WEB_CONTAINER_IMAGE:$IMAGE_BUILD_TAG\
            nginx"
        }
        container ("docker-builder") {
          // Make sure this directory (app) matches your sources. 
          // It should point to wherever your Dockerfile is.
          // If Dockerfile is in the root, you can remove the 'dir ("app") { }' statement
          sh "docker pull $REPOSITORY_ADDRESS/$CONTAINER_IMAGE:latest || true"
          sh "docker build\
            --cache-from $REPOSITORY_ADDRESS/$CONTAINER_IMAGE:latest\
            --tag $REPOSITORY_ADDRESS/$CONTAINER_IMAGE:latest\
            --tag $CONTAINER_IMAGE:latest\
            --tag $REPOSITORY_ADDRESS/$CONTAINER_IMAGE:$IMAGE_BUILD_TAG\
            ."
        }
        container ("docker-builder") {
          // Make sure this directory (app) matches your sources. 
          // It should point to wherever your Dockerfile is.
          // If Dockerfile is in the root, you can remove the 'dir ("app") { }' statement
          sh "docker build\
            --tag $REPOSITORY_ADDRESS/$TEST_CONTAINER_IMAGE:latest\
            --tag $REPOSITORY_ADDRESS/$TEST_CONTAINER_IMAGE:$IMAGE_BUILD_TAG\
            geocrawler_server/test"
        }
      }
    }
    // Run a container and perform some unit test. 
    // Currently we only check if there is a process listening on a port.
    stage('Test') {
      steps {
        container ("dind-daemon") {
          script {
            try {
              sh (script: "docker run --entrypoint nosetests --rm $REPOSITORY_ADDRESS/$TEST_CONTAINER_IMAGE:$IMAGE_BUILD_TAG")
            } catch (error) {
              sh "docker logs \$(docker ps -lq)"
              throw error
            }
          }
        }
      }
    }
    // Push the image to the registry
    stage('Publish') {
      steps {
        container ("docker-builder") {
          sh """
            docker push $REPOSITORY_ADDRESS/$CONTAINER_IMAGE:latest
            docker push $REPOSITORY_ADDRESS/$CONTAINER_IMAGE:$IMAGE_BUILD_TAG
          """
        }
        container ("docker-builder") {
          sh """
            docker push $REPOSITORY_ADDRESS/$WEB_CONTAINER_IMAGE:latest
            docker push $REPOSITORY_ADDRESS/$WEB_CONTAINER_IMAGE:$IMAGE_BUILD_TAG
          """
        }
      }
    }
  }
}
