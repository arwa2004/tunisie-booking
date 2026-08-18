<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
        <div class="brand-header">
            <div class="brand-logo-card">
                <img src="${url.resourcesPath}/img/logo.png" alt="Tunisie Booking" class="brand-logo-img"/>
            </div>
        </div>

    <#elseif section = "form">
        
          <div id="kc-registration">

            <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
              <div class="alert alert-${message.type}">
                ${kcSanitize(message.summary)?no_esc}
              </div>
            </#if>

            <form id="kc-register-form" action="${url.registrationAction}" method="post">

              <#if !realm.registrationEmailAsUsername>
                <div class="form-grid-2col">
                  <div class="form-group">
                    <label for="firstName" class="form-label">Prénom</label>
                    <input tabindex="1" id="firstName" class="form-input" name="firstName"
                      type="text" value="${(register.formData.firstName!'')}"
                      autocomplete="given-name"
                      placeholder="Votre prénom" />
                  </div>

                  <div class="form-group">
                    <label for="lastName" class="form-label">Nom</label>
                    <input tabindex="2" id="lastName" class="form-input" name="lastName"
                      type="text" value="${(register.formData.lastName!'')}"
                      autocomplete="family-name"
                      placeholder="Votre nom" />
                  </div>
                </div>
              </#if>

              <div class="form-grid-2col">
                <div class="form-group">
                  <label for="email" class="form-label">Email</label>
                  <input tabindex="3" id="email" class="form-input" name="email"
                    type="text" value="${(register.formData.email!'')}"
                    autocomplete="email"
                    placeholder="votre@email.com" />
                </div>

                <#if !realm.registrationEmailAsUsername>
                  <div class="form-group">
                    <label for="username" class="form-label">Nom d'utilisateur</label>
                    <input tabindex="4" id="username" class="form-input" name="username"
                      type="text" value="${(register.formData.username!'')}"
                      autocomplete="username"
                      placeholder="Votre nom d'utilisateur" />
                  </div>
                </#if>
              </div>

              <#if passwordRequired??>
                <div class="form-grid-2col">
                  <div class="form-group">
                    <label for="password" class="form-label">Mot de passe</label>
                    <input tabindex="5" id="password" class="form-input" name="password"
                      type="password" autocomplete="new-password"
                      placeholder="••••••••••••" />
                  </div>

                  <div class="form-group">
                    <label for="password-confirm" class="form-label">Confirmer le mot de passe</label>
                    <input tabindex="6" id="password-confirm" class="form-input" name="password-confirm"
                      type="password" autocomplete="new-password"
                      placeholder="••••••••••••" />
                  </div>
                </div>
              </#if>

              <#if recaptchaRequired??>
                <div class="form-group">
                  <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}"></div>
                </div>
              </#if>

              <div id="kc-form-options" class="form-actions">
                <button tabindex="7" id="kc-register" name="register" type="submit" class="btn-primary">
                  Créer mon compte
                </button>
              </div>

            </form>

            <div class="register-section">
              <span>Déjà un compte ?</span>
              <a tabindex="8" href="${url.loginUrl}" class="btn-secondary">Se connecter</a>
            </div>

          </div>
    </#if>
</@layout.registrationLayout>
