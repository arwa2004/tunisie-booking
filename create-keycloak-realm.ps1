# ============================================================
#  Creation du realm Keycloak 'tunisie-booking' via Admin REST
#  (client, roles, utilisateurs)
# ============================================================

$ErrorActionPreference = "Stop"

$KC_URL   = "http://localhost:8080"
$REALM    = "tunisie-booking"
$CLIENT   = "nextjs-frontend"

function Get-KcToken {
    $body = @{
        client_id    = "admin-cli"
        username     = "admin"
        password     = "admin"
        grant_type   = "password"
    }
    $resp = Invoke-RestMethod -Uri "$KC_URL/realms/master/protocol/openid-connect/token" `
        -Method Post -ContentType "application/x-www-form-urlencoded" -Body $body
    return $resp.access_token
}

function Invoke-KcJson {
    param([string]$Method, [string]$Uri, [object]$Data, [string]$Token)
    $headers = @{ Authorization = "Bearer $Token"; "Content-Type" = "application/json" }
    $json = $Data | ConvertTo-Json -Depth 100 -Compress
    return Invoke-RestMethod -Uri $Uri -Method $Method -Headers $headers -Body $json
}

Write-Host "Recuperation du token admin..."
$token = Get-KcToken
Write-Host "Token OK"

# 0. Supprimer l'ancien realm s'il existe
try {
    Invoke-RestMethod -Uri "$KC_URL/admin/realms/$REALM" -Method Delete -Headers @{ Authorization = "Bearer $token" }
    Write-Host "Ancien realm supprime"
    Start-Sleep -Seconds 2
} catch {
    Write-Host "Aucun realm existant (OK)"
}

# 1. Creer le realm
$realmBody = @{
    realm                    = $REALM
    enabled                  = $true
    displayName              = "Tunisie Booking"
    loginTheme               = "tunisiebooking"
    accountTheme             = "tunisiebooking"
    registrationAllowed      = $true
    registrationEmailAsUsername = $false
    rememberMe               = $true
    resetPasswordAllowed     = $true
    verifyEmail              = $false
    loginWithEmailAllowed    = $true
    duplicateEmailsAllowed   = $false
}
Write-Host "Creation du realm $REALM..."
Invoke-KcJson -Method Post -Uri "$KC_URL/admin/realms" -Data $realmBody -Token $token
Write-Host "Realm cree"

# 2. Ajouter les roles realm
Write-Host "Ajout des roles..."
$roles = @("user", "admin")
foreach ($role in $roles) {
    $roleBody = @{ name = $role; description = "Role $role de Tunisie Booking" }
    Invoke-KcJson -Method Post -Uri "$KC_URL/admin/realms/$REALM/roles" -Data $roleBody -Token $token
}
Write-Host "Roles user/admin crees"

# 3. Creer le client OIDC pour Next.js
Write-Host "Creation du client $CLIENT..."
$clientBody = @{
    clientId                  = $CLIENT
    name                      = "Next.js Frontend"
    enabled                   = $true
    protocol                  = "openid-connect"
    publicClient              = $true
    standardFlowEnabled       = $true
    implicitFlowEnabled       = $false
    directAccessGrantsEnabled = $false
    serviceAccountsEnabled    = $false
    authorizationServicesEnabled = $false
    redirectUris              = @(
        "http://localhost:3000/api/auth/callback/keycloak",
        "http://localhost:3000/*"
    )
    webOrigins                = @("http://localhost:3000")
    bearerOnly                = $false
    consentRequired           = $false
    fullScopeAllowed          = $true
    attributes                = @{
        "post.logout.redirect.uris" = "http://localhost:3000/login/*"
        "pkce.code.challenge.method" = "S256"
        "login.theme" = "tunisiebooking"
    }
}
Invoke-KcJson -Method Post -Uri "$KC_URL/admin/realms/$REALM/clients" -Data $clientBody -Token $token
Write-Host "Client cree"

# 4. Creer les utilisateurs
Write-Host "Creation des utilisateurs..."

function New-User {
    param([string]$Username, [string]$Email, [string]$FirstName, [string]$LastName, [string]$Password, [array]$RealmRole, [string]$Token)

    # 4a. Creer l'utilisateur
    $userBody = @{
        username      = $Username
        email         = $Email
        firstName     = $FirstName
        lastName      = $LastName
        enabled       = $true
        emailVerified = $true
    }
    $resp = Invoke-WebRequest -Uri "$KC_URL/admin/realms/$REALM/users" -Method Post `
        -Headers @{ Authorization = "Bearer $Token"; "Content-Type" = "application/json" } `
        -Body ($userBody | ConvertTo-Json -Compress) -UseBasicParsing
    $userId = $resp.Headers.Location.Split('/')[-1]

    # 4b. Definir le mot de passe (non temporaire)
    $credBody = @{ type = "password"; value = $Password; temporary = $false }
    Invoke-WebRequest -Uri "$KC_URL/admin/realms/$REALM/users/$userId/reset-password" -Method Put `
        -Headers @{ Authorization = "Bearer $Token"; "Content-Type" = "application/json" } `
        -Body ($credBody | ConvertTo-Json -Compress) -UseBasicParsing

    # 4c. Assigner les roles realm
    $roleObjects = @()
    foreach ($r in $RealmRole) {
        $roleInfo = Invoke-RestMethod -Uri "$KC_URL/admin/realms/$REALM/roles/$r" -Method Get -Headers @{ Authorization = "Bearer $Token" }
        $roleObjects += $roleInfo
    }
    Invoke-WebRequest -Uri "$KC_URL/admin/realms/$REALM/users/$userId/role-mappings/realm" -Method Post `
        -Headers @{ Authorization = "Bearer $Token"; "Content-Type" = "application/json" } `
        -Body ($roleObjects | ConvertTo-Json -Depth 10 -Compress) -UseBasicParsing

    Write-Host "   OK $Username ($Email) - role(s): $($RealmRole -join ', ')"
}

New-User -Username "admin"  -Email "admin@gmail.com"   -FirstName "Super" -LastName "Admin"   -Password "admin1234"   -RealmRole @("admin") -Token $token
New-User -Username "arwa"   -Email "arwa@example.com"  -FirstName "Arwa"  -LastName "Ben Amar" -Password "password123" -RealmRole @("user")  -Token $token
New-User -Username "client" -Email "client@gmail.com"  -FirstName "Test"  -LastName "Client"  -Password "password123" -RealmRole @("user")  -Token $token

Write-Host ""
Write-Host "============================================"
Write-Host "  Realm '$REALM' configure avec succes !"
Write-Host "  Admin : admin@gmail.com / admin1234 (admin)"
Write-Host "  User  : arwa@example.com / password123"
Write-Host "  User  : client@gmail.com / password123"
Write-Host "============================================"
