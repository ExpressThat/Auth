pipeline {
    agent { label 'base' }

    options {
        // disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('CI') {
            agent {
                docker {
                    image 'expressthat/auth-build-harness:latest'
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
