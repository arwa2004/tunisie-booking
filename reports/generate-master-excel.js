/**
 * generate-master-excel.js
 * 
 * Lit les fichiers PHP test (Feature + Unit) + les fichiers Jest (.test.tsx)
 * et genere un fichier Excel MAITRE avec leurs donnees extraites.
 * 
 * Chaque domaine a sa propre feuille avec ses colonnes specifiques.
 * 
 * Utilisation :
 *   node reports/generate-master-excel.js
 *   => Genere reports/plan-de-test-maitre.xlsx
 */

const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

// --- Config ---------------------------------------------------------------
const PHP_TESTS_DIR = path.resolve(__dirname, "../server/tests");
const CLIENT_TESTS_DIR = path.resolve(__dirname, "../client/__tests__");
const OUTPUT = path.resolve(__dirname, "plan-de-test-maitre.xlsx");

// --- Helpers --------------------------------------------------------------

function getDomainFromFileName(fileName) {
  var domainMap = {
    "Auth": "Auth", "Profil": "Profil", "Hotel": "Hotel",
    "Chambre": "Chambre", "Reservation": "Reservation",
    "ReservationAdmin": "ReservationAdmin", "Favori": "Favori",
    "Avis": "Avis", "Destination": "Destination", "Voyage": "Voyage"
  };
  for (var key in domainMap) {
    if (fileName.indexOf(key) > -1) return domainMap[key];
  }
  return "";
}

