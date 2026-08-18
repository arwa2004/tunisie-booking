Start-Sleep -Seconds 3

# Get admin token
$tokenResponse = Invoke-RestMethod `
  -Uri "http://localhost:8080/realms/master/protocol/openid-connect/token" `
  -Method Post `
  -ContentType "application/x-www-form-urlencoded" `
  -Body "client_id=admin-cli&username=admin&password=admin&grant_type=password"

$token = $tokenResponse.access_token
Write-Host "Token OK: $($token.Substring(0,20))..."

# Delete existing realm if it exists
try {
  Invoke-RestMethod `
    -Uri "http://localhost:8080/admin/realms/tunisie-booking" `
    -Method Delete `
    -Headers @{ Authorization = "Bearer $token" }
  Write-Host "Old realm deleted"
  Start-Sleep -Seconds 2
} catch {
  Write-Host "Realm did not exist yet (OK)"
}

# Import realm
$realmJson = Get-Content "C:\Users\User\Desktop\esprit-microservices\keycloak-themes\tunisiebooking\realm-tunisie-booking.json" -Raw -Encoding UTF8

Invoke-RestMethod `
  -Uri "http://localhost:8080/admin/realms" `
  -Method Post `
  -Headers @{
    Authorization  = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body $realmJson

Write-Host "Realm 'tunisie-booking' imported successfully!"
