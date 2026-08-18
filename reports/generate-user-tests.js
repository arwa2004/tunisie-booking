/**
 * generate-user-tests.js
 * 
 * Lit les fichiers PHP test (Feature + Unit) et genere un plan de test
 * manuel oriente utilisateur (colones simples : Action, Resultat attendu, Statut).
 * 
 * Usage : node reports/generate-user-tests.js
 */

const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

// --- Config ---------------------------------------------------------------
const TESTS_DIR = path.resolve(__dirname, "../server/tests");
const OUTPUT = path.resolve(__dirname, "plan-test-manuel.xlsx");
var usedOutput = "plan-test-manuel.xlsx";

// --- Helpers --------------------------------------------------------------

function extractValue(body, key) {
  var regex = new RegExp("'" + key + "'\\s*=>\\s*(?:'([^']*)'|\"([^\"]*)\"|(\\d+(?:\\.\\d+)?))");
  var m = regex.exec(body);
  if (m) return m[1] || m[2] || m[3];
  return "";
}

function extractBcryptPwd(body) {
  var m = /bcrypt\\('([^']+)'\\)/.exec(body);
  return m ? m[1] : "";
}

function extractCreateEmail(body) {
  var m = /'email'\\s*=>\\s*'([^']+)'/.exec(body);
  return m ? m[1] : "";
}

function walkTests(dir) {
  var results = [];
  if (!fs.existsSync(dir)) return results;
  var entries = fs.readdirSync(dir, { withFileTypes: true });
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walkTests(fullPath));
    } else if (entry.name.indexOf("Test.php") > -1 && entry.name !== "ExampleTest.php") {
      results.push(fullPath);
    }
  }
  return results;
}

// --- Mapping test method -> user scenario ---------------------------------

