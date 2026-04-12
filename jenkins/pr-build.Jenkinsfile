pipeline {
    agent { label 'isolated' }

    options {
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Prepare') {
            steps {
                withCredentials([gitUsernamePassword(credentialsId: 'github-jenkins-90-days')]) {
                    sh '''
                        git fetch origin main
                        mkdir -p jenkins
                        git show FETCH_HEAD:jenkins/Dockerfile.ci > jenkins/Dockerfile.ci
                    '''
                }
            }
        }

        stage('CI') {
            agent {
                dockerfile {
                    filename 'jenkins/Dockerfile.ci'
                    registryCredentialsId 'docker-hub-read-only'
                    reuseNode true
                }
            }
            stages {
                stage('Install') {
                    steps {
                        sh 'pnpm install --frozen-lockfile'
                    }
                }

                stage('Build') {
                    steps {
                        sh 'pnpm build'
                    }
                }

                stage('Format & Lint') {
                    steps {
                        sh 'pnpm format-and-lint'
                    }
                }

                stage('Type Check') {
                    steps {
                        sh 'pnpm check-types'
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
