<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    protected $fillable = [
        'user_id',
        'hotel_id',
        'chambre_id',
        'pension_id',
        'date_arrivee',
        'date_depart',
        'nb_chambres',
        'nb_adultes',
        'nb_enfants',
        'ages_enfants',
        'prix_total',
        'statut'
    ];

    protected $casts = [
        'ages_enfants' => 'array',
    ];

    // ── Relations ─────────────────────────────────────────────────────────

    /** Une réservation appartient à un utilisateur */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** Une réservation appartient à un hôtel */
    public function hotel()
    {
        return $this->belongsTo(Hotel::class);
    }

    /** Une réservation concerne une chambre spécifique */
    public function chambre()
    {
        return $this->belongsTo(Chambre::class);
    }

        /** Une réservation est liée à une pension choisie */
    public function pension()
    {
        return $this->belongsTo(Pension::class);
    }

    // ── Méthodes métier ───────────────────────────────────────────────────

    /**
     * Retourne la liste des statuts acceptés par le système.
     */
    public static function getStatutsValides(): array
    {
        return ['en_attente', 'confirmee', 'annulee'];
    }

    /**
     * Calcule le nombre de nuits entre la date d'arrivée et la date de départ.
     * Retourne 0 si les dates sont identiques ou manquantes.
     */
    public function getNbNuits(): int
    {
        if (!$this->date_arrivee || !$this->date_depart) {
            return 0;
        }

        $arrivee = new \DateTime($this->date_arrivee);
        $depart  = new \DateTime($this->date_depart);
        $diff    = $arrivee->diff($depart); //pour camculer la différence entre deux dates

        // Si départ avant arrivée, on retourne 0
        return $diff->invert ? 0 : $diff->days; //protéction pour assurer date dep avant date arrivee
    }

    /**
     * Calcule le prix total de la réservation.
     * Prix = (prix_base_nuit + suppléments_enfants) × nb_nuits × nb_chambres
     */
        /**
     * Calcule le prix total de la réservation.
     * Prix = (prix_base_nuit + supplement_pension + suppléments_enfants) × nb_nuits × nb_chambres
     */
    public function calculatePrixTotal(float $prixBaseNuit, float $supplementPension = 0): float
    {
        $nbChambres = $this->nb_chambres ?? 1;
        $nbNuits = $this->getNbNuits();

        $supplementEnfants = 0;
        if ($this->ages_enfants && is_array($this->ages_enfants)) {
            foreach ($this->ages_enfants as $age) {
                if ($age < 2) {
                    $supplementEnfants += 0;
                } elseif ($age < 12) {
                    $supplementEnfants += 30;
                } else {
                    $supplementEnfants += 50;
                }
            }
        }

        return ($prixBaseNuit + $supplementPension + $supplementEnfants) * $nbNuits * $nbChambres;
    }

    /**
     * Vérifie si un statut donné est valide pour une réservation.
     */
    public function isStatutValide(string $statut): bool
    {
        return in_array($statut, self::getStatutsValides(), true); //self:appelle une méthode statique de la même classe
    }

    /**
     * Vérifie si la réservation peut passer au nouveau statut donné.
     * Règles :
     *  - « annulee » est un état terminal (aucune transition possible).
     *  - Toute autre transition vers un statut valide est autorisée.
     */
    public function canTransitionTo(string $nouveauStatut): bool
    {
        if (!$this->isStatutValide($nouveauStatut)) {
            return false;
        }

        // État terminal : impossible de changer
        if ($this->statut === 'annulee') {
            return false;
        }

        return true;
    }
}
