pipeline {
    agent { label 'isolated' }

    options {
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Install') {
            agent {
                docker {
                    image 'node:24'
                    registryCredentialsId 'docker-hub-read-only'
                    args '--user root'
                    reuseNode true
                }
            }
            steps {
                sh 'corepack enable && corepack prepare pnpm@9.0.0 --activate'
                sh 'pnpm install --frozen-lockfile'
            }
        }

        stage('Prepare CI Image') {
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
            parallel {
                stage('Build') {
                    agent {
                        dockerfile {
                            filename 'jenkins/Dockerfile.ci'
                            registryCredentialsId 'docker-hub-read-only'
                            reuseNode true
                        }
                    }
                    steps {
                        sh 'pnpm build'
                    }
                }

                stage('Format & Lint') {
                    agent {
                        docker {
                            image 'node:24'
                            registryCredentialsId 'docker-hub-read-only'
                            args '--user root'
                            reuseNode true
                        }
                    }
                    steps {
                        sh 'corepack enable && corepack prepare pnpm@9.0.0 --activate'
                        sh 'pnpm format-and-lint'
                    }
                }

                stage('Type Check') {
                    agent {
                        dockerfile {
                            filename 'jenkins/Dockerfile.ci'
                            registryCredentialsId 'docker-hub-read-only'
                            reuseNode true
                        }
                    }
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
