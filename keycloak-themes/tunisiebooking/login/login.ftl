<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
        <div class="brand-header">
            <div class="brand-logo-card">
                <img src="${url.resourcesPath}/img/logo.png" alt="Tunisie Booking" class="brand-logo-img"/>
            </div>
        </div>

    <#elseif section = "form">
          <div id="kc-form-wrapper">

            <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
              <div class="alert alert-${message.type}">
                ${kcSanitize(message.summary)?no_esc}
              </div>
            </#if>

            <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">

              <#if !realm.loginWithEmailAllowed>
                <div class="form-group">
                  <label for="username" class="form-label">Nom d'utilisateur</label>
                  <input tabindex="1" id="username" class="form-input" name="username"
                    value="${(login.username!'')}" type="text" autofocus autocomplete="username"
                    placeholder="Votre nom d'utilisateur" />
                </div>
              <#else>
                <div class="form-group">
                  <label for="username" class="form-label">Email ou nom d'utilisateur</label>
                  <input tabindex="1" id="username" class="form-input" name="username"
                    value="${(login.username!'')}" type="text" autofocus autocomplete="username"
                    placeholder="votre@email.com" />
                </div>
              </#if>

              <div class="form-group">
                <label for="password" class="form-label">Mot de passe</label>
                <input tabindex="2" id="password" class="form-input" name="password"
                  type="password" autocomplete="current-password"
                  placeholder="••••••••••••" />
              </div>

              <div class="form-options">
                <#if realm.rememberMe && !usernameHidden??>
                  <div class="checkbox">
                    <label>
                      <#if login.rememberMe??>
                        <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox" checked>
                      <#else>
                        <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox">
                      </#if>
                      Se souvenir de moi
                    </label>
                  </div>
                </#if>
                <#if realm.resetPasswordAllowed>
                  <a tabindex="5" href="${url.loginResetCredentialsUrl}" class="link-forgot">
                    Mot de passe oublié ?
                  </a>
                </#if>
              </div>

              <div id="kc-form-options" class="form-actions">
                <button tabindex="4" name="login" id="kc-login" type="submit" class="btn-primary">
                  Se connecter
                </button>
              </div>

            </form>

            <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
              <div class="register-section">
                <span>Pas encore de compte ?</span>
                <a tabindex="6" href="${url.registrationUrl}" class="btn-secondary">S'inscrire gratuitement</a>
              </div>
            </#if>

          </div>
    </#if>
</@layout.registrationLayout>
