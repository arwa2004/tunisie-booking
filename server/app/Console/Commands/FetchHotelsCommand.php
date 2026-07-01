<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\Hotel;
use App\Models\Destination;

class FetchHotelsCommand extends Command
{
    protected $signature = 'hotels:fetch
                            {--destinations= : Noms des destinations séparés par virgule (ex: Tunis,Sousse)}
                            {--max=5 : Nombre max d\'hôtels par destination}
                            {--add-destinations= : Ajouter de nouvelles destinations avant le fetch}';

    protected $description = 'Aspire les vrais hôtels depuis Google Maps (SerpApi) et les met en BDD';

    public function handle()
    {
        $apiKey = '2cc26f4d41e3f940940e0c205d449933b7374ddd17e1f759862d108c5c03f234';
        $max    = (int) $this->option('max');

        // ── Option 3 : Ajouter de nouvelles destinations ──────────────────────
        if ($this->option('add-destinations')) {
            $nouvelles = explode(',', $this->option('add-destinations'));
            foreach ($nouvelles as $nom) {
                $nom = trim($nom);
                $dest = Destination::firstOrCreate(
                    ['nom' => $nom],
                    ['region' => 'Tunisie', 'image' => null]
                );
                $this->info("📍 Destination : $nom " . ($dest->wasRecentlyCreated ? '(ajoutée)' : '(existe déjà)'));
            }
        }

        // ── Option 1 : Filtrer les destinations ───────────────────────────────
        if ($this->option('destinations')) {
            $noms         = array_map('trim', explode(',', $this->option('destinations')));
            $destinations = Destination::whereIn('nom', $noms)->get();
        } else {
            $destinations = Destination::all();
        }

        if ($destinations->isEmpty()) {
            $this->error("❌ Aucune destination trouvée en base de données !");
            return;
        }

        $this->info("🚀 Début du fetch pour " . $destinations->count() . " destination(s) | Max $max hôtels/destination");
        $this->newLine();

        $totalAjoutes = 0;
        $totalExistes = 0;

        foreach ($destinations as $destination) {
            $this->info("🔍 Recherche pour : " . $destination->nom);

            $response = Http::get('https://serpapi.com/search.json', [
                'engine'   => 'google_local',
                'q'        => 'hotels',
                'location' => $destination->nom . ', Tunisia',
                'hl'       => 'fr',
                'gl'       => 'tn',
                'api_key'  => $apiKey,
            ]);

            if (!$response->successful()) {
                $this->error("   ❌ Erreur de connexion à SerpApi pour " . $destination->nom);
                sleep(2);
                continue;
            }

            $data = $response->json();

            if (!isset($data['local_results']) || empty($data['local_results'])) {
                $this->warn("   ⚠️  Aucun hôtel trouvé pour " . $destination->nom);
                sleep(2);
                continue;
            }

            $compteur = 0;

            // ── Option 2 : Limite du nombre d'hôtels ──────────────────────────
            foreach ($data['local_results'] as $result) {
                if ($compteur >= $max) break;

                $hotelExists = Hotel::where('nom', $result['title'])->exists();

                if ($hotelExists) {
                    $this->line("   ⏭️  Déjà en BDD : " . $result['title']);
                    $totalExistes++;
                    continue;
                }

                // Calcul étoiles
                $etoiles = 3;
                if (isset($result['rating'])) {
                    $etoiles = (int) round($result['rating']);
                    $etoiles = max(1, min(5, $etoiles)); // entre 1 et 5
                }

                // Prix basé sur les étoiles
                $prix = match($etoiles) {
                    5       => rand(250, 500),
                    4       => rand(150, 249),
                    3       => rand(80,  149),
                    default => rand(50,   79),
                };

                Hotel::create([
                    'destination_id' => $destination->id,
                    'nom'            => $result['title'],
                    'prix_par_nuit'  => $prix,
                    'etoiles'        => $etoiles,
                    'description'    => $result['description'] ?? 'Un superbe hôtel situé à ' . $destination->nom . '.',
                    'image'          => $result['thumbnail'] ?? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600',
                    'disponible'     => true,
                ]);

                $this->line("   ✅ Ajouté : " . $result['title'] . " ($etoiles — {$prix} DT/nuit)");
                $totalAjoutes++;
                $compteur++;
            }

            sleep(2); // Pause entre chaque destination
        }

        $this->newLine();
        $this->info("🎉 Terminé ! $totalAjoutes hôtels ajoutés | $totalExistes déjà existants.");
    }
}
