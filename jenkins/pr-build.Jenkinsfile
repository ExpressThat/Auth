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

        stage('CI') {
            parallel {
                stage('Build') {
                    agent {
                        docker {
                            image 'expressthat/auth-ci:latest'
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
                        docker {
                            image 'expressthat/auth-ci:latest'
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
