<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    // GET /api/reservations → toutes les réservations (admin)
    public function index()
    {
        $reservations = Reservation::with(['user', 'hotel'])->get();
        return response()->json($reservations);
    }

    // POST /api/reservations → créer une réservation
    public function store(Request $request)
    {
        $request->validate([
            'hotel_id'     => 'required|exists:hotels,id',
            'date_arrivee' => 'required|date',
            'date_depart'  => 'required|date|after:date_arrivee',
            'nb_chambres'  => 'required|integer|min:1',
            'nb_adultes'   => 'required|integer|min:1',
            'nb_enfants'   => 'integer|min:0',
        ]);

        // Calcul automatique du prix total
        $hotel = \App\Models\Hotel::find($request->hotel_id);
        $dateArrivee = new \DateTime($request->date_arrivee);
        $dateDepart  = new \DateTime($request->date_depart);
        $nbNuits     = $dateArrivee->diff($dateDepart)->days;
        $prixTotal   = $nbNuits * $hotel->prix_par_nuit * $request->nb_chambres;

        $reservation = Reservation::create([
            'user_id'      => $request->user()->id,
            'hotel_id'     => $request->hotel_id,
            'date_arrivee' => $request->date_arrivee,
            'date_depart'  => $request->date_depart,
            'nb_chambres'  => $request->nb_chambres,
            'nb_adultes'   => $request->nb_adultes,
            'nb_enfants'   => $request->nb_enfants ?? 0,
            'prix_total'   => $prixTotal,
            'statut'       => 'en_attente',
        ]);

        return response()->json($reservation->load(['user', 'hotel']), 201);
    }

    // GET /api/reservations/{id} → une réservation
    public function show($id)
    {
        $reservation = Reservation::with(['user', 'hotel'])->find($id);

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

        $reservation->delete();

        return response()->json(['message' => 'Réservation supprimée']);
    }

    // GET /api/mes-reservations → réservations de l'utilisateur connecté
    public function mesReservations(Request $request)
    {
        $reservations = Reservation::with(['hotel', 'hotel.destination'])
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reservations);
    }
}
