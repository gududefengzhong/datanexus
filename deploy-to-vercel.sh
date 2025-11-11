#!/bin/bash

# DataNexus - Vercel Direct Deployment Script
# This script deploys the project directly to Vercel without using GitHub

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Check if Vercel CLI is installed
check_vercel_cli() {
    print_header "Checking Vercel CLI"
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
        print_success "Vercel CLI installed successfully"
    else
        print_success "Vercel CLI is already installed"
        vercel --version
    fi
}

# Login to Vercel
vercel_login() {
    print_header "Vercel Authentication"
    
    print_info "Checking Vercel authentication status..."
    
    if vercel whoami &> /dev/null; then
        VERCEL_USER=$(vercel whoami)
        print_success "Already logged in as: $VERCEL_USER"
    else
        print_info "Please log in to Vercel..."
        vercel login
        print_success "Successfully logged in to Vercel"
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    print_header "Pre-Deployment Checks"
    
    # Check if .env.local exists
    if [ ! -f .env.local ]; then
        print_warning ".env.local not found"
        print_info "You'll need to set environment variables in Vercel Dashboard"
    else
        print_success ".env.local found"
    fi
    
    # Check if node_modules exists
    if [ ! -d node_modules ]; then
        print_warning "node_modules not found. Installing dependencies..."
        npm install
        print_success "Dependencies installed"
    else
        print_success "node_modules found"
    fi
    
    # Check if build works
    print_info "Testing build..."
    if npm run build; then
        print_success "Build test passed"
    else
        print_error "Build failed. Please fix errors before deploying."
        exit 1
    fi
}

# Set environment variables
set_environment_variables() {
    print_header "Environment Variables Setup"
    
    print_info "You need to set the following environment variables in Vercel:"
    echo ""
    echo "Required variables:"
    echo "  - DATABASE_URL"
    echo "  - PLATFORM_WALLET_PRIVATE_KEY"
    echo "  - SOLANA_RPC_URL"
    echo "  - EIGENAI_API_KEY"
    echo "  - IRYS_NETWORK"
    echo "  - NEXT_PUBLIC_APP_URL"
    echo ""
    
    read -p "Have you prepared all environment variables? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Please prepare environment variables first"
        print_info "See VERCEL_DEPLOYMENT_GUIDE.md for details"
        exit 1
    fi
}

# Deploy to Vercel
deploy_to_vercel() {
    print_header "Deploying to Vercel"
    
    print_info "Choose deployment type:"
    echo "  1) Preview deployment (for testing)"
    echo "  2) Production deployment"
    echo ""
    read -p "Enter your choice (1 or 2): " DEPLOY_TYPE
    
    case $DEPLOY_TYPE in
        1)
            print_info "Deploying to preview environment..."
            vercel
            ;;
        2)
            print_info "Deploying to production..."
            vercel --prod
            ;;
        *)
            print_error "Invalid choice. Exiting."
            exit 1
            ;;
    esac
}

# Post-deployment tasks
post_deployment_tasks() {
    print_header "Post-Deployment Tasks"
    
    print_info "Important: Don't forget to:"
    echo ""
    echo "  1. Set environment variables in Vercel Dashboard"
    echo "     → Go to: Settings → Environment Variables"
    echo ""
    echo "  2. Run database migrations"
    echo "     → vercel env pull .env.production"
    echo "     → npx prisma migrate deploy"
    echo ""
    echo "  3. Test your deployment"
    echo "     → Visit your Vercel URL"
    echo "     → Test /api/health endpoint"
    echo "     → Test /docs pages"
    echo ""
    
    print_success "Deployment process completed!"
}

# Main deployment flow
main() {
    clear
    
    print_header "🚀 DataNexus - Vercel Deployment"
    
    echo "This script will deploy your DataNexus project directly to Vercel"
    echo "without using GitHub integration."
    echo ""
    
    read -p "Continue with deployment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled"
        exit 0
    fi
    
    # Run deployment steps
    check_vercel_cli
    vercel_login
    pre_deployment_checks
    set_environment_variables
    deploy_to_vercel
    post_deployment_tasks
    
    print_header "🎉 Deployment Complete!"
    
    echo ""
    echo "Next steps:"
    echo "  1. Configure environment variables in Vercel Dashboard"
    echo "  2. Run database migrations"
    echo "  3. Test your deployment"
    echo ""
    echo "For detailed instructions, see: VERCEL_DEPLOYMENT_GUIDE.md"
    echo ""
}

# Run main function
main

