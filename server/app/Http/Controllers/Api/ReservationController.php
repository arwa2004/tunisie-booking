<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ReservationController extends Controller
{
    // GET /api/reservations → toutes les réservations (admin)
    public function index()
    {
        $reservations = Reservation::with(['user', 'hotel.destination', 'chambre', 'pension'])->get();
        return response()->json($reservations);
    }

    // POST /api/reservations → créer une réservation
    public function store(Request $request)
    {
        $request->validate([
            'hotel_id'       => 'required|exists:hotels,id',
            'chambre_id'     => 'required|exists:chambres,id',
            'pension_id'     => 'nullable|exists:pensions,id',
            'date_arrivee'   => 'required|date',
            'date_depart'    => 'required|date|after:date_arrivee',
            'nb_chambres'    => 'required|integer|min:1',
            'nb_adultes'     => 'required|integer|min:1',
            'nb_enfants'     => 'integer|min:0',
            'ages_enfants'   => 'nullable|array',
            'ages_enfants.*' => 'integer|min:0|max:17',
        ]);

        $chambre = \App\Models\Chambre::find($request->chambre_id);

        // Validation 1 : Vérifier que la chambre appartient bien à l'hôtel choisi
        if ($chambre->hotel_id !== (int) $request->hotel_id) {
            return response()->json(['message' => 'La chambre sélectionnée n\'appartient pas à cet hôtel.'], 422);
        }

        // Validation 2 : Vérifier que la chambre a la capacité d'accueillir les personnes
        if (!$chambre->peutAccueillir($request->nb_adultes, $request->nb_enfants ?? 0)) {
            return response()->json(['message' => 'La capacité de cette chambre est insuffisante pour le nombre de personnes.'], 422);
        }

        // Validation 3 : Vérifier la disponibilité en quantité de la chambre
        if ($chambre->quantite < $request->nb_chambres) {
            return response()->json(['message' => 'Désolé, il n\'y a plus assez de chambres disponibles pour ce type.'], 422);
        }

        // Récupérer le supplément pension depuis la table pivot
        $supplementPension = 0;
        if ($request->pension_id) {
            $pensionPivot = $chambre->pensions()->where('pension_id', $request->pension_id)->first();
            if ($pensionPivot) {
                $supplementPension = $pensionPivot->pivot->supplement_prix;
            }
        }

        // Instancier temporairement la réservation pour utiliser la logique métier du modèle
        $tempReservation = new Reservation([
            'date_arrivee' => $request->date_arrivee,
            'date_depart'  => $request->date_depart,
            'nb_chambres'  => $request->nb_chambres,
            'ages_enfants' => $request->ages_enfants ?? [],
        ]);

        $prixTotal = $tempReservation->calculatePrixTotal($chambre->prix_base_nuit, $supplementPension);

        // Décrémenter la quantité disponible de la chambre
        $chambre->decrement('quantite', $request->nb_chambres);

        $reservation = Reservation::create([
            'user_id'      => $request->user()->id,
            'hotel_id'     => $request->hotel_id,
            'chambre_id'   => $request->chambre_id,
            'pension_id'   => $request->pension_id,
            'date_arrivee' => $request->date_arrivee,
            'date_depart'  => $request->date_depart,
            'nb_chambres'  => $request->nb_chambres,
            'nb_adultes'   => $request->nb_adultes,
            'nb_enfants'   => $request->nb_enfants ?? 0,
            'ages_enfants' => $request->ages_enfants ?? [],
            'prix_total'   => $prixTotal,
            'statut'       => 'en_attente',
        ]);

        // Charger les relations nécessaires (sans "return" ici, sinon le webhook
        // ci-dessous ne serait jamais exécuté)
        $reservation->load(['user', 'hotel', 'chambre', 'pension']);

        // ✅ Notification webhook n8n → envoi de l'email de confirmation
        try {
            Http::withHeaders([
                'X-Webhook-Secret' => 'Kharkhour_2024',
            ])->post('https://arwabenamar.app.n8n.cloud/webhook/nouvelle-reservation', [
                'user_email'   => $reservation->user->email,
                'user_nom'     => $reservation->user->name, // ⚠️ vérifiez le nom exact du champ dans votre modèle User
                'hotel_nom'    => $reservation->hotel->nom,
                'date_arrivee' => $reservation->date_arrivee,
                'date_depart'  => $reservation->date_depart,
                'nb_chambres'  => $reservation->nb_chambres,
                'nb_adultes'   => $reservation->nb_adultes,
                'nb_enfants'   => $reservation->nb_enfants,
                'prix_total'   => $reservation->prix_total,
            ]);
        } catch (\Exception $e) {
            // On log l'erreur mais on ne bloque jamais la création de la réservation
            \Log::error('Erreur webhook n8n: ' . $e->getMessage());
        }

        // ✅ Un seul return, à la toute fin de la méthode
        return response()->json($reservation, 201);
    }

    // GET /api/reservations/{id} → une réservation
    public function show($id)
    {
        $reservation = Reservation::with(['user', 'hotel', 'chambre'])->find($id);

        if (!$reservation) {
            return response()->json(['message' => 'Réservation non trouvée'], 404);
        }

        return response()->json($reservation);
    }

    // PUT /api/reservations/{id} → modifier le statut
    public function update(Request $request, $id)
    {
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json(['message' => 'Réservation non trouvée'], 404);
        }

        $request->validate([
            'statut' => 'required|in:en_attente,confirmee,annulee',
        ]);

        $oldStatut = $reservation->statut;
        $newStatut = $request->statut;

        if ($oldStatut !== 'annulee' && $newStatut === 'annulee') {
            // Rembourser la quantité
            $chambre = $reservation->chambre;
            if ($chambre) {
                $chambre->increment('quantite', $reservation->nb_chambres);
            }
        } elseif ($oldStatut === 'annulee' && $newStatut !== 'annulee') {
            // Si on sort de l'annulation, on valide et on décrémente
            $chambre = $reservation->chambre;
            if ($chambre) {
                if ($chambre->quantite < $reservation->nb_chambres) {
                    return response()->json(['message' => 'Désolé, il n\'y a plus de chambres disponibles pour réactiver cette réservation.'], 422);
                }
                $chambre->decrement('quantite', $reservation->nb_chambres);
            }
        }

        $reservation->update(['statut' => $request->statut]);

        return response()->json($reservation);
    }

    // DELETE /api/reservations/{id} → supprimer
    public function destroy($id)
    {
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json(['message' => 'Réservation non trouvée'], 404);
        }

        // Rembourser la quantité s'il n'était pas déjà annulé
        if ($reservation->statut !== 'annulee') {
            $chambre = $reservation->chambre;
            if ($chambre) {
                $chambre->increment('quantite', $reservation->nb_chambres);
            }
        }

        $reservation->delete();

        return response()->json(['message' => 'Réservation supprimée']);
    }

    // GET /api/mes-reservations → réservations de l'utilisateur connecté
    public function mesReservations(Request $request)
    {
        $reservations = Reservation::with(['hotel', 'hotel.destination', 'chambre'])
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reservations);
    }
}
