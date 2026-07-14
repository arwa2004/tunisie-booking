<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Hotel extends Model
{
    use HasFactory;

    protected $fillable = [
        'destination_id',
        'nom',
        'prix_par_nuit',
        'etoiles',
        'description',
        'image',
        'disponible'
    ];

    protected static function booted()
    {
        static::created(function ($hotel) {
            // Generate default chambers (Single, Double, Triple, Suite)
            $chambres = [
                [
                    'type' => 'simple',
                    'nom' => 'Chambre Single Standard',
                    'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 0.8),
                    'capacite_adultes' => 1,
                    'capacite_enfants' => 0,
                    'quantite' => 8,
                ],
                [
                    'type' => 'simple',
                    'nom' => 'Chambre Single Vue Piscine',
                    'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 0.95),
                    'capacite_adultes' => 1,
                    'capacite_enfants' => 0,
                    'quantite' => 5,
                ],
                [
                    'type' => 'simple',
                    'nom' => 'Chambre Single Vue Mer',
                    'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 1.1),
                    'capacite_adultes' => 1,
                    'capacite_enfants' => 0,
                    'quantite' => 3,
                ],
                [
                    'type' => 'double',
                    'nom' => 'Chambre Double Standard',
                    'prix_base_nuit' => $hotel->prix_par_nuit,
                    'capacite_adultes' => 2,
                    'capacite_enfants' => 1,
                    'quantite' => 12,
                ],
                [
                    'type' => 'double',
                    'nom' => 'Chambre Double Vue Piscine',
                    'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 1.15),
                    'capacite_adultes' => 2,
                    'capacite_enfants' => 1,
                    'quantite' => 8,
                ],
                [
                    'type' => 'double',
                    'nom' => 'Chambre Double Vue Mer',
                    'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 1.3),
                    'capacite_adultes' => 2,
                    'capacite_enfants' => 1,
                    'quantite' => 6,
                ],
                [
                    'type' => 'triple',
                    'nom' => 'Chambre Triple Vue Jardin',
                    'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 1.3),
                    'capacite_adultes' => 3,
                    'capacite_enfants' => 1,
                    'quantite' => 6,
                ],
                [
                    'type' => 'triple',
                    'nom' => 'Chambre Triple Vue Mer',
                    'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 1.55),
                    'capacite_adultes' => 3,
                    'capacite_enfants' => 1,
                    'quantite' => 4,
                ],
                [
                    'type' => 'familiale',
                    'nom' => 'Suite Familiale Standard',
                    'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 1.7),
                    'capacite_adultes' => 4,
                    'capacite_enfants' => 2,
                    'quantite' => 4,
                ],
                [
                    'type' => 'familiale',
                    'nom' => 'Suite Familiale Vue Mer',
                    'prix_base_nuit' => (int) round($hotel->prix_par_nuit * 2.0),
                    'capacite_adultes' => 4,
                    'capacite_enfants' => 2,
                    'quantite' => 3,
                ],
            ];

            // Create pensions if they don't exist
            $pensionPD  = Pension::firstOrCreate(['nom' => 'Petit Déjeuner']);
            $pensionDP  = Pension::firstOrCreate(['nom' => 'Demi Pension']);
            $pensionAIS = Pension::firstOrCreate(['nom' => 'All Inclusive Soft']);
            $pensionAI  = Pension::firstOrCreate(['nom' => 'All Inclusive']);

            foreach ($chambres as $chData) {
                $ch = $hotel->chambres()->create($chData);
                $ch->pensions()->attach($pensionPD->id,  ['supplement_prix' => 0]);
                $ch->pensions()->attach($pensionDP->id,  ['supplement_prix' => 40]);
                $ch->pensions()->attach($pensionAIS->id, ['supplement_prix' => 70]);
                $ch->pensions()->attach($pensionAI->id,  ['supplement_prix' => 100]);
            }

            // Create services if they don't exist and attach them
            $wifi       = Service::firstOrCreate(['nom' => 'WiFi Gratuit',    'icone' => '📶']);
            $piscine    = Service::firstOrCreate(['nom' => 'Piscine',         'icone' => '🏊']);
            $spa        = Service::firstOrCreate(['nom' => 'Spa & Bien-être', 'icone' => '💆']);
            $restaurant = Service::firstOrCreate(['nom' => 'Restaurant',      'icone' => '🍽️']);
            $parking    = Service::firstOrCreate(['nom' => 'Parking',         'icone' => '🅿️']);
            $plage      = Service::firstOrCreate(['nom' => 'Plage Privée',    'icone' => '🏖️']);
            $clim       = Service::firstOrCreate(['nom' => 'Climatisation',   'icone' => '❄️']);
            $sport      = Service::firstOrCreate(['nom' => 'Salle de Sport',  'icone' => '🏋️']);

            $tousLesServices = [$wifi, $piscine, $spa, $restaurant, $parking, $plage, $clim, $sport];

            if ($hotel->etoiles >= 5) {
                $hotel->services()->attach(collect($tousLesServices)->pluck('id'));
            } elseif ($hotel->etoiles >= 4) {
                $hotel->services()->attach([$wifi->id, $piscine->id, $restaurant->id, $parking->id, $clim->id]);
            } else {
                $hotel->services()->attach([$wifi->id, $restaurant->id, $parking->id, $clim->id]);
            }

            // Create some default gallery photos
            $photosParDefaut = [
                ['url' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 'alt_text' => 'Vue extérieure'],
                ['url' => 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', 'alt_text' => 'Hall d\'accueil'],
                ['url' => 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 'alt_text' => 'Piscine'],
                ['url' => 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', 'alt_text' => 'Chambre'],
            ];

            foreach ($photosParDefaut as $index => $photo) {
                $hotel->photos()->create([
                    'url'      => $photo['url'],
                    'alt_text' => $photo['alt_text'],
                    'ordre'    => $index,
                ]);
            }
        });
    }

    // ── Relations ─────────────────────────────────────────────────────────

    /** Un hôtel appartient à une destination */
    public function destination()
    {
        return $this->belongsTo(Destination::class);
    }

    /** Un hôtel possède plusieurs réservations */
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    /** Un hôtel possède plusieurs types de chambres */
    public function chambres()
    {
        return $this->hasMany(Chambre::class);
    }

    /** Un hôtel propose plusieurs services (WiFi, Piscine...) */
    public function services()
    {
        return $this->belongsToMany(Service::class, 'hotel_service')
                    ->withTimestamps();
    }

    /** Un hôtel possède plusieurs photos */
    public function photos()
    {
        return $this->hasMany(HotelPhoto::class)->orderBy('ordre');
    }

    // ── Méthodes métier ───────────────────────────────────────────────────

    /**
     * Indique si l'hôtel est disponible à la réservation.
     */
    public function isDisponible(): bool
    {
        return (bool) $this->disponible;
    }

    /**
     * Vérifie que le nombre d'étoiles est compris entre 1 et 5.
     */
    public function isEtoilesValide(): bool
    {
        return $this->etoiles >= 1 && $this->etoiles <= 5;
    }

    /**
     * Vérifie que le prix par nuit est strictement positif.
     */
    public function isPrixValide(): bool
    {
        return $this->prix_par_nuit > 0;
    }
}
