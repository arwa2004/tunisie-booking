<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('password','password-confirm'); section>
    <#if section = "header">
        <div class="brand-header">
            <div class="brand-logo-card">
                <img src="${url.resourcesPath}/img/logo.png" alt="Tunisie Booking" class="brand-logo-img"/>
            </div>
        </div>

    <#elseif section = "form">
        <div id="kc-update-password-form">
          <div id="kc-form-wrapper">

            <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
              <div class="alert alert-${message.type}">
                ${kcSanitize(message.summary)?no_esc}
              </div>
            </#if>

            <form id="kc-passwd-update-form" action="${url.loginAction}" method="post">

              <input type="text" id="username" name="username" value="${username}" autocomplete="username" readonly="readonly" style="display:none;" />

              <div class="form-group">
                <label for="password-new" class="form-label">Nouveau mot de passe</label>
                <input tabindex="1" id="password-new" class="form-input" name="password-new"
                  type="password" autofocus autocomplete="new-password"
                  placeholder="••••••••••••" />
              </div>

              <div class="form-group">
                <label for="password-confirm" class="form-label">Confirmer le nouveau mot de passe</label>
                <input tabindex="2" id="password-confirm" class="form-input" name="password-confirm"
                  type="password" autocomplete="new-password"
                  placeholder="••••••••••••" />
              </div>

              <#if passwordMinLength?? && passwordMaxLength?? && (passwordMaxLength gt passwordMinLength)>
                <p class="password-hint">
                  Le mot de passe doit contenir entre ${passwordMinLength} et ${passwordMaxLength} caractères.
                </p>
              <#elseif passwordMinLength??>
                <p class="password-hint">
                  Le mot de passe doit contenir au moins ${passwordMinLength} caractères.
                </p>
              </#if>

              <div id="kc-form-options" class="form-actions">
                <button tabindex="3" id="kc-passwd-update-btn" name="login" type="submit" class="btn-primary">
                  Mettre à jour le mot de passe
                </button>
              </div>

              <div class="register-section">
                <span>Mot de passe retrouvé ?</span>
                <a tabindex="4" href="${url.loginUrl}" class="btn-secondary">Se connecter</a>
              </div>

            </form>

          </div>
        </div>
    </#if>
</@layout.registrationLayout>
