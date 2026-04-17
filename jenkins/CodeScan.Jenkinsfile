pipeline {
    agent { label 'base' }

    options {
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('SonarQube Analysis') {
           def scannerHome = tool 'SonarQube';
            withSonarQubeEnv() {
              sh "${scannerHome}/bin/sonar-scanner"
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
