pipeline {
    agent { label 'base' }

    options {
        timeout(time: 30, unit: 'MINUTES')
    }

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
    }

    post {
        always {
            cleanWs()
        }
    }
}