// Human-readable test scenarios based on method name
var TEST_SCENARIOS = {
  // Auth
  "register_returns_token": {
    action: "Aller sur la page d'inscription. Remplir nom, prénom, email, téléphone et mot de passe. Cliquer sur 'Créer mon compte'.",
    expected: "Compte créé avec succès. Token d'authentification reçu. Redirection vers la page d'accueil."
  },
  "login_correct_returns_200": {
    action: "Aller sur la page de connexion. Saisir email et mot de passe corrects. Cliquer sur 'Se connecter'.",
    expected: "Connexion réussie. Token d'authentification reçu. Redirection vers la page d'accueil."
  },
  "login_wrong_password_returns_401": {
    action: "Aller sur la page de connexion. Saisir email correct et mot de passe incorrect. Cliquer sur 'Se connecter'.",
    expected: "Message d'erreur : 'Identifiants incorrects'. L'utilisateur reste sur la page de connexion."
  },
  "logout_revokes_token": {
    action: "Cliquer sur le bouton 'Déconnexion' dans le menu utilisateur.",
    expected: "Session terminée. Token révoqué. Redirection vers la page d'accueil."
  },
  // Profil
  "me_returns_authenticated_user": {
    action: "Aller sur la page 'Mon Profil'. Vérifier les informations affichées.",
    expected: "Les informations de l'utilisateur connecté sont affichées : email, nom, prénom."
  },
  "update_profile_updates_correctly": {
    action: "Aller sur la page 'Mon Profil'. Modifier le nom, prénom, téléphone. Cliquer sur 'Enregistrer'.",
    expected: "Profil mis à jour avec les nouvelles informations. Message de confirmation affiché."
  },
  "update_password_wrong_current_returns_422": {
    action: "Aller sur la page 'Sécurité'. Saisir un ancien mot de passe incorrect.",
    expected: "Message d'erreur : 'Le mot de passe actuel est incorrect'."
  },
  // Hotel
  "get_hotels_returns_list": {
    action: "Aller sur la page /hotels.",
    expected: "La liste des hôtels disponibles s'affiche avec leurs noms, prix, étoiles et images."
  },
  "get_hotel_by_id_returns_correct_hotel": {
    action: "Cliquer sur un hôtel dans la liste.",
    expected: "Page de détail de l'hôtel : photos, description, chambres disponibles, avis et formulaire de réservation."
  },
  "get_hotel_inexistant_returns_404": {
    action: "Accéder à l'URL d'un hôtel avec un ID inexistant (ex: /hotels/9999).",
    expected: "Message 'Hôtel introuvable' ou erreur 404."
  },
  "create_hotel_without_token_returns_401": {
    action: "Tenter d'ajouter un nouvel hôtel sans être authentifié.",
    expected: "Erreur 401 : non autorisé. Redirection vers la page de connexion."
  },
  "create_hotel_with_token_returns_201": {
    action: "En tant qu'administrateur, remplir le formulaire d'ajout d'hôtel (nom, prix, étoiles, destination). Cliquer sur 'Créer'.",
    expected: "Hôtel créé avec succès. Message de confirmation affiché."
  },
  // Chambre
  "get_chambres_returns_list": {
    action: "Ouvrir la page de détail d'un hôtel > section 'Chambres disponibles'.",
    expected: "Liste des types de chambres : type, prix par nuit, capacité adultes/enfants."
  },
  "get_chambre_inexistante_returns_404": {
    action: "Accéder à l'URL d'une chambre avec un ID inexistant.",
    expected: "Message 'Chambre introuvable' ou erreur 404."
  },
  "create_chambre_without_token_returns_401": {
    action: "Tenter d'ajouter une chambre sans être authentifié.",
    expected: "Erreur 401 : non autorisé."
  },
  "create_chambre_valid_returns_201": {
    action: "Admin : remplir le formulaire d'ajout de chambre (type, nom, prix, capacité). Cliquer sur 'Ajouter'.",
    expected: "Chambre créée avec succès. Visible dans la liste des chambres de l'hôtel."
  },
  "update_chambre_prix_returns_200": {
    action: "Admin : modifier le prix d'une chambre existante.",
    expected: "Chambre modifiée avec succès. Nouveau prix affiché."
  },
  "delete_chambre_returns_200": {
    action: "Admin : supprimer une chambre.",
    expected: "Chambre supprimée. Message de confirmation. La chambre n'apparaît plus dans la liste."
  },
  // Reservation
  "create_reservation_without_token_returns_401": {
    action: "Tenter d'effectuer une réservation sans être connecté.",
    expected: "Erreur 401 : non autorisé. Redirection vers la page de connexion."
  },
  "create_reservation_with_invalid_data_returns_422": {
    action: "Remplir le formulaire de réservation avec un hôtel inexistant ou des données invalides.",
    expected: "Message d'erreur : données invalides. La réservation n'est pas créée."
  },
  "create_reservation_valid_returns_201_with_prix": {
    action: "Sélectionner un hôtel, choisir dates d'arrivée/départ, type de chambre, pension. Cliquer sur 'Réserver'.",
    expected: "Réservation créée. Prix total calculé automatiquement. Statut : 'En attente'."
  },
  "create_reservation_chambre_wrong_hotel_returns_422": {
    action: "Sélectionner une chambre qui n'appartient pas à l'hôtel choisi.",
    expected: "Message d'erreur : 'La chambre sélectionnée n'appartient pas à cet hôtel'."
  },
  "create_reservation_capacite_insuffisante_returns_422": {
    action: "Réserver avec un nombre d'adultes supérieur à la capacité de la chambre.",
    expected: "Message d'erreur : capacité insuffisante pour le nombre d'adultes."
  },
  // Favori
  "unauthorized_user_cannot_access_favoris": {
    action: "Cliquer sur l'icône cœur ou accéder à la page des favoris sans être connecté.",
    expected: "Redirection vers la page de connexion ou message 'Non autorisé'."
  },
  "user_can_toggle_hotel_favori": {
    action: "Sur la page d'un hôtel, cliquer sur l'icône cœur pour ajouter/retirer des favoris.",
    expected: "Le cœur se remplit (ajouté) ou se vide (retiré). La page des favoris se met à jour."
  },
  "user_can_get_favoris_list": {
    action: "Aller sur la page 'Mes favoris'.",
    expected: "Liste des hôtels favoris affichée avec leurs informations."
  },
  // Avis
  "get_avis_returns_list_and_stats": {
    action: "Ouvrir la section 'Avis' sur la page d'un hôtel.",
    expected: "Avis affichés avec notes, commentaires et statistiques (note moyenne, % recommandation)."
  },
  "post_avis_without_token_returns_401": {
    action: "Tenter de poster un avis sans être connecté.",
    expected: "Erreur 401 : non autorisé. Redirection vers la page de connexion."
  },
  "post_avis_with_token_creates_or_updates": {
    action: "Cliquer sur 'Laisser mon avis'. Donner une note et écrire un commentaire. Publier.",
    expected: "Avis publié. Il apparaît dans la section des avis de l'hôtel."
  },
  "post_avis_invalid_notes_returns_422": {
    action: "Soumettre un avis avec une note invalide (ex: 12/10).",
    expected: "Message d'erreur : note invalide. L'avis n'est pas publié."
  },
  "delete_avis_authorized": {
    action: "Supprimer un avis que l'on a posté.",
    expected: "Avis supprimé. Il n'apparaît plus dans la liste."
  },
  // Destination
  "hasNom_retourne_true_si_nom_renseigne": {
    action: "Vérification métier : une destination avec un nom renseigné.",
    expected: "La destination est considérée comme ayant un nom valide."
  },
  "hasNom_retourne_false_si_nom_vide": {
    action: "Vérification métier : une destination avec un nom vide.",
    expected: "La destination est considérée comme n'ayant pas de nom valide."
  },
  "hasNom_retourne_false_si_nom_manquant": {
    action: "Vérification métier : une destination sans attribut nom.",
    expected: "La destination est considérée comme n'ayant pas de nom."
  },
  "hasRegion_retourne_true_si_region_renseignee": {
    action: "Vérification métier : une destination avec une région renseignée.",
    expected: "La destination est considérée comme ayant une région valide."
  },
  "hasRegion_retourne_false_si_region_vide": {
    action: "Vérification métier : une destination avec une région vide.",
    expected: "La destination est considérée comme n'ayant pas de région."
  },
  "getNomComplet_retourne_format_correct": {
    action: "Vérification métier : affichage du nom complet d'une destination.",
    expected: "Le nom complet s'affiche au format 'Nom (Région)'."
  },
  // Voyage
  "isPrixValide_retourne_true_pour_prix_positif": {
    action: "Vérification métier : un voyage avec un prix positif.",
    expected: "Le prix est considéré comme valide."
  },
  "isPrixValide_retourne_false_pour_prix_zero": {
    action: "Vérification métier : un voyage avec un prix de zéro.",
    expected: "Le prix est considéré comme invalide."
  },
  "isPrixValide_retourne_false_pour_prix_negatif": {
    action: "Vérification métier : un voyage avec un prix négatif.",
    expected: "Le prix est considéré comme invalide."
  },
  "isDureeValide_retourne_true_pour_un_jour": {
    action: "Vérification métier : un voyage d'une durée d'un jour.",
    expected: "La durée est considérée comme valide."
  },
  "isDureeValide_retourne_true_pour_une_semaine": {
    action: "Vérification métier : un voyage d'une durée d'une semaine.",
    expected: "La durée est considérée comme valide."
  },
  "isDureeValide_retourne_false_pour_zero_jour": {
    action: "Vérification métier : un voyage d'une durée de zéro jour.",
    expected: "La durée est considérée comme invalide."
  },
  "getDureeLabel_retourne_un_jour_au_singulier": {
    action: "Vérification métier : affichage de la durée pour 1 jour.",
    expected: "La durée s'affiche au singulier : '1 jour'."
  },
  "getDureeLabel_retourne_pluriel_pour_plusieurs_jours": {
    action: "Vérification métier : affichage de la durée pour plusieurs jours.",
    expected: "La durée s'affiche au pluriel : 'X jours'."
  },
  // Arrivee/Depart (Unit Reservation)
  "getNbNuits_retourne_nombre_correct": {
    action: "Calcul métier : nombre de nuits entre deux dates.",
    expected: "Le nombre de nuits est calculé correctement (ex: du 1er au 5 = 4 nuits)."
  },
  "getNbNuits_retourne_zero_si_meme_date": {
    action: "Calcul métier : nombre de nuits pour des dates identiques.",
    expected: "0 nuits (pas de séjour)."
  },
  "getNbNuits_retourne_zero_si_depart_avant_arrivee": {
    action: "Calcul métier : nombre de nuits si départ avant arrivée.",
    expected: "0 nuits (dates incohérentes)."
  },
  "getNbNuits_retourne_zero_si_dates_manquantes": {
    action: "Calcul métier : nombre de nuits sans dates fournies.",
    expected: "0 nuits."
  },
  "calculatePrixTotal_correct_sans_enfants": {
    action: "Calcul métier : prix total d'une réservation sans enfants.",
    expected: "Prix correct : base × nuits × chambres."
  },
  "calculatePrixTotal_avec_enfants_de_differents_ages": {
    action: "Calcul métier : prix total avec enfants de différents âges.",
    expected: "Prix incluant les suppléments enfants (gratuit <2 ans, tarif réduit 2-12 ans, plein tarif >12 ans)."
  },
  "calculatePrixTotal_une_nuit_une_chambre_sans_enfants": {
    action: "Calcul métier : prix pour une nuit, une chambre, sans enfants.",
    expected: "Prix = prix de base × 1."
  },
  "calculatePrixTotal_zero_si_meme_date": {
    action: "Calcul métier : prix total si arrivée = départ.",
    expected: "0 DT (pas de séjour)."
  },
  // Statuts
  "isStatutValide_retourne_true_pour_en_attente": {
    action: "Vérification métier : validation du statut 'en_attente'.",
    expected: "Le statut 'en_attente' est considéré comme valide."
  },
  "isStatutValide_retourne_true_pour_confirmee": {
    action: "Vérification métier : validation du statut 'confirmée'.",
    expected: "Le statut 'confirmée' est considéré comme valide."
  },
  "isStatutValide_retourne_true_pour_annulee": {
    action: "Vérification métier : validation du statut 'annulée'.",
    expected: "Le statut 'annulée' est considéré comme valide."
  },
  "isStatutValide_retourne_false_pour_statut_inconnu": {
    action: "Vérification métier : validation d'un statut inconnu (ex: 'payée').",
    expected: "Le statut inconnu est considéré comme invalide."
  },
  "canTransitionTo_en_attente_vers_confirmee": {
    action: "Vérification métier : transition possible de 'en_attente' vers 'confirmée'.",
    expected: "La transition est autorisée."
  },
  "canTransitionTo_en_attente_vers_annulee": {
    action: "Vérification métier : transition possible de 'en_attente' vers 'annulée'.",
    expected: "La transition est autorisée."
  },
  "canTransitionTo_annulee_est_etat_terminal": {
    action: "Vérification métier : transition depuis le statut 'annulée'.",
    expected: "Aucune transition n'est autorisée depuis 'annulée' (état terminal)."
  },
  "canTransitionTo_retourne_false_pour_statut_invalide": {
    action: "Vérification métier : transition vers un statut invalide.",
    expected: "La transition est refusée."
  },
  "getStatutsValides_contient_les_trois_statuts": {
    action: "Vérification métier : liste des statuts valides.",
    expected: "Les 3 statuts valides sont : en_attente, confirmée, annulée."
  },
  // Hotel Unit
  "isDisponible_retourne_true_quand_disponible": {
    action: "Vérification métier : disponibilité d'un hôtel marqué comme disponible.",
    expected: "L'hôtel est considéré comme disponible."
  },
  "isDisponible_retourne_false_quand_indisponible": {
    action: "Vérification métier : disponibilité d'un hôtel marqué comme indisponible.",
    expected: "L'hôtel est considéré comme indisponible."
  },
  "isEtoilesValide_retourne_true_pour_1_a_5": {
    action: "Vérification métier : validation du nombre d'étoiles (1 à 5).",
    expected: "Les notes de 1 à 5 étoiles sont considérées comme valides."
  },
  "isEtoilesValide_retourne_false_pour_zero": {
    action: "Vérification métier : validation de 0 étoile.",
    expected: "0 étoile est considéré comme invalide."
  },
  "isEtoilesValide_retourne_false_pour_six": {
    action: "Vérification métier : validation de 6 étoiles.",
    expected: "6 étoiles est considéré comme invalide."
  },
  "isPrixValide_retourne_true_pour_prix_positif": {
    action: "Vérification métier : validation d'un prix positif.",
    expected: "Le prix positif est considéré comme valide."
  },
  "isPrixValide_retourne_false_pour_prix_zero": {
    action: "Vérification métier : validation d'un prix à zéro.",
    expected: "Le prix zéro est considéré comme invalide."
  },
  "isPrixValide_retourne_false_pour_prix_negatif": {
    action: "Vérification métier : validation d'un prix négatif.",
    expected: "Le prix négatif est considéré comme invalide."
  },
  // Pension
  "get_pensions_returns_list": {
    action: "Sur la page de réservation d'un hôtel, ouvrir le sélecteur de pension.",
    expected: "Options de pension affichées avec leurs suppléments de prix."
  }
};

