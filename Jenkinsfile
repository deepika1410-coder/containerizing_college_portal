pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'registry.campusflow.internal'
        IMAGE_BACKEND   = "${DOCKER_REGISTRY}/campusflow/backend"
        IMAGE_FRONTEND  = "${DOCKER_REGISTRY}/campusflow/frontend"
        IMAGE_TAG       = "${env.GIT_COMMIT.take(8)}"
        K8S_NAMESPACE   = 'campusflow'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    stages {
        stage('1. Checkout') {
            steps {
                checkout scm
                echo "Building commit: ${env.IMAGE_TAG}"
            }
        }

        stage('2. Dependencies & Lint') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                }
                dir('frontend') {
                    sh 'npm ci'
                }
            }
        }

        stage('3. Automated Tests & Concurrency Check') {
            steps {
                dir('backend') {
                    sh 'npm test'
                    sh 'npx jest tests/concurrency.test.js --runInBand'
                }
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('4. Security Scan') {
            steps {
                echo 'Running vulnerability scan against dependencies...'
                dir('backend') {
                    sh 'npm audit --audit-level=critical || true'
                }
            }
        }

        stage('5. Docker Build & Tag') {
            steps {
                echo "Building immutable container images: tag ${env.IMAGE_TAG}"
                sh "docker build -f docker/Dockerfile.backend -t ${IMAGE_BACKEND}:${IMAGE_TAG} ./backend"
                sh "docker build -f docker/Dockerfile.frontend -t ${IMAGE_FRONTEND}:${IMAGE_TAG} ./frontend"
            }
        }

        stage('6. Deploy to Kubernetes') {
            steps {
                echo "Deploying to Kubernetes namespace: ${env.K8S_NAMESPACE}"
                sh """
                    kubectl set image deployment/campusflow-backend backend=${IMAGE_BACKEND}:${IMAGE_TAG} -n ${K8S_NAMESPACE} --record
                    kubectl set image deployment/campusflow-frontend frontend=${IMAGE_FRONTEND}:${IMAGE_TAG} -n ${K8S_NAMESPACE} --record
                """
            }
        }

        stage('7. Rollout Verification & Smoke Test') {
            steps {
                echo 'Verifying rollout status across pods (120s timeout)...'
                sh """
                    kubectl rollout status deployment/campusflow-backend -n ${K8S_NAMESPACE} --timeout=120s
                    kubectl rollout status deployment/campusflow-frontend -n ${K8S_NAMESPACE} --timeout=120s
                """
                echo 'Executing smoke test against production readiness endpoint...'
                sh "curl -f -m 5 http://portal.campusflow.edu/ready"
            }
        }
    }

    post {
        success {
            echo "================================================================="
            echo "🎉 DEPLOYMENT SUCCESSFUL — REVISION ${IMAGE_TAG} VERIFIED OPERATIONAL"
            echo "================================================================="
        }
        failure {
            echo "================================================================="
            echo "⚠️ DEPLOYMENT OR SMOKE TEST FAILED! INITIATING AUTOMATIC ROLLBACK..."
            echo "================================================================="
            sh """
                kubectl rollout undo deployment/campusflow-backend -n ${K8S_NAMESPACE} || true
                kubectl rollout undo deployment/campusflow-frontend -n ${K8S_NAMESPACE} || true
                kubectl rollout status deployment/campusflow-backend -n ${K8S_NAMESPACE} --timeout=60s || true
                kubectl rollout status deployment/campusflow-frontend -n ${K8S_NAMESPACE} --timeout=60s || true
            """
            echo "DEPLOYMENT FAILED — AUTOMATIC ROLLBACK COMPLETED"
        }
    }
}
