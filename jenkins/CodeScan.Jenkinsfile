pipeline {
    agent { label 'isolated' }

    options {
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('SonarQube Analysis') {
            agent {
                docker {
                    image 'sonarsource/sonar-scanner-cli:latest'
                    reuseNode true
                }
            }
            steps {
                withSonarQubeEnv() {
                    sh 'sonar-scanner'
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