function getScenarioKey(methodName) {
  return methodName.replace(/^test_?/i, "");
}

function describeMethod(methodName) {
  var key = getScenarioKey(methodName);
  if (TEST_SCENARIOS[key]) {
    return TEST_SCENARIOS[key].action + " => " + TEST_SCENARIOS[key].expected;
  }
  return methodName
    .replace(/^test_?/i, "").replace(/_/g, " ")
    .replace(/\s+/g, " ").trim().toLowerCase()
    .replace(/^\w/, function(c) { return c.toUpperCase(); });
}

function getActionForMethod(methodName) {
  var key = getScenarioKey(methodName);
  if (TEST_SCENARIOS[key]) return TEST_SCENARIOS[key].action;
  return methodName.replace(/^test_?/i, "").replace(/_/g, " ");
}

function getExpectedForMethod(methodName) {
  var key = getScenarioKey(methodName);
  if (TEST_SCENARIOS[key]) return TEST_SCENARIOS[key].expected;
  return "Comportement attendu.";
}

function extractValue(body, key) {
  var regex = new RegExp("'" + key + "'\\s*=>\\s*(?:'([^']*)'|\"([^\"]*)\"|(\\d+(?:\\.\\d+)?))");
  var m = regex.exec(body);
  if (m) return m[1] || m[2] || m[3];
  return "";
}