function mapToUserScenario(methodName, body, fileInfo) {
  var desc = methodName.replace(/^test_/, "").replace(/_/g, " ");
  
  // Extraire les donnees
  var email = extractCreateEmail(body) || extractValue(body, 'email') || "";
  var password = extractBcryptPwd(body) || extractValue(body, 'password') || "";
  var vals = {};
  var flds = ['nom','prenom','telephone','date_arrivee','date_depart','nb_chambres','nb_adultes','nb_enfants','prix_base_nuit','prix_total','type','quantite','capacite_adultes','capacite_enfants','prix_par_nuit','etoiles','disponible','note_globale','commentaire','age_enfant','ages_enfants','pension_id'];
  for (var i = 0; i < flds.length; i++) {
    vals[flds[i]] = extractValue(body, flds[i]);
  }

  // ---- AUTH ----
  if (methodName.indexOf("register") > -1) {
    return {
      f: "Inscription",
      a: "Aller sur la page d'inscription (/register). Remplir le formulaire avec nom='" + (vals.nom || "Ben Ali") + "', prenom='" + (vals.prenom || "Ahmed") + "', email='" + (email || "email@test.com") + "', telephone='" + (vals.telephone || "+21612345678") + "', mot de passe='" + (password || "Password123") + "'. Cliquer sur 'Creer mon compte'.",
      r: "Compte cree avec succes. Redirige vers la page d'accueil.",
      f2: "Inscription",
      m2: methodName
    };
  }
  if (methodName.indexOf("login_correct") > -1 || (methodName.indexOf("login") > -1 && methodName.indexOf("wrong") < 0 && methodName.indexOf("incorrect") < 0)) {
    return {
      f: "Connexion",
      a: "Aller sur la page de connexion (/login). Entrer email='" + (email || "test@test.com") + "' et mot de passe='" + (password || "Password123") + "'. Cliquer sur 'Se connecter'.",
      r: "Connexion reussie. Redirige vers l'accueil (ou /admin si admin).",
      f2: "Connexion",
      m2: methodName
    };
  }
  if (methodName.indexOf("login_wrong") > -1 || methodName.indexOf("incorrect") > -1) {
    return {
      f: "Connexion - Erreur",
      a: "Aller sur la page de connexion (/login). Entrer email='" + (email || "test@test.com") + "' et mot de passe incorrect. Cliquer sur 'Se connecter'.",
      r: "Message d'erreur : 'Identifiants incorrects'. Pas de redirection.",
      f2: "Connexion",
      m2: methodName
    };
  }
  if (methodName.indexOf("logout") > -1) {
    return {
      f: "Deconnexion",
      a: "Cliquer sur le bouton de deconnexion dans le menu de navigation.",
      r: "Deconnecte. Redirige vers la page d'accueil.",
      f2: "Deconnexion",
      m2: methodName
    };
  }

  // ---- MOT DE PASSE ----
  if (methodName.indexOf("forgot") > -1) {
    return {
      f: "Mot de passe oublie",
      a: "Aller sur la page 'Mot de passe oublie' (/forgot-password). Entrer email='" + (email || "test@test.com") + "'. Cliquer sur 'Envoyer le lien'.",
      r: "Message : 'Email envoye'. Verifier la boite de reception (y compris les spams).",
      f2: "Mot de passe",
      m2: methodName
    };
  }
  if (methodName.indexOf("reset") > -1) {
    return {
      f: "Reinitialisation mot de passe",
      a: "Cliquer sur le lien recu par email. Saisir un nouveau mot de passe et le confirmer.",
      r: "Mot de passe reinitialise. Redirige vers la page de connexion.",
      f2: "Mot de passe",
      m2: methodName
    };
  }

  // ---- PROFIL ----
  if (methodName.indexOf("me_returns") > -1 || methodName.indexOf("me_retourne") > -1 || (methodName.indexOf("me") > -1 && methodName.indexOf("update") < 0)) {
    return {
      f: "Profil - Consultation",
      a: "Aller sur la page profil (/profil).",
      r: "Les informations du compte s'affichent : email='" + (email || "nom@email.com") + "', nom, prenom.",
      f2: "Profil",
      m2: methodName
    };
  }
  if (methodName.indexOf("update_profile") > -1 || (methodName.indexOf("me") > -1 && methodName.indexOf("update") > -1 && methodName.indexOf("password") < 0)) {
    return {
      f: "Profil - Modification",
      a: "Aller sur la page profil (/profil). Modifier les informations : nom='" + (vals.nom || "Nouveau") + "', prenom='" + (vals.prenom || "Prenom") + "', telephone='" + (vals.telephone || "+21699999999") + "'. Cliquer sur 'Enregistrer les modifications'.",
      r: "Profil mis a jour avec succes. Les nouvelles informations sont affichees.",
      f2: "Profil",
      m2: methodName
    };
  }
  if (methodName.indexOf("update_password") > -1 || (methodName.indexOf("password") > -1 && methodName.indexOf("forgot") < 0 && methodName.indexOf("reset") < 0)) {
    if (methodName.indexOf("wrong") > -1) {
      return {
        f: "Profil - Changement mot de passe (erreur)",
        a: "Aller dans profil > Securite. Entrer un mauvais mot de passe actuel, puis un nouveau mot de passe. Cliquer sur 'Modifier le mot de passe'.",
        r: "Message d'erreur : ancien mot de passe incorrect.",
        f2: "Profil",
        m2: methodName
      };
    }
    return {
      f: "Profil - Changement mot de passe",
      a: "Aller dans profil > Securite. Entrer l'ancien mot de passe, le nouveau mot de passe et la confirmation. Cliquer sur 'Modifier le mot de passe'.",
      r: "Mot de passe modifie avec succes.",
      f2: "Profil",
      m2: methodName
    };
  }
  if (methodName.indexOf("photo") > -1) {
    return {
      f: "Profil - Photo",
      a: "Aller dans profil (/profil). Cliquer sur l'avatar pour changer la photo de profil. Selectionner un fichier image.",
      r: "La photo de profil est mise a jour immediatement.",
      f2: "Profil",
      m2: methodName
    };
  }

  // ---- DESTINATIONS ----
  if (methodName.indexOf("destination_list") > -1 || methodName.indexOf("destination_index") > -1) {
    return {
      f: "Destinations",
      a: "Aller sur la page d'accueil. Regarder la section 'Nos Destinations'.",
      r: "Les destinations disponibles s'affichent : nom, region, image.",
      f2: "Destinations",
      m2: methodName
    };
  }
  if (methodName.indexOf("destination_show") > -1 || (methodName.indexOf("destination") > -1 && methodName.indexOf("show") > -1)) {
    return {
      f: "Destinations - Detail",
      a: "Cliquer sur une destination depuis la page d'accueil.",
      r: "Page de la destination avec la liste des hotels associes.",
      f2: "Destinations",
      m2: methodName
    };
  }

  // ---- HOTELS ----
  if (methodName.indexOf("hotel_list") > -1 || methodName.indexOf("hotel_index") > -1 || (methodName.indexOf("hotel") > -1 && methodName.indexOf("returns_list") > -1)) {
    return {
      f: "Hotels - Liste",
      a: "Aller sur la page hotels (/hotels).",
      r: "La liste des hotels disponibles s'affiche avec leurs noms, prix/nuit, etoiles et images.",
      f2: "Hotels",
      m2: methodName
    };
  }
  if (methodName.indexOf("hotel_by_id") > -1 || methodName.indexOf("hotel_show") > -1 || (methodName.indexOf("hotel") > -1 && methodName.indexOf("returns_correct") > -1)) {
    return {
      f: "Hotels - Detail",
      a: "Cliquer sur un hotel dans la liste pour voir ses details.",
      r: "Page de detail : photos, description, equipements, chambres disponibles, avis, et formulaire de reservation.",
      f2: "Hotels",
      m2: methodName
    };
  }
  if (methodName.indexOf("inexistant") > -1 || methodName.indexOf("not_found") > -1 || methodName.indexOf("404") > -1) {
    if (methodName.indexOf("hotel") > -1) {
      return {
        f: "Hotels - Hotel inexistant",
        a: "Aller sur /hotels/9999 (ID inexistant).",
        r: "Page 'Hotel introuvable' ou message d'erreur.",
        f2: "Hotels",
        m2: methodName
      };
    }
  }
  if (methodName.indexOf("create_hotel") > -1 || methodName.indexOf("hotel_store") > -1) {
    if (methodName.indexOf("without_token") > -1) {
      return { f: "Hotels - Creation sans auth", a: "Tenter d'ajouter un hotel sans etre connecte en admin.", r: "Erreur 401 : Non authentifie.", f2: "Hotels", m2: methodName };
    }
    return {
      f: "Hotels - Creation (admin)",
      a: "En tant qu'admin, aller sur la page d'ajout d'hotel. Remplir : nom='" + (vals.nom || "Hotel Test") + "', prix/nuit=" + (vals.prix_par_nuit || "150") + ", etoiles=" + (vals.etoiles || "4") + ". Cliquer sur 'Creer'.",
      r: "Hotel cree avec succes.",
      f2: "Hotels",
      m2: methodName
    };
  }

  // ---- CHAMBRES ----
  if (methodName.indexOf("chambre_list") > -1 || methodName.indexOf("chambre_index") > -1) {
    return {
      f: "Chambres - Consultation",
      a: "Ouvrir la page de detail d'un hotel. Scroller jusqu'a la section 'Chambres disponibles'.",
      r: "Les types de chambres s'affichent : type='" + (vals.type || "double") + "', prix=" + (vals.prix_base_nuit || "150") + " DT/nuit, capacite=" + (vals.capacite_adultes || "2") + " adultes.",
      f2: "Chambres",
      m2: methodName
    };
  }
  if (methodName.indexOf("create_chambre") > -1) {
    if (methodName.indexOf("without_token") > -1) {
      return { f: "Chambres - Creation non auth", a: "Tenter de creer une chambre sans authentification.", r: "Erreur 401.", f2: "Chambres", m2: methodName };
    }
    return {
      f: "Chambres - Creation (admin)",
      a: "En tant qu'admin, ajouter une chambre : type='" + (vals.type || "triple") + "', nom='" + (vals.nom || "Chambre Triple Vue Mer") + "', prix=" + (vals.prix_base_nuit || "250") + " DT, capacite=" + (vals.capacite_adultes || "3") + " adultes.",
      r: "Chambre creee avec succes.",
      f2: "Chambres",
      m2: methodName
    };
  }
  if (methodName.indexOf("update_chambre") > -1) {
    return {
      f: "Chambres - Modification (admin)",
      a: "En tant qu'admin, modifier le prix d'une chambre (prix=" + (vals.prix_base_nuit || "180") + " DT, quantite=" + (vals.quantite || "5") + ").",
      r: "Chambre modifiee avec succes. Les nouvelles valeurs sont affichees.",
      f2: "Chambres",
      m2: methodName
    };
  }
  if (methodName.indexOf("delete_chambre") > -1) {
    return {
      f: "Chambres - Suppression (admin)",
      a: "En tant qu'admin, supprimer une chambre.",
      r: "Chambre supprimee avec succes. Message de confirmation.",
      f2: "Chambres",
      m2: methodName
    };
  }

  // ---- PENSIONS ----
  if (methodName.indexOf("pension") > -1) {
    return {
      f: "Pensions",
      a: "Sur la page detail d'un hotel, ouvrir le selecteur de pension pour une chambre.",
      r: "Les options de pension s'affichent (ex: Petit Dejeuner) avec leurs supplements.",
      f2: "Pensions",
      m2: methodName
    };
  }

  // ---- VOYAGES ----
  if (methodName.indexOf("voyage_list") > -1 || methodName.indexOf("voyage_index") > -1) {
    return {
      f: "Voyages - Liste",
      a: "Aller sur la page voyages (/voyages).",
      r: "La liste des voyages a l'etranger s'affiche : pays, prix, images.",
      f2: "Voyages",
      m2: methodName
    };
  }
  if (methodName.indexOf("voyage_show") > -1) {
    return {
      f: "Voyages - Detail",
      a: "Cliquer sur un voyage pour voir ses details.",
      r: "Page de detail : description, programme, prix.",
      f2: "Voyages",
      m2: methodName
    };
  }

  // ---- RESERVATIONS ----
  if (methodName.indexOf("without_token") > -1 || methodName.indexOf("non_autorise") > -1) {
    if (methodName.indexOf("reservation") > -1) {
      return { f: "Reservation - Non connecte", a: "Tenter de reserver sans etre connecte.", r: "Redirige vers la page de connexion (/login).", f2: "Reservation", m2: methodName };
    }
    if (methodName.indexOf("favori") > -1) {
      return { f: "Favoris - Non connecte", a: "Cliquer sur le coeur d'un hotel sans etre connecte.", r: "Redirige vers la page de connexion.", f2: "Favoris", m2: methodName };
    }
    if (methodName.indexOf("avis") > -1) {
      return { f: "Avis - Non connecte", a: "Tenter de poster un avis sans etre connecte.", r: "Redirige vers la page de connexion.", f2: "Avis", m2: methodName };
    }
  }
  if (methodName.indexOf("create_reservation") > -1 && methodName.indexOf("without") < 0) {
    if (methodName.indexOf("invalid") > -1 || methodName.indexOf("incomplete") > -1) {
      return { f: "Reservation - Donnees invalides", a: "Tenter de reserver sans remplir les champs obligatoires.", r: "Message d'erreur : champs requis manquants.", f2: "Reservation", m2: methodName };
    }
    if (methodName.indexOf("capacite") > -1) {
      return { f: "Reservation - Capacite insuffisante", a: "Choisir plus d'adultes que la capacite maximale de la chambre (ex: 5 adultes pour 2 places).", r: "Message d'erreur : capacite insuffisante.", f2: "Reservation", m2: methodName };
    }
    if (methodName.indexOf("wrong_hotel") > -1) {
      return { f: "Reservation - Chambre invalide", a: "Selectionner une chambre qui n'appartient pas a l'hotel choisi.", r: "Message d'erreur : 'La chambre n'appartient pas a cet hotel.'", f2: "Reservation", m2: methodName };
    }
    return {
      f: "Reservation - Parcours complet",
      a: "Sur la page hotel, choisir arrivee='" + (vals.date_arrivee || "2026-08-01") + "', depart='" + (vals.date_depart || "2026-08-04") + "', adultes=" + (vals.nb_adultes || "2") + ", enfants=" + (vals.nb_enfants || "0") + ", chambres=" + (vals.nb_chambres || "1") + ". Selectionner un type de chambre et une pension. Cliquer sur 'Reserver'.",
      r: "Reservation creee. Prix total = " + (vals.prix_total || "calcule auto") + " TND. Statut : 'En attente'. Message de confirmation.",
      f2: "Reservation",
      m2: methodName
    };
  }
  if (methodName.indexOf("mes_reservations") > -1 || (methodName.indexOf("reservation") > -1 && methodName.indexOf("list") > -1)) {
    return {
      f: "Reservation - Mes reservations",
      a: "Aller sur la page 'Mes reservations' (/reservations).",
      r: "La liste de mes reservations s'affiche : hotel, dates arrivee/depart, prix total, statut (En attente/Confirmee/Annulee).",
      f2: "Reservation",
      m2: methodName
    };
  }

  // ---- Admin Reservations ----
  if (methodName.indexOf("admin") > -1 && methodName.indexOf("reservation") > -1) {
    if (methodName.indexOf("list") > -1) {
      return { f: "Admin - Liste reservations", a: "En tant qu'admin, aller dans le dashboard > Reservations.", r: "La liste de toutes les reservations s'affiche.", f2: "ReservationAdmin", m2: methodName };
    }
    if (methodName.indexOf("confirm") > -1) {
      return { f: "Admin - Confirmer reservation", a: "En tant qu'admin, cliquer sur 'Confirmer' une reservation en attente.", r: "Statut passe a 'Confirmee'.", f2: "ReservationAdmin", m2: methodName };
    }
    if (methodName.indexOf("cancel") > -1) {
      return { f: "Admin - Annuler reservation", a: "En tant qu'admin, cliquer sur 'Annuler' une reservation.", r: "Statut passe a 'Annulee'.", f2: "ReservationAdmin", m2: methodName };
    }
    if (methodName.indexOf("delete") > -1) {
      return { f: "Admin - Supprimer reservation", a: "En tant qu'admin, supprimer une reservation.", r: "Reservation supprimee avec succes.", f2: "ReservationAdmin", m2: methodName };
    }
    if (methodName.indexOf("update") > -1 || methodName.indexOf("invalid") > -1) {
      return { f: "Admin - Statut invalide", a: "En tant qu'admin, tenter de mettre un statut invalide (ex: 'zombie').", r: "Erreur 422 : statut invalide.", f2: "ReservationAdmin", m2: methodName };
    }
    if (methodName.indexOf("without") > -1 || methodName.indexOf("401") > -1) {
      return { f: "Admin - Acces non autorise", a: "Tenter d'acceder aux reservations sans etre admin.", r: "Erreur 401 : Acces refuse.", f2: "ReservationAdmin", m2: methodName };
    }
  }

  // ---- AVIS ----
  if (methodName.indexOf("avis") > -1) {
    if (methodName.indexOf("list") > -1 || methodName.indexOf("index") > -1) {
      return { f: "Avis - Consultation", a: "Ouvrir la page detail d'un hotel. Scroller jusqu'a la section 'Avis'.", r: "Les avis s'affichent : note globale, notes detaillees, commentaires.", f2: "Avis", m2: methodName };
    }
    if (methodName.indexOf("post") > -1 || methodName.indexOf("store") > -1 || methodName.indexOf("create") > -1) {
      if (methodName.indexOf("invalid") > -1 || methodName.indexOf("422") > -1) {
        return { f: "Avis - Notes invalides", a: "Soumettre un avis avec des notes hors limites.", r: "Erreur de validation.", f2: "Avis", m2: methodName };
      }
      return { f: "Avis - Publication", a: "Sur la page hotel, cliquer sur 'Laisser mon avis'. Donner une note et un commentaire. Cliquer sur 'Publier mon avis'.", r: "Avis publie avec succes. Il apparait dans la section avis.", f2: "Avis", m2: methodName };
    }
    if (methodName.indexOf("delete") > -1) {
      return { f: "Avis - Suppression", a: "Supprimer un avis que l'on a publie.", r: "Avis supprime avec succes.", f2: "Avis", m2: methodName };
    }
  }

  // ---- FAVORIS ----
  if (methodName.indexOf("favori") > -1 || methodName.indexOf("fav") > -1) {
    if (methodName.indexOf("list") > -1 || methodName.indexOf("index") > -1) {
      return { f: "Favoris - Consultation", a: "Aller sur la page 'Mes favoris' (/favoris).", r: "La liste des hotels en favoris s'affiche avec leurs infos.", f2: "Favoris", m2: methodName };
    }
    if (methodName.indexOf("toggle") > -1 || methodName.indexOf("add") > -1) {
      return { f: "Favoris - Ajout/Retrait", a: "Sur un hotel, cliquer sur le coeur pour l'ajouter aux favoris. Re-cliquer pour le retirer.", r: "Le coeur se remplit/se vide. La page favoris se met a jour.", f2: "Favoris", m2: methodName };
    }
    if (methodName.indexOf("ids") > -1) {
      return { f: "Favoris - IDs", a: "Ouvrir une page avec des hotels. Les coeurs des favoris sont deja remplis.", r: "Les hotels favoris ont le coeur rempli automatiquement.", f2: "Favoris", m2: methodName };
    }
  }

  // ---- UNIT TESTS (metier) ----
  if (methodName.indexOf("getNbNuits") > -1) {
    var isZero = methodName.indexOf("zero") > -1 || methodName.indexOf("meme") > -1 || methodName.indexOf("avant") > -1 || methodName.indexOf("manquantes") > -1;
    return { f: "Metier - Calcul nuitees", a: "Test du calcul du nombre de nuits entre 2 dates.", r: isZero ? "0 nuits pour dates identiques/invalides." : "4 nuits pour arrivee 2025-08-01, depart 2025-08-05.", f2: "Metier", m2: methodName };
  }
  if (methodName.indexOf("calculatePrixTotal") > -1) {
    var isZero = methodName.indexOf("zero") > -1;
    if (methodName.indexOf("enfants") > -1) {
      return { f: "Metier - Calcul prix (enfants)", a: "Test du calcul du prix avec enfants de differents ages (gratuit <2ans, +30DT 2-12ans, +50DT >12ans).", r: "Prix = (base + supplements enfants) x nuits x chambres.", f2: "Metier", m2: methodName };
    }
    return { f: "Metier - Calcul prix", a: isZero ? "Test du calcul du prix avec 0 nuits." : "Test du calcul du prix : 200 DT x 4 nuits x 2 chambres = 1600 DT.", r: isZero ? "Prix = 0 DT." : "Prix calcule correctement.", f2: "Metier", m2: methodName };
  }
  if (methodName.indexOf("Statut") > -1 || methodName.indexOf("statut") > -1) {
    if (methodName.indexOf("Valide") > -1) {
      return { f: "Metier - Statuts valides", a: "Test : verification des statuts autorises pour une reservation.", r: "en_attente, confirmee, annulee sont valides. 'payee' ou vide sont rejetes.", f2: "Metier", m2: methodName };
    }
    if (methodName.indexOf("Transition") > -1 || methodName.indexOf("canTransition") > -1) {
      if (methodName.indexOf("terminal") > -1 || methodName.indexOf("annulee") > -1) {
        return { f: "Metier - Transition terminale", a: "Test : une fois annulee, une reservation ne peut plus changer de statut.", r: "Annulee -> Confirmee = refuse. Annulee -> En attente = refuse.", f2: "Metier", m2: methodName };
      }
      return { f: "Metier - Transitions autorisees", a: "Test : En attente -> Confirmee OK. En attente -> Annulee OK. Statut invalide -> KO.", r: "Transitions valides selon les regles metier.", f2: "Metier", m2: methodName };
    }
  }
  if (methodName.indexOf("getStatutsValides") > -1) {
    return { f: "Metier - Liste statuts", a: "Test : recuperer la liste complete des statuts valides.", r: "3 statuts : en_attente, confirmee, annulee.", f2: "Metier", m2: methodName };
  }
  if (methodName.indexOf("isDisponible") > -1) {
    return { f: "Metier - Disponibilite hotel", a: "Test : verifier si un hotel est marque disponible.", r: methodName.indexOf("true") > -1 ? "disponible=true -> disponible." : "disponible=false -> indisponible.", f2: "Metier", m2: methodName };
  }
  if (methodName.indexOf("isEtoilesValide") > -1) {
    return { f: "Metier - Validation etoiles", a: "Test : le nombre d'etoiles doit etre entre 1 et 5.", r: methodName.indexOf("true") > -1 ? "1-5 etoiles = OK." : "0 ou 6 etoiles = KO.", f2: "Metier", m2: methodName };
  }
  if (methodName.indexOf("isPrixValide") > -1) {
    return { f: "Metier - Validation prix", a: "Test : le prix par nuit doit etre > 0.", r: methodName.indexOf("true") > -1 || methodName.indexOf("positif") > -1 ? "Prix > 0 = OK." : "Prix <= 0 = KO.", f2: "Metier", m2: methodName };
  }
  if (methodName.indexOf("hasNom") > -1) {
    return { f: "Metier - Nom destination", a: "Test : une destination doit avoir un nom non vide.", r: methodName.indexOf("true") > -1 ? "Nom present = OK." : "Nom vide/absent = KO.", f2: "Metier", m2: methodName };
  }
  if (methodName.indexOf("hasRegion") > -1) {
    return { f: "Metier - Region destination", a: "Test : une destination doit avoir une region non vide.", r: methodName.indexOf("true") > -1 ? "Region presente = OK." : "Region vide/absente = KO.", f2: "Metier", m2: methodName };
  }
  if (methodName.indexOf("getNomComplet") > -1) {
    return { f: "Metier - Nom complet", a: "Test : le nom complet est 'Nom (Region)'.", r: "'Djerba (Medenine)' pour nom='Djerba', region='Medenine'.", f2: "Metier", m2: methodName };
  }

  // ---- Admin CRUD fallbacks ----
  if (methodName.indexOf("admin") > -1) {
    if (methodName.indexOf("user") > -1 || methodName.indexOf("users") > -1) {
      if (methodName.indexOf("list") > -1) return { f: "Admin - Liste utilisateurs", a: "En tant qu'admin, aller dans le dashboard > Utilisateurs.", r: "La liste des utilisateurs s'affiche.", f2: "Admin", m2: methodName };
      if (methodName.indexOf("show") > -1) return { f: "Admin - Detail utilisateur", a: "En tant qu'admin, cliquer sur un utilisateur.", r: "Les details de l'utilisateur s'affichent.", f2: "Admin", m2: methodName };
      if (methodName.indexOf("update") > -1 || methodName.indexOf("role") > -1) return { f: "Admin - Modifier role", a: "En tant qu'admin, changer le role d'un utilisateur.", r: "Role modifie avec succes.", f2: "Admin", m2: methodName };
      if (methodName.indexOf("delete") > -1) return { f: "Admin - Supprimer utilisateur", a: "En tant qu'admin, supprimer un utilisateur.", r: "Utilisateur supprime.", f2: "Admin", m2: methodName };
    }
    if (methodName.indexOf("voyage") > -1) {
      if (methodName.indexOf("create") > -1 || methodName.indexOf("store") > -1) return { f: "Admin - Creer voyage", a: "En tant qu'admin, ajouter un nouveau voyage.", r: "Voyage cree avec succes.", f2: "Admin", m2: methodName };
      if (methodName.indexOf("update") > -1 || methodName.indexOf("edit") > -1) return { f: "Admin - Modifier voyage", a: "En tant qu'admin, modifier un voyage existant.", r: "Voyage modifie.", f2: "Admin", m2: methodName };
      if (methodName.indexOf("delete") > -1) return { f: "Admin - Supprimer voyage", a: "En tant qu'admin, supprimer un voyage.", r: "Voyage supprime.", f2: "Admin", m2: methodName };
    }
    if (methodName.indexOf("destination") > -1) {
      if (methodName.indexOf("create") > -1 || methodName.indexOf("store") > -1) return { f: "Admin - Creer destination", a: "En tant qu'admin, ajouter une nouvelle destination.", r: "Destination creee.", f2: "Admin", m2: methodName };
      if (methodName.indexOf("update") > -1 || methodName.indexOf("edit") > -1) return { f: "Admin - Modifier destination", a: "En tant qu'admin, modifier une destination.", r: "Destination modifiee.", f2: "Admin", m2: methodName };
      if (methodName.indexOf("delete") > -1) return { f: "Admin - Supprimer destination", a: "En tant qu'admin, supprimer une destination.", r: "Destination supprimee.", f2: "Admin", m2: methodName };
    }
    if (methodName.indexOf("service") > -1) {
      if (methodName.indexOf("create") > -1) return { f: "Admin - Gerer services", a: "En tant qu'admin, ajouter un service a un hotel.", r: "Service ajoute.", f2: "Admin", m2: methodName };
    }
  }

  // ---- Social auth ----
  if (methodName.indexOf("social") > -1) {
    return { f: "Connexion sociale", a: "Cliquer sur 'Se connecter avec Google/Facebook'.", r: "Connecte via le fournisseur social.", f2: "Connexion", m2: methodName };
  }

  // ---- Fallback ----
  return {
    f: desc,
    a: desc,
    r: "Comportement attendu selon le test PHP.",
    f2: "General",
    m2: methodName
  };
}

