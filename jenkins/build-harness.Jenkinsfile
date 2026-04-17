pipeline {
    agent { label 'isolated' }

    options {
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Build') {
            when {
                anyOf {
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
    }

    post {
        always {
            cleanWs()
        }
    }
}
