#!/bin/bash

# DataNexus - Pre-Submission Check Script
# Solana x402 Hackathon 2025
# Run this before submitting to ensure everything is ready

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Print functions
print_header() {
    echo -e "\n${PURPLE}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}${BOLD}║  $1${NC}"
    echo -e "${PURPLE}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_CHECKS++))
    ((TOTAL_CHECKS++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_CHECKS++))
    ((TOTAL_CHECKS++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNING_CHECKS++))
    ((TOTAL_CHECKS++))
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Start
clear
echo -e "${BOLD}${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         DataNexus Pre-Submission Check                    ║"
echo "║         Solana x402 Hackathon 2025                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

print_info "Starting pre-submission checks..."
print_info "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ============================================================================
# 1. Repository Checks
# ============================================================================
print_header "1. Repository Checks"

# Check if in git repository
if git rev-parse --git-dir > /dev/null 2>&1; then
    print_success "Git repository detected"
else
    print_error "Not in a git repository"
fi

# Check if repository is public
REPO_URL=$(git config --get remote.origin.url 2>/dev/null)
if [[ $REPO_URL == *"github.com"* ]]; then
    print_success "GitHub repository: $REPO_URL"
else
    print_warning "Repository URL not found or not GitHub"
fi

# Check for uncommitted changes
if git diff-index --quiet HEAD -- 2>/dev/null; then
    print_success "No uncommitted changes"
else
    print_warning "Uncommitted changes detected - commit before submitting"
fi

# Check for LICENSE file
if [ -f "LICENSE" ] || [ -f "LICENSE.md" ]; then
    print_success "LICENSE file exists"
else
    print_error "LICENSE file missing (MIT license required)"
fi

# ============================================================================
# 2. Documentation Checks
# ============================================================================
print_header "2. Documentation Checks"

# Check README.md
if [ -f "README.md" ]; then
    if grep -q "Solana x402 Hackathon" README.md; then
        print_success "README.md contains hackathon information"
    else
        print_warning "README.md missing hackathon information"
    fi
else
    print_error "README.md not found"
fi

# Check submission documents
REQUIRED_DOCS=(
    "HACKATHON_SUBMISSION.md"
    "DEMO_VIDEO_SCRIPT.md"
    "SUBMISSION_CHECKLIST.md"
    "QUICK_REFERENCE.md"
    "SMART_CONTRACT_INFO.md"
)

for doc in "${REQUIRED_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        print_success "$doc exists"
    else
        print_error "$doc missing"
    fi
done

# Check documentation pages
DOCS_PAGES=(
    "docs/API_DOCUMENTATION.md"
    "docs/BUYER_GUIDE.md"
    "docs/SELLER_GUIDE.md"
    "public/docs/USER_STORIES.md"
)

for page in "${DOCS_PAGES[@]}"; do
    if [ -f "$page" ]; then
        print_success "$page exists"
    else
        print_warning "$page missing"
    fi
done

# ============================================================================
# 3. Code Quality Checks
# ============================================================================
print_header "3. Code Quality Checks"

# Check package.json
if [ -f "package.json" ]; then
    print_success "package.json exists"
    
    # Check for required dependencies
    if grep -q "next" package.json; then
        print_success "Next.js dependency found"
    else
        print_error "Next.js dependency missing"
    fi
    
    if grep -q "@solana/web3.js" package.json; then
        print_success "Solana Web3.js dependency found"
    else
        print_error "Solana Web3.js dependency missing"
    fi
else
    print_error "package.json not found"
fi

# Check TypeScript config
if [ -f "tsconfig.json" ]; then
    print_success "tsconfig.json exists"
else
    print_warning "tsconfig.json not found"
fi

# Check for Anchor program
if [ -f "Anchor.toml" ]; then
    print_success "Anchor.toml exists"
    
    # Check program ID
    if grep -q "gxDTeSCzk9mqiokrmTb1uNbWCjQ1rj2hsj5N65K9698" Anchor.toml; then
        print_success "Escrow program ID found in Anchor.toml"
    else
        print_warning "Escrow program ID not found"
    fi
else
    print_error "Anchor.toml not found"
fi

# Check for IDL files
if [ -f "target/idl/datanexus_escrow.json" ]; then
    print_success "Escrow IDL file exists"
else
    print_warning "Escrow IDL file not found (may need to build)"
fi

# ============================================================================
# 4. Deployment Checks
# ============================================================================
print_header "4. Deployment Checks"

# Check production URL
PROD_URL="https://datanexus-huhiyohb8-rochestors-projects.vercel.app"
print_info "Testing production URL: $PROD_URL"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL" 2>/dev/null)
if [ "$HTTP_STATUS" = "200" ]; then
    print_success "Production site is live (HTTP $HTTP_STATUS)"
else
    print_error "Production site returned HTTP $HTTP_STATUS"
fi

# Check /docs page
DOCS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/docs" 2>/dev/null)
if [ "$DOCS_STATUS" = "200" ]; then
    print_success "/docs page is accessible"
else
    print_error "/docs page returned HTTP $DOCS_STATUS"
fi

# Check favicon
FAVICON_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/icon.svg" 2>/dev/null)
if [ "$FAVICON_STATUS" = "200" ]; then
    print_success "Favicon is accessible"
else
    print_warning "Favicon returned HTTP $FAVICON_STATUS"
fi

# Check API endpoint
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/api/agent/datasets/search?query=test" 2>/dev/null)
if [ "$API_STATUS" = "200" ] || [ "$API_STATUS" = "401" ]; then
    print_success "API endpoint is responding"
else
    print_warning "API endpoint returned HTTP $API_STATUS"
fi

# ============================================================================
# 5. Smart Contract Checks
# ============================================================================
print_header "5. Smart Contract Checks"

# Check if Solana CLI is installed
if command -v solana &> /dev/null; then
    print_success "Solana CLI installed"
    
    # Check program on devnet
    PROGRAM_ID="gxDTeSCzk9mqiokrmTb1uNbWCjQ1rj2hsj5N65K9698"
    print_info "Checking program on Devnet: $PROGRAM_ID"
    
    if solana program show $PROGRAM_ID --url devnet &> /dev/null; then
        print_success "Escrow program deployed on Devnet"
    else
        print_error "Escrow program not found on Devnet"
    fi
else
    print_warning "Solana CLI not installed (can't verify deployment)"
fi

# Check if Anchor is installed
if command -v anchor &> /dev/null; then
    print_success "Anchor CLI installed"
else
    print_warning "Anchor CLI not installed"
fi

# ============================================================================
# 6. Demo Video Checks
# ============================================================================
print_header "6. Demo Video Checks"

# Check if demo video script exists
if [ -f "DEMO_VIDEO_SCRIPT.md" ]; then
    print_success "Demo video script prepared"
else
    print_error "Demo video script missing"
fi

# Check if video recording guide exists
if [ -f "VIDEO_RECORDING_GUIDE.md" ]; then
    print_success "Video recording guide prepared"
else
    print_warning "Video recording guide missing"
fi

# Prompt for video URL
echo -e "\n${CYAN}Have you recorded and uploaded the demo video?${NC}"
echo -e "${CYAN}Video URL (or press Enter to skip): ${NC}"
read -r VIDEO_URL

if [ -n "$VIDEO_URL" ]; then
    print_success "Demo video URL provided: $VIDEO_URL"
    
    # Test if URL is accessible
    VIDEO_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$VIDEO_URL" 2>/dev/null)
    if [ "$VIDEO_STATUS" = "200" ]; then
        print_success "Video URL is accessible"
    else
        print_warning "Video URL returned HTTP $VIDEO_STATUS"
    fi
else
    print_warning "Demo video not yet uploaded"
fi

# ============================================================================
# 7. Submission Form Checks
# ============================================================================
print_header "7. Submission Form Preparation"

print_info "Submission form: https://solanafoundation.typeform.com/x402hackathon"
echo ""

# Check if all required information is ready
echo -e "${CYAN}Do you have the following ready?${NC}\n"

SUBMISSION_ITEMS=(
    "Project name: DataNexus"
    "Track: Best x402 Agent Application"
    "Team name: @rochestor_mu"
    "Email: greennft.eth@gmail.com"
    "GitHub URL: https://github.com/gududefengzhong/datanexus"
    "Live demo URL: $PROD_URL"
    "Demo video URL: [Pending]"
    "Documentation URL: $PROD_URL/docs"
    "Smart contract address: gxDTeSCzk9mqiokrmTb1uNbWCjQ1rj2hsj5N65K9698"
)

for item in "${SUBMISSION_ITEMS[@]}"; do
    echo -e "  ${GREEN}✓${NC} $item"
done

echo ""

# ============================================================================
# 8. Final Checks
# ============================================================================
print_header "8. Final Checks"

# Check if all links work
print_info "Testing all critical links..."

LINKS=(
    "$PROD_URL"
    "$PROD_URL/docs"
    "$PROD_URL/docs/buyer-guide"
    "$PROD_URL/docs/seller-guide"
    "$PROD_URL/docs/api-reference"
    "https://github.com/gududefengzhong/datanexus"
    "https://explorer.solana.com/address/gxDTeSCzk9mqiokrmTb1uNbWCjQ1rj2hsj5N65K9698?cluster=devnet"
)

WORKING_LINKS=0
TOTAL_LINKS=${#LINKS[@]}

for link in "${LINKS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$link" 2>/dev/null)
    if [ "$STATUS" = "200" ]; then
        ((WORKING_LINKS++))
    fi
done

if [ $WORKING_LINKS -eq $TOTAL_LINKS ]; then
    print_success "All critical links are working ($WORKING_LINKS/$TOTAL_LINKS)"
else
    print_warning "Some links not working ($WORKING_LINKS/$TOTAL_LINKS)"
fi

# Check deadline
DEADLINE="2025-11-11 23:59:00"
CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')

print_info "Submission deadline: $DEADLINE PST"
print_info "Current time: $CURRENT_TIME"

# ============================================================================
# Summary
# ============================================================================
print_header "Summary"

echo -e "${BOLD}Total Checks: $TOTAL_CHECKS${NC}"
echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "${RED}Failed: $FAILED_CHECKS${NC}"
echo -e "${YELLOW}Warnings: $WARNING_CHECKS${NC}"

SUCCESS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
echo -e "\n${BOLD}Success Rate: $SUCCESS_RATE%${NC}\n"

# Final recommendation
if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}${BOLD}🎉 All critical checks passed!${NC}"
    echo -e "${GREEN}${BOLD}✅ Ready to submit to hackathon!${NC}\n"
    
    echo -e "${CYAN}Next steps:${NC}"
    echo -e "  1. Record demo video (if not done)"
    echo -e "  2. Upload video to YouTube"
    echo -e "  3. Fill out submission form"
    echo -e "  4. Submit before deadline"
    echo -e "  5. Celebrate! 🎊\n"
    
    exit 0
else
    echo -e "${RED}${BOLD}⚠️  Some checks failed!${NC}"
    echo -e "${YELLOW}Please fix the issues above before submitting.${NC}\n"
    
    exit 1
fi

