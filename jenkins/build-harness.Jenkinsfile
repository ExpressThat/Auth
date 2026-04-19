def NEXUS_URL            = 'http://172.25.0.3:8081'
def NEXUS_DOCKER_REPO    = 'docker-proxy'
def NEXUS_CREDENTIALS_ID = 'nexus-jenkins-login'
def IMAGE_NAME           = 'expressthat/auth-build-harness'

def nexusInvalidate(String nexusUrl, String repo, String imageName) {
    sh """
        echo "--- Invalidating Nexus cache for ${imageName} ---"

        curl -sf -u "\$NEXUS_USER:\$NEXUS_PASS" \
            '${nexusUrl}/service/rest/v1/search?repository=${repo}&docker.imageName=${imageName}' \
            | jq -r '.items[].id' | while read -r id; do
                echo "Deleting component: \$id"
                curl -sf -X DELETE -u "\$NEXUS_USER:\$NEXUS_PASS" \
                    '${nexusUrl}/service/rest/v1/components/'\$id
            done

        curl -sf -u "\$NEXUS_USER:\$NEXUS_PASS" \
            '${nexusUrl}/service/rest/v1/search/assets?repository=${repo}&docker.imageName=${imageName}' \
            | jq -r '.items[].id' | while read -r id; do
                echo "Deleting asset: \$id"
                curl -sf -X DELETE -u "\$NEXUS_USER:\$NEXUS_PASS" \
                    '${nexusUrl}/service/rest/v1/assets/'\$id
            done

        echo "Done."
    """
}

pipeline {
    agent { label 'base' }

    options {
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Build') {
            when {
                anyOf {
                    expression { return currentBuild.changeSets.isEmpty() }
                    changeset 'jenkins/Dockerfile.BuildHarness'
                    changeset 'jenkins/build-harness.Jenkinsfile'
                }
            }
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'docker-hub-read-only') {
                        image = docker.build(
                            "expressthat/auth-build-harness:${env.BUILD_NUMBER}",
                            '-f jenkins/Dockerfile.BuildHarness .'
                        )
                    }
                }
            }
        }

        stage('Push') {
            when {
                anyOf {
                    expression { return currentBuild.changeSets.isEmpty() }
                    changeset 'jenkins/Dockerfile.BuildHarness'
                    changeset 'jenkins/build-harness.Jenkinsfile'
                }
            }
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'docker-hub-write') {
                        image.push(env.BUILD_NUMBER)
                        image.push('latest')
                    }
                }
            }
        }

        stage('Invalidate Nexus Cache') {
            when {
                anyOf {
                    expression { return currentBuild.changeSets.isEmpty() }
                    changeset 'jenkins/Dockerfile.BuildHarness'
                    changeset 'jenkins/build-harness.Jenkinsfile'
                }
            }
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: NEXUS_CREDENTIALS_ID,
                        usernameVariable: 'NEXUS_USER',
                        passwordVariable: 'NEXUS_PASS'
                    )]) {
                        nexusInvalidate(NEXUS_URL, NEXUS_DOCKER_REPO, IMAGE_NAME)
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