// --- Extraction ---

function extractTests(filePath) {
  var content = fs.readFileSync(filePath, "utf-8");
  var className = path.basename(filePath, ".php");
  var methods = [];
  
  var methodRegex = /public function (test_\w+)\s*\([^)]*\)\s*(?::\s*\w+\s*)?\{([\s\S]*?)\n    \}/g;
  var m;
  
  while ((m = methodRegex.exec(content)) !== null) {
    var methodName = m[1];
    var body = m[2];
    
    var fileInfo = {
      fichier: path.basename(filePath),
      domaine: className.replace("Test", "").replace("Api", "")
    };
    
    var scenario = mapToUserScenario(methodName, body, fileInfo);
    
    if (scenario) {
      methods.push({
        fonctionnalite: scenario.f,
        action: scenario.a,
        attendu: scenario.r,
        tri: scenario.f2,
        fichier: fileInfo.fichier,
        methode: methodName
      });
    }
  }
  
  return methods;
}

// --- MAIN ---

function main() {
  var featureFiles = walkTests(path.join(TESTS_DIR, "Feature"));
  var unitFiles = walkTests(path.join(TESTS_DIR, "Unit"));
  
  var allRows = [];
  var orderByDomaine = [
    "Inscription","Connexion","Connexion - Erreur","Connexion sociale","Mot de passe oublie","Reinitialisation mot de passe","Deconnexion",
    "Destinations","Destinations - Detail",
    "Hotels - Liste","Hotels - Detail","Hotels - Hotel inexistant","Hotels - Creation (admin)","Hotels - Creation sans auth",
    "Voyages - Liste","Voyages - Detail",
    "Chambres - Consultation","Chambres - Creation (admin)","Chambres - Creation non auth","Chambres - Modification (admin)","Chambres - Suppression (admin)","Chambres - Chambre inexistante",
    "Pensions",
    "Favoris - Consultation","Favoris - Ajout/Retrait","Favoris - IDs","Favoris - Non connecte",
    "Avis - Consultation","Avis - Publication","Avis - Notes invalides","Avis - Suppression","Avis - Non connecte",
    "Profil - Consultation","Profil - Modification","Profil - Changement mot de passe","Profil - Changement mot de passe (erreur)","Profil - Photo",
    "Reservation - Parcours complet","Reservation - Donnees invalides","Reservation - Capacite insuffisante","Reservation - Chambre invalide","Reservation - Mes reservations","Reservation - Non connecte",
    "Admin - Liste reservations","Admin - Confirmer reservation","Admin - Annuler reservation","Admin - Supprimer reservation","Admin - Statut invalide","Admin - Acces non autorise",
    "Admin - Liste utilisateurs","Admin - Detail utilisateur","Admin - Modifier role","Admin - Supprimer utilisateur",
    "Admin - Creer voyage","Admin - Modifier voyage","Admin - Supprimer voyage",
    "Admin - Creer destination","Admin - Modifier destination","Admin - Supprimer destination",
    "Admin - Gerer services",
    "Metier - Calcul nuitees","Metier - Calcul prix","Metier - Calcul prix (enfants)","Metier - Statuts valides","Metier - Transitions autorisees","Metier - Transition terminale","Metier - Liste statuts",
    "Metier - Disponibilite hotel","Metier - Validation etoiles","Metier - Validation prix",
    "Metier - Nom destination","Metier - Region destination","Metier - Nom complet"
  ];
  
  for (var f = 0; f < featureFiles.length; f++) {
    var tests = extractTests(featureFiles[f]);
    allRows = allRows.concat(tests);
  }
  for (var u = 0; u < unitFiles.length; u++) {
    var tests = extractTests(unitFiles[u]);
    allRows = allRows.concat(tests);
  }
  
  console.log("Extraction : " + allRows.length + " scenarios");
  
  // Sort
  allRows.sort(function(a, b) {
    var ia = orderByDomaine.indexOf(a.fonctionnalite);
    var ib = orderByDomaine.indexOf(b.fonctionnalite);
    if (ia === -1) ia = 999;
    if (ib === -1) ib = 999;
    return ia - ib;
  });
  
  // Number
  for (var i = 0; i < allRows.length; i++) {
    allRows[i].N = i + 1;
  }
  
  // Excel
  var excelRows = allRows.map(function(r) {
    return {
      "N": r.N,
      "Fonctionnalite": r.fonctionnalite,
      "Action a faire": r.action,
      "Resultat attendu": r.attendu,
      "Statut": "Non teste",
      "Remarques": "",
      "Ref. test": r.fichier + "::" + r.methode
    };
  });
  
  var workbook = xlsx.utils.book_new();
  var ws = xlsx.utils.json_to_sheet(excelRows);
  ws["!cols"] = [
    { wch: 4 }, { wch: 28 }, { wch: 80 }, { wch: 55 }, { wch: 12 }, { wch: 30 }, { wch: 45 }
  ];
  
  var numRows = allRows.length;
  if (numRows > 0) {
    ws["!dataValidations"] = {};
    ws["!dataValidations"]["E2:E" + (numRows + 1)] = {
      type: "list",
      formula1: '"Non teste,OK,KO"',
      allowBlank: true,
      showDropDown: false
    };
  }
  
  xlsx.utils.book_append_sheet(workbook, ws, "Tests Utilisateur");
  xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet([
    { Info: "LEGENDE", Detail: "" },
    { Info: "", Detail: "" },
    { Info: "Source", Detail: "Fichiers PHP dans server/tests/" },
    { Info: "Genere le", Detail: new Date().toLocaleString("fr-FR") },
    { Info: "But", Detail: "Plan de test manuel pour tester l'application" },
    { Info: "", Detail: "" },
    { Info: "Statut", Detail: "Signification" },
    { Info: "Non teste", Detail: "Pas encore teste" },
    { Info: "OK", Detail: "Comportement conforme" },
    { Info: "KO", Detail: "Comportement non conforme" },
  ]), "Legende");
  
  xlsx.writeFile(workbook, OUTPUT);
  console.log("\nFichier : " + OUTPUT);
  console.log("Scenarios : " + excelRows.length);
  console.log("Colonnes : N | Fonctionnalite | Action a faire | Resultat attendu | Statut | Remarques");
}

main();

