#!/bin/bash

# Script to deploy Firestore security rules
# This fixes the permission-denied errors in the Community page

echo "🔐 Deploying Firestore security rules..."
echo ""
echo "If you haven't logged in to Firebase CLI yet, run:"
echo "  firebase login"
echo ""

# Deploy the rules
firebase deploy --only firestore:rules --project rewardz-fe98e

echo ""
echo "✅ Deployment complete!"
echo ""
echo "The following changes were made:"
echo "  - Added security rules for forums/{forumId}/members/{memberId} subcollection"
echo "  - Fixed forum creation/update rules to match the code"
echo ""
echo "This should resolve the permission-denied errors you were seeing."