// Extract from setRawAttributes(['nom' => 'Tunis', 'region' => 'Grand Tunis'])
function extractRawAttr(body, key) {
  var arrMatch = /setRawAttributes\(\[([\s\S]*?)\]\)/.exec(body);
  if (!arrMatch) arrMatch = /makeDestination\(\[([\s\S]*?)\]\)/.exec(body);
  if (!arrMatch) arrMatch = /makeVoyage\(\[([\s\S]*?)\]\)/.exec(body);
  if (!arrMatch) return "";
  return extractValue(arrMatch[1], key);
}

function extractBcryptPwd(body) {
  var m = /bcrypt\([']([^']+)[']\)/.exec(body);
  return m ? m[1] : "";
}

function extractFromFactoryCreate(body) {
  var m = /User::factory\(\)->create\(\[\s*'email'\s*=>\s*'([^']+)'/.exec(body);
  return m ? m[1] : "";
}

function extractFromPostJson(body, key) {
  var m = new RegExp("(?:postJson|putJson)\\([^,]+,\\s*\\[[\\s\\S]*?'" + key + "'\\s*=>\\s*'([^']+)'").exec(body);
  return m ? m[1] : "";
}

function walkPhpTests(dir) {
  var results = [];
  if (!fs.existsSync(dir)) return results;
  var entries = fs.readdirSync(dir, { withFileTypes: true });
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walkPhpTests(fullPath));
    } else if (entry.name.indexOf("Test.php") > -1 && entry.name !== "ExampleTest.php" && entry.name !== "TestCase.php") {
      results.push(fullPath);
    }
  }
  return results;
}

