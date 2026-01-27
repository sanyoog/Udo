#!/bin/bash
# Script to update Udo with mobile responsive features

echo "Syncing JEE prep tags to maindata..."
curl -X POST http://localhost:5000/api/page/jee-preparation-feb-march/sync_tags

echo ""
echo "Building frontend..."
cd /workspaces/Udo/frontend && npm run build

echo ""
echo "Done! Restart the backend to apply changes."
