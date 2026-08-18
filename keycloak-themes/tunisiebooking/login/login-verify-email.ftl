<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true; section>
    <#if section = "header">
        <div class="brand-header">
            <div class="brand-logo-card">
                <img src="${url.resourcesPath}/img/logo.png" alt="Tunisie Booking" class="brand-logo-img"/>
            </div>
        </div>

    <#elseif section = "form">
        <div id="kc-verify-email-form">
          <div id="kc-form-wrapper">

            <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
              <div class="alert alert-${message.type}">
                ${kcSanitize(message.summary)?no_esc}
              </div>
            </#if>

            <p class="reset-instruction">
              Nous avons envoyé un code de vérification à votre adresse email.
              Saisissez-le ci-dessous pour continuer.
            </p>

            <form id="kc-verify-email-form" action="${url.loginAction}" method="post">

              <div class="form-group">
                <label for="code" class="form-label">Code de vérification</label>
                <input tabindex="1" id="code" class="form-input" name="code"
                  type="text" autofocus autocomplete="one-time-code"
                  placeholder="Entrez votre code à 6 chiffres"
                  aria-invalid="<#if messagesPerField.existsError('code')>true</#if>" />
                <#if messagesPerField.existsError('code')>
                  <span class="field-error">${kcSanitize(messagesPerField.get('code'))?no_esc}</span>
                </#if>
              </div>

              <div id="kc-form-options" class="form-actions">
                <button tabindex="2" name="login" id="kc-verify-email-btn" type="submit" class="btn-primary">
                  Vérifier mon email
                </button>
              </div>

            </form>

            <div class="register-section">
              <span>Vous n'avez pas reçu le code ?</span>
              <a tabindex="3" href="${url.loginAction}&resend=true" class="btn-secondary">Renvoyer le code</a>
            </div>

          </div>
        </div>
    </#if>
</@layout.registrationLayout>