function extractPhpTestMethods(filePath) {
  var content = fs.readFileSync(filePath, "utf-8");
  var fileName = path.basename(filePath);
  var methods = [];
  
  var methodRegex = /public function (test_\w+)\s*\([^)]*\)\s*(?::\s*\w+\s*)?\{/g;
  var m;
  
  while ((m = methodRegex.exec(content)) !== null) {
    var methodName = m[1];
    var bodyStart = m.index + m[0].length;
    var depth = 1;
    var i = bodyStart;
    while (i < content.length && depth > 0) {
      if (content[i] === '{') depth++;
      if (content[i] === '}') depth--;
      i++;
    }
    var body = content.substring(bodyStart, i - 1);
    
    // Extract email from multiple sources
    var email = "";
    var ef = extractFromFactoryCreate(body);
    var ep = extractFromPostJson(body, 'email');
    var ev = extractValue(body, 'email');
    if (ef) email = ef;
    else if (ep) email = ep;
    else if (ev) email = ev;
    else if (/\$user->email/.test(body)) email = "(email de l'utilisateur connecte)";
    
    // Extract nom from multiple sources
    var nom = extractRawAttr(body, 'nom') || extractFromPostJson(body, 'nom') || extractValue(body, 'nom') || "";
    
    // Extract region from setRawAttributes
    var region = extractRawAttr(body, 'region') || "";
    
    // Extract duree/prix from setRawAttributes (Voyage)
    var duree = extractRawAttr(body, 'duree') || "";
    var prix = extractRawAttr(body, 'prix') || extractValue(body, 'prix') || "";
    
    // Extract hotel name from createHotel helper
    var hotelNom = /'nom'\s*=>\s*'([^']+)'/.exec(body);
    var hotelNomStr = hotelNom ? hotelNom[1] : "";
    
    // Extract hotel_id from postJson path
    var hotelIdMatch = /postJson\("\/api\/favoris\/(\d+)"\)/.exec(body);
    var hotelId = hotelIdMatch ? hotelIdMatch[1] : "";
    
    // Extract etoiles/prix_par_nuit from Hotel::create or createHotel
    var etoiles = extractValue(body, 'etoiles') || "";
    var prix_par_nuit = extractValue(body, 'prix_par_nuit') || "";
    
