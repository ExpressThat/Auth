pipeline {
    agent none

    options {
        // disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Pipeline') {
            parallel {
                stage('CI') {
                    agent { label 'isolated' }
                    stages {
                        stage('Prepare') {
                            steps {
                                writeFile file: 'jenkins/Dockerfile.ci', text: '''
FROM mcr.microsoft.com/dotnet/sdk:10.0

RUN apt-get update && apt-get install -y ca-certificates curl gnupg \\
    && curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \\
    && apt-get install -y nodejs \\
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
'''
                            }
                        }

                        stage('Build & Verify') {
                            agent {
                                dockerfile {
                                    filename 'jenkins/Dockerfile.ci'
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

                stage('Code Quality') {
                    agent { label 'base' }
                    stages {
                        stage('SonarQube Analysis') {
                            steps {
                                script {
                                    withSonarQubeEnv() {
                                        docker.image('sonarsource/sonar-scanner-cli:11').inside {
                                            sh 'sonar-scanner'
                                        }
                                    }
                                }
                            }
                        }

                        stage('Quality Gate') {
                            steps {
                                timeout(time: 1, unit: 'HOURS') {
                                    // Parameter indicates whether to set pipeline to UNSTABLE if Quality Gate fails
                                    // true = set pipeline to UNSTABLE, false = don't
                                    waitForQualityGate abortPipeline: true
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
            }
        }
    }
}
