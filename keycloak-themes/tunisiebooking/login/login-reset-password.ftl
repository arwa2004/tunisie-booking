<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username') displayInfo=realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
        <div class="brand-header">
            <div class="brand-logo-card">
                <img src="${url.resourcesPath}/img/logo.png" alt="Tunisie Booking" class="brand-logo-img"/>
            </div>
        </div>

    <#elseif section = "form">
        <div id="kc-reset-password-form">
          <div id="kc-form-wrapper">

            <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
              <div class="alert alert-${message.type}">
                ${kcSanitize(message.summary)?no_esc}
              </div>
            </#if>

            <form id="kc-reset-password-form" action="${url.loginAction}" method="post">

              <p class="reset-instruction">
                Entrez votre adresse email ou nom d'utilisateur. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              <div class="form-group">
                <label for="username" class="form-label">
                  <#if !realm.loginWithEmailAllowed>Nom d'utilisateur<#elseif !realm.registrationEmailAsUsername>Email ou nom d'utilisateur<#else>Email</#if>
                </label>
                <input tabindex="1" id="username" class="form-input" name="username"
                  type="text" value="${(auth.attemptedUsername!'')}" autofocus
                  autocomplete="username" dir="ltr"
                  placeholder="votre@email.com" />
              </div>

              <div id="kc-form-options" class="form-actions">
                <button tabindex="2" name="login" id="kc-reset-password" type="submit" class="btn-primary">
                  Envoyer le lien de réinitialisation
                </button>
              </div>

            </form>

            <div class="register-section">
              <span>Mot de passe retrouvé ?</span>
              <a tabindex="3" href="${url.loginUrl}" class="btn-secondary">Se connecter</a>
            </div>

          </div>
        </div>
    </#if>
</@layout.registrationLayout>