methods.push({
      fileName: fileName,
      methodName: methodName,
      description: describeMethod(methodName),
      action: getActionForMethod(methodName),
      expected: getExpectedForMethod(methodName),
      statut_technique: "Non execute",
      statut_manuel: "Non teste",
      email: email,
      password: extractBcryptPwd(body) || extractValue(body, 'password') || "",
      nom: nom,
      prenom: extractValue(body, 'prenom') || extractFromPostJson(body, 'prenom') || "",
      telephone: extractValue(body, 'telephone') || extractFromPostJson(body, 'telephone') || "",
      date_arrivee: extractValue(body, 'date_arrivee') || "",
      date_depart: extractValue(body, 'date_depart') || "",
      nb_chambres: extractValue(body, 'nb_chambres') || "",
      nb_adultes: extractValue(body, 'nb_adultes') || "",
      nb_enfants: extractValue(body, 'nb_enfants') || "",
      ages_enfants: extractValue(body, 'ages_enfants') || "",
      prix_base_nuit: extractValue(body, 'prix_base_nuit') || "",
      prix_total: extractValue(body, 'prix_total') || "",
      type_chambre: extractValue(body, 'type') || "",
      nom_chambre: extractValue(body, 'nom') || "",
      capacite_adultes: extractValue(body, 'capacite_adultes') || "",
      capacite_enfants: extractValue(body, 'capacite_enfants') || "",
      quantite: extractValue(body, 'quantite') || "",
      prix_par_nuit: prix_par_nuit || prix || "",
      etoiles: etoiles,
      disponible: extractValue(body, 'disponible') || "",
      note_globale: extractValue(body, 'note_globale') || "",
      commentaire: extractValue(body, 'commentaire') || "",
      hotel_id: extractValue(body, 'hotel_id') || hotelId || "",
      chambre_id: extractValue(body, 'chambre_id') || "",
      pension_id: extractValue(body, 'pension_id') || "",
      // Destination specific
      region: region,
      destination_nom: nom || "",
      // Voyage specific
      duree: duree,
      prix_voyage: prix,
      // Favori specific
      hotel_nom: hotelNomStr
    });
  }
  
  return methods;
}

// --- Client TSX Test Helpers ----------------------------------------------

