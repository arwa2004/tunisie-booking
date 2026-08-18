#!/bin/sh

KCADM="/opt/keycloak/bin/kcadm.sh"
REALM="tunisie-booking"

echo "==> Setting up realm $REALM..."

# Create realm
$KCADM create realms \
  -s realm=$REALM \
  -s enabled=true \
  -s loginTheme=tunisiebooking \
  -s accountTheme=tunisiebooking \
  -s registrationAllowed=true \
  -s rememberMe=true \
  -s resetPasswordAllowed=true \
  -s loginWithEmailAllowed=true \
  -s displayName="Tunisie Booking" 2>&1 || echo "Realm already exists"

# Create client
CLIENT_ID=$($KCADM create clients -r $REALM \
  -s clientId=nextjs-frontend \
  -s enabled=true \
  -s publicClient=true \
  -s standardFlowEnabled=true \
  -i 2>&1)
echo "Client ID: $CLIENT_ID"

# Update redirect URIs using separate -s flags
$KCADM update clients/$CLIENT_ID -r $REALM \
  -s 'redirectUris=["http://localhost:3000/*","http://localhost:3000/api/auth/callback/keycloak"]' 2>&1 || echo "Failed to update redirectUris"

$KCADM update clients/$CLIENT_ID -r $REALM \
  -s 'webOrigins=["http://localhost:3000"]' 2>&1 || echo "Failed to update webOrigins"

echo "==> Creating roles..."
$KCADM create roles -r $REALM -s name=user -s description="Utilisateur standard" 2>&1 || true
$KCADM create roles -r $REALM -s name=admin -s description="Administrateur" 2>&1 || true

echo "==> Done! Realm $REALM configured with theme tunisiebooking"
