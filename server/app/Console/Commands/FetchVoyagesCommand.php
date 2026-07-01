<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\Voyage;

class FetchVoyagesCommand extends Command
{
    protected $signature = 'voyages:fetch';
    protected $description = 'Aspire la France et le Mexique proprement';

    public function handle()
    {
        // ⚠️ VOTRE CLÉ SERPAPI ICI ⚠️
        $apiKey = '2cc26f4d41e3f940940e0c205d449933b7374ddd17e1f759862d108c5c03f234';

        // On utilise un tableau simple avec Pays => Ville
        $cibles = [
            'France'      => 'Paris, France',
            'Mexique'     => 'Mexico City, Mexico',
            'Italie'      => 'Rome, Italy',
            'Espagne'     => 'Barcelona, Spain',
            'Turquie'     => 'Istanbul, Turkey',
            'Maroc'       => 'Marrakech, Morocco',
            'Égypte'      => 'Cairo, Egypt',
            'Grèce'       => 'Athens, Greece',
            'Portugal'    => 'Lisbon, Portugal',
            'Émirats'     => 'Dubai, United Arab Emirates',
            'Thaïlande'   => 'Bangkok, Thailand',
            'Japon'       => 'Tokyo, Japan',
];

        foreach ($cibles as $pays => $ville) {
            $this->info("🌍 Extraction d'hôtels depuis Google pour : " . $pays);

            // On utilise exactement la même méthode simple qui a marché pour Hammamet et Istanbul !
            $response = Http::get('https://serpapi.com/search.json', [
                'engine'   => 'google_local',
                'q'        => 'hotels',
                'location' => $ville,
                'hl'       => 'fr', // On demande à Google les descriptions en français
                'api_key'  => $apiKey
            ]);

            if ($response->successful()) {
                $data = $response->json();

                if (isset($data['local_results'])) {

                    foreach ($data['local_results'] as $result) {

                        $voyageExists = Voyage::where('nom', $result['title'])->exists();

                        if (!$voyageExists) {
                            Voyage::create([
                                'nom'         => $result['title'],
                                'pays'        => $pays,
                                'prix'        => rand(500, 2500),
                                'duree'       => rand(3, 10),
                                'image'       => $result['thumbnail'] ?? 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600',
                                'description' => $result['description'] ?? 'Superbe établissement situé en ' . $pays,
                            ]);

                            $this->line("   ✅ Hôtel ajouté : " . $result['title'] . " (" . $pays . ")");
                        }
                    }
                } else {
                    $this->error("   ❌ Aucun résultat local trouvé pour " . $pays);
                }
            } else {
                $this->error("   ❌ Erreur de connexion à SerpApi pour " . $pays);
            }

            sleep(2);
        }

        $this->info("🎉 Terminé ! Votre base de données mondiale est complète.");
    }
}