function walkClientTests(dir) {
  var results = [];
  if (!fs.existsSync(dir)) return results;
  var entries = fs.readdirSync(dir, { withFileTypes: true });
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walkClientTests(fullPath));
    } else if (entry.name.indexOf(".test.tsx") > -1 || entry.name.indexOf(".test.ts") > -1 || entry.name.indexOf(".test.js") > -1) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractClientTestMethods(filePath) {
  var content = fs.readFileSync(filePath, "utf-8");
  var methods = [];
  var testRegex = /(?:test|it)\(['"]([^'"]+)['"]/g;
  var m;
  while ((m = testRegex.exec(content)) !== null) {
    methods.push({ description: m[1] });
  }
  return methods;
}

function getDomainFromClientFile(fileName) {
  if (fileName.indexOf("LoginForm") > -1 || fileName.indexOf("RegisterPage") > -1) return "Client_Auth";
  if (fileName.indexOf("HotelCard") > -1 || fileName.indexOf("SearchForm") > -1 || fileName.indexOf("ChambreSelector") > -1) return "Client_Hotel";
  if (fileName.indexOf("ReservationForm") > -1) return "Client_Reservation";
  return "Client_Autres";
}

// --- Column definitions per domain ---

var PHP_COLUMNS = {
  "Auth": {
    cols: [
      { key: "action", label: "Action_Utilisateur" },
      { key: "expected", label: "Resultat_Attendu" },
      { key: "email", label: "Email" },
      { key: "password", label: "Password" },
      { key: "nom", label: "Nom" },
      { key: "prenom", label: "Prenom" },
      { key: "telephone", label: "Telephone" },
      { key: "statut_technique", label: "Statut_Technique" },
      { key: "statut_manuel", label: "Statut_Manuel" }
    ],
    widths: [60, 50, 25, 20, 15, 15, 18, 16, 16]
  },
  "Profil": {
    cols: [
      { key: "action", label: "Action_Utilisateur" },
      { key: "expected", label: "Resultat_Attendu" },
      { key: "email", label: "Email" },
      { key: "nom", label: "Nom" },
      { key: "prenom", label: "Prenom" },
      { key: "telephone", label: "Telephone" },
      { key: "statut_technique", label: "Statut_Technique" },
      { key: "statut_manuel", label: "Statut_Manuel" }
    ],
    widths: [60, 50, 25, 15, 15, 18, 16, 16]
  },
  "Hotel": {
    cols: [
      { key: "action", label: "Action_Utilisateur" },
      { key: "expected", label: "Resultat_Attendu" },
      { key: "email", label: "Email" },
      { key: "nom", label: "Nom_Hotel" },
      { key: "prix_par_nuit", label: "Prix_Nuit" },
      { key: "etoiles", label: "Etoiles" },
      { key: "disponible", label: "Disponible" },
      { key: "statut_technique", label: "Statut_Technique" },
      { key: "statut_manuel", label: "Statut_Manuel" }
    ],
    widths: [60, 50, 25, 25, 14, 10, 12, 16, 16]
  },
  "Chambre": {
    cols: [
      { key: "action", label: "Action_Utilisateur" },
      { key: "expected", label: "Resultat_Attendu" },
      { key: "type_chambre", label: "Type_Chambre" },
      { key: "nom_chambre", label: "Nom_Chambre" },
      { key: "capacite_adultes", label: "Cap_Adultes" },
      { key: "capacite_enfants", label: "Cap_Enfants" },
      { key: "quantite", label: "Quantite" },
      { key: "prix_base_nuit", label: "Prix_Base_Nuit" },
      { key: "statut_technique", label: "Statut_Technique" },
      { key: "statut_manuel", label: "Statut_Manuel" }
    ],
    widths: [60, 50, 15, 25, 14, 14, 10, 14, 16, 16]
  },
  "Reservation": {
    cols: [
      { key: "action", label: "Action_Utilisateur" },
      { key: "expected", label: "Resultat_Attendu" },
      { key: "email", label: "Email" },
      { key: "date_arrivee", label: "Arrivee" },
      { key: "date_depart", label: "Depart" },
      { key: "nb_chambres", label: "Nb_Chambres" },
      { key: "nb_adultes", label: "Adultes" },
      { key: "nb_enfants", label: "Enfants" },
      { key: "ages_enfants", label: "Ages_Enfants" },
      { key: "prix_total", label: "Prix_Total" },
      { key: "chambre_id", label: "Chambre_ID" },
      { key: "pension_id", label: "Pension_ID" },
      { key: "statut_technique", label: "Statut_Technique" },
      { key: "statut_manuel", label: "Statut_Manuel" }
    ],
    widths: [60, 50, 25, 14, 14, 12, 10, 10, 15, 14, 12, 12, 16, 16]
  },
  "ReservationAdmin": {
    cols: [
      { key: "action", label: "Action_Utilisateur" },
      { key: "expected", label: "Resultat_Attendu" },
      { key: "email", label: "Email" },
      { key: "date_arrivee", label: "Arrivee" },
      { key: "date_depart", label: "Depart" },
      { key: "prix_total", label: "Prix_Total" },
      { key: "statut_technique", label: "Statut_Technique" },
      { key: "statut_manuel", label: "Statut_Manuel" }
    ],
    widths: [60, 50, 25, 14, 14, 14, 16, 16]
  },
  "Favori": {
    cols: [
      { key: "action", label: "Action_Utilisateur" },
      { key: "expected", label: "Resultat_Attendu" },
      { key: "email", label: "Email" },
      { key: "hotel_id", label: "Hotel_ID" },
      { key: "hotel_nom", label: "Nom_Hotel" },
      { key: "statut_technique", label: "Statut_Technique" },
      { key: "statut_manuel", label: "Statut_Manuel" }
    ],
    widths: [60, 50, 25, 12, 25, 16, 16]
  },
  "Avis": {
    cols: [
      { key: "action", label: "Action_Utilisateur" },
      { key: "expected", label: "Resultat_Attendu" },
      { key: "email", label: "Email" },
      { key: "hotel_id", label: "Hotel_ID" },
      { key: "note_globale", label: "Note" },
      { key: "commentaire", label: "Commentaire" },
      { key: "statut_technique", label: "Statut_Technique" },
      { key: "statut_manuel", label: "Statut_Manuel" }
    ],
    widths: [60, 50, 25, 12, 10, 30, 16, 16]
  },
  "Destination": {
    cols: [
      { key: "action", label: "Action_Utilisateur" },
      { key: "expected", label: "Resultat_Attendu" },
      { key: "destination_nom", label: "Nom_Destination" },
      { key: "region", label: "Region" },
      { key: "statut_technique", label: "Statut_Technique" },
      { key: "statut_manuel", label: "Statut_Manuel" }
    ],
    widths: [60, 50, 25, 20, 16, 16]
  },
  "Voyage": {
    cols: [
      { key: "action", label: "Action_Utilisateur" },
      { key: "expected", label: "Resultat_Attendu" },
      { key: "prix_voyage", label: "Prix_Voyage" },
      { key: "duree", label: "Duree_Jours" },
      { key: "statut_technique", label: "Statut_Technique" },
      { key: "statut_manuel", label: "Statut_Manuel" }
    ],
    widths: [60, 50, 14, 14, 16, 16]
  }
};

var CLIENT_COLUMNS = {
  "Client_Auth": { cols: [{ key: "description", label: "Description" }], widths: [60] },
  "Client_Hotel": { cols: [{ key: "description", label: "Description" }], widths: [60] },
  "Client_Reservation": { cols: [{ key: "description", label: "Description" }], widths: [60] },
  "Client_Autres": { cols: [{ key: "description", label: "Description" }], widths: [60] }
};

// --- Build rows ---

function buildRow(m, domain, isClient) {
  var defs = isClient ? CLIENT_COLUMNS : PHP_COLUMNS;
  var def = defs[domain];
  if (!def) return {};
  var row = {};
  for (var i = 0; i < def.cols.length; i++) {
    var col = def.cols[i];
    var val = m[col.key];
    row[col.label] = (val !== undefined && val !== null && val !== "") ? String(val) : "";
  }
  return row;
}

function addSheet(workbook, sheetName, rows, colDef) {
  if (rows.length === 0) return;
  var ws = xlsx.utils.json_to_sheet(rows);
  ws["!cols"] = (colDef.widths || []).map(function(w) { return { wch: w }; });
  xlsx.utils.book_append_sheet(workbook, ws, sheetName);
}

// --- MAIN ---

function main() {
  var workbook = xlsx.utils.book_new();
  var totalRows = 0;
  
  // PHP tests
  var phpFiles = walkPhpTests(PHP_TESTS_DIR);
  console.log("Fichiers PHP trouves : " + phpFiles.length);
  
  var phpRows = {};
  var domainOrder = ["Auth", "Profil", "Hotel", "Chambre", "Reservation", "ReservationAdmin", "Favori", "Avis", "Destination", "Voyage"];
  
  for (var f = 0; f < phpFiles.length; f++) {
    var filePath = phpFiles[f];
    var methods = extractPhpTestMethods(filePath);
    var fileName = path.basename(filePath);
    var domain = getDomainFromFileName(fileName);
    
    if (!domain || !PHP_COLUMNS[domain]) {
      console.log("Domaine non reconnu pour : " + fileName + " (ignore)");
      continue;
    }
    
    if (!phpRows[domain]) phpRows[domain] = [];
    
    for (var i = 0; i < methods.length; i++) {
      var row = buildRow(methods[i], domain, false);
      phpRows[domain].push(row);
    }
  }
  
  for (var d = 0; d < domainOrder.length; d++) {
    var domain = domainOrder[d];
    if (phpRows[domain] && phpRows[domain].length > 0) {
      addSheet(workbook, domain, phpRows[domain], PHP_COLUMNS[domain]);
      totalRows += phpRows[domain].length;
      console.log("  " + domain + " : " + phpRows[domain].length + " tests");
    }
  }
  
  // Client tests
  var clientFiles = walkClientTests(CLIENT_TESTS_DIR);
  console.log("\nFichiers Client trouves : " + clientFiles.length);
  
  var clientRows = {};
  var clientDomainOrder = ["Client_Auth", "Client_Hotel", "Client_Reservation", "Client_Autres"];
  
  for (var f = 0; f < clientFiles.length; f++) {
    var filePath = clientFiles[f];
    var methods = extractClientTestMethods(filePath);
    var fileName = path.basename(filePath);
    var domain = getDomainFromClientFile(fileName);
    
    if (!domain || !CLIENT_COLUMNS[domain]) continue;
    if (!clientRows[domain]) clientRows[domain] = [];
    
    for (var i = 0; i < methods.length; i++) {
      var row = buildRow(methods[i], domain, true);
      clientRows[domain].push(row);
    }
  }
  
  for (var d = 0; d < clientDomainOrder.length; d++) {
    var domain = clientDomainOrder[d];
    if (clientRows[domain] && clientRows[domain].length > 0) {
      addSheet(workbook, domain, clientRows[domain], CLIENT_COLUMNS[domain]);
      totalRows += clientRows[domain].length;
      console.log("  " + domain + " : " + clientRows[domain].length + " tests");
    }
  }
  
  // Legend
  xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet([
    { Info: "LEGENDE" },
    { Info: "", Detail: "" },
    { Info: "Fichier genere le", Detail: new Date().toLocaleString("fr-FR") },
    { Info: "", Detail: "" },
    { Info: "Feuilles Backend (PHP):", Detail: "Tests PHPUnit (Feature + Unit)" },
    { Info: "Feuilles Frontend (Client):", Detail: "Tests Jest (React/Next.js)" },
    { Info: "", Detail: "" },
    { Info: "Colonne Description:", Detail: "Description lisible du cas de test" }
  ]), "Legende");
  
  xlsx.writeFile(workbook, OUTPUT);
  console.log("\n==============================================");
  console.log("Fichier Excel MAITRE genere : " + OUTPUT);
  console.log("==============================================");
  console.log("Total tests : " + totalRows);
  console.log("Feuilles : " + (Object.keys(phpRows).length + Object.keys(clientRows).length) + " domaines + 1 Legende");
}

main();
