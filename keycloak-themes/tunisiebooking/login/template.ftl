<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html lang="fr" class="${properties.kcHtmlClass!}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>TunisieBooking — Connexion sécurisée</title>

  <!-- Inter Font -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

  <!-- Theme CSS -->
  <link rel="stylesheet" href="${url.resourcesPath}/css/login.css">

  <style>
    /* ── Full page clean light background ─────────────────── */
    html, body {
      min-height: 100vh;
      background: #f8f9fa !important;
      color: #1a1a2e !important;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem 1rem;
    }

    /* ── Remove all default Keycloak chrome ──────────── */
    .login-pf, .login-pf-page, #kc-container,
    #kc-header-wrapper, .kc-logo-text,
    div[id^="kc-header"] {
      display: block;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      margin: 0 !important;
      max-width: none !important;
    }

    /* ── Center the card ─────────────────────────────── */
    #kc-content {
      width: 100% !important;
      max-width: 650px !important;
      margin: 0 auto !important;
      position: relative;
      z-index: 1;
    }
    #kc-content-wrapper { padding: 0; }
  </style>
</head>

<body class="${properties.kcBodyClass!}">

  <!-- Soft light background accents -->
  <div style="position:fixed;top:-100px;left:-100px;width:450px;height:450px;background:rgba(233,30,140,0.06);border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;"></div>
  <div style="position:fixed;bottom:-80px;right:-80px;width:400px;height:400px;background:rgba(133,185,25,0.08);border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;"></div>

  <div id="kc-content">
    <div id="kc-content-wrapper">

      <!-- Header section (brand) -->
      <#nested "header">

      <!-- Form section -->
      <#nested "form">

      <!-- Info section (if needed) -->
      <#if displayInfo>
        <#nested "info">
      </#if>

    </div>
  </div>

</body>
</html>
</#macro>
