#!/bin/bash

# DataNexus - Vercel Deployment with Environment Variables
# This script deploys to Vercel and helps set up environment variables

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    print_success "Node.js: $(node --version)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm: $(npm --version)"
    
    # Check/Install Vercel CLI
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
        print_success "Vercel CLI installed"
    else
        print_success "Vercel CLI: $(vercel --version)"
    fi
}

# Login to Vercel
vercel_login() {
    print_header "Vercel Authentication"
    
    if vercel whoami &> /dev/null; then
        VERCEL_USER=$(vercel whoami)
        print_success "Logged in as: $VERCEL_USER"
    else
        print_info "Opening browser for authentication..."
        vercel login
        print_success "Successfully authenticated"
    fi
}

# Create .env.production template
create_env_template() {
    print_header "Environment Variables Template"
    
    if [ -f .env.production ]; then
        print_warning ".env.production already exists"
        read -p "Overwrite? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return
        fi
    fi
    
    cat > .env.production << 'EOF'
# DataNexus Production Environment Variables
# Copy these to Vercel Dashboard → Settings → Environment Variables

# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# ============================================
# SOLANA
# ============================================
SOLANA_RPC_URL="https://api.devnet.solana.com"
SOLANA_NETWORK="devnet"
USDC_MINT_ADDRESS="Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"

# Platform Wallet Private Key (JSON array format)
# Generate using: node scripts/generate-platform-wallet.js
PLATFORM_WALLET_PRIVATE_KEY="[1,2,3,...]"

# Escrow Program ID
ESCROW_PROGRAM_ID="gxDTeSCzk9mqiokrmTb1uNbWCjQ1rj2hsj5N65K9698"

# ============================================
# IRYS / ARWEAVE
# ============================================
IRYS_NETWORK="devnet"
IRYS_TOKEN="solana"
IRYS_RPC_URL="https://api.devnet.solana.com"

# ============================================
# EIGENAI
# ============================================
EIGENAI_API_KEY="your_eigenai_api_key_here"
EIGENAI_API_URL="https://api.eigenai.com"

# ============================================
# REDIS (Optional)
# ============================================
REDIS_URL="redis://localhost:6379"

# ============================================
# APPLICATION
# ============================================
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NODE_ENV="production"
EOF
    
    print_success "Created .env.production template"
    print_info "Please edit .env.production with your actual values"
}

# Set environment variables in Vercel
set_vercel_env_vars() {
    print_header "Setting Vercel Environment Variables"
    
    if [ ! -f .env.production ]; then
        print_error ".env.production not found"
        print_info "Run this script again to create the template"
        exit 1
    fi
    
    print_info "This will set environment variables from .env.production"
    print_warning "Make sure you've edited .env.production with real values!"
    echo ""
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi
    
    print_info "Setting environment variables..."
    
    # Read .env.production and set each variable
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z $key ]] && continue
        
        # Remove quotes from value
        value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        
        # Skip placeholder values
        if [[ $value == *"your_"* ]] || [[ $value == *"..."* ]]; then
            print_warning "Skipping placeholder: $key"
            continue
        fi
        
        # Set the environment variable
        print_info "Setting: $key"
        vercel env add "$key" production <<< "$value" 2>/dev/null || true
        
    done < .env.production
    
    print_success "Environment variables set"
}

# Build and test locally
build_and_test() {
    print_header "Building and Testing"
    
    print_info "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
    
    print_info "Generating Prisma client..."
    npx prisma generate
    print_success "Prisma client generated"
    
    print_info "Building project..."
    if npm run build; then
        print_success "Build successful"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Deploy to Vercel
deploy() {
    print_header "Deploying to Vercel"
    
    echo "Choose deployment environment:"
    echo "  1) Preview (for testing)"
    echo "  2) Production"
    echo ""
    read -p "Enter choice (1 or 2): " DEPLOY_ENV
    
    case $DEPLOY_ENV in
        1)
            print_info "Deploying to preview..."
            vercel
            ;;
        2)
            print_info "Deploying to production..."
            vercel --prod
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
}

# Post-deployment instructions
post_deployment() {
    print_header "Post-Deployment Tasks"
    
    echo ""
    echo "🎉 Deployment completed!"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Verify environment variables in Vercel Dashboard:"
    echo "   → https://vercel.com/dashboard"
    echo "   → Your Project → Settings → Environment Variables"
    echo ""
    echo "2. Run database migrations:"
    echo "   → vercel env pull .env.vercel"
    echo "   → npx prisma migrate deploy"
    echo ""
    echo "3. Test your deployment:"
    echo "   → Visit your Vercel URL"
    echo "   → Test: /api/health"
    echo "   → Test: /docs"
    echo "   → Test: /datasets"
    echo ""
    echo "4. Monitor logs:"
    echo "   → Vercel Dashboard → Your Project → Logs"
    echo ""
}

# Interactive menu
show_menu() {
    clear
    print_header "🚀 DataNexus - Vercel Deployment Tool"
    
    echo "What would you like to do?"
    echo ""
    echo "  1) Full deployment (recommended for first time)"
    echo "  2) Create .env.production template"
    echo "  3) Set environment variables only"
    echo "  4) Deploy only (skip env setup)"
    echo "  5) Build and test locally"
    echo "  6) Exit"
    echo ""
    read -p "Enter your choice (1-6): " MENU_CHOICE
    
    case $MENU_CHOICE in
        1)
            check_prerequisites
            vercel_login
            create_env_template
            echo ""
            print_warning "Please edit .env.production with your actual values"
            read -p "Press Enter when ready to continue..."
            set_vercel_env_vars
            build_and_test
            deploy
            post_deployment
            ;;
        2)
            create_env_template
            print_info "Edit .env.production and run this script again"
            ;;
        3)
            check_prerequisites
            vercel_login
            set_vercel_env_vars
            ;;
        4)
            check_prerequisites
            vercel_login
            build_and_test
            deploy
            post_deployment
            ;;
        5)
            build_and_test
            print_success "Local build successful"
            ;;
        6)
            print_info "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
}

# Main
main() {
    show_menu
}

main

