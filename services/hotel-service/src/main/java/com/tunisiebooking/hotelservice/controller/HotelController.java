package com.tunisiebooking.hotelservice.controller;

import com.tunisiebooking.hotelservice.model.Hotel;
import com.tunisiebooking.hotelservice.repository.HotelRepository;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/")
@CrossOrigin(origins = "*")
public class HotelController {

    private final HotelRepository hotelRepository;

    public HotelController(HotelRepository hotelRepository) {
        this.hotelRepository = hotelRepository;
    }

    // 1. Liste de tous les hôtels
    @GetMapping
    public List<Hotel> getHotels() {
        List<Hotel> hotels = hotelRepository.findAll();
        if (hotels.isEmpty()) {
            return Arrays.asList(
                new Hotel("El Mouradi El Menzah (Spring Boot)", 4, "Hammamet", 130.0),
                new Hotel("Hasdrubal Prestige (Spring Boot)", 5, "Djerba", 450.0),
                new Hotel("Marhaba Royal Salem (Spring Boot)", 4, "Sousse", 180.0)
            );
        }
        return hotels;
    }

    // 2. Détail d'un hôtel spécifique (/api/hotels/{id})
    @GetMapping("/{id}")
    public Map<String, Object> getHotelById(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        
        Optional<Hotel> optionalHotel = hotelRepository.findById(id);
        Hotel hotel = optionalHotel.orElseGet(() -> 
            new Hotel("El Mouradi El Menzah (Spring Boot)", 4, "Hammamet", 130.0)
        );

        response.put("id", id);
        response.put("nom", hotel.getNom());
        response.put("etoiles", hotel.getEtoiles());
        response.put("prix_par_nuit", hotel.getPrixNuit());
        response.put("ville", hotel.getVille());
        response.put("description", "Hôtel de luxe idéalement situé en bord de mer, offrant des suites spacieuses, plusieurs piscines, un spa complet et une gastronomie raffinée.");
        response.put("image", "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80");

        // Destination associée
        Map<String, Object> dest = new HashMap<>();
        dest.put("id", 1);
        dest.put("nom", hotel.getVille());
        dest.put("region", "Tunisie");
        response.put("destination", dest);

        // Chambres disponibles
        List<Map<String, Object>> chambres = new ArrayList<>();
        Map<String, Object> ch1 = new HashMap<>();
        ch1.put("id", 101);
        ch1.put("nom", "Chambre Double Standard Vue Mer");
        ch1.put("capacite", 2);
        ch1.put("prix", hotel.getPrixNuit());
        chambres.add(ch1);

        Map<String, Object> ch2 = new HashMap<>();
        ch2.put("id", 102);
        ch2.put("nom", "Suite Junior Prestige All Inclusive");
        ch2.put("capacite", 4);
        ch2.put("prix", hotel.getPrixNuit() * 1.8);
        chambres.add(ch2);

        response.put("chambres", chambres);

        return response;
    }

    // 3. Avis d'un hôtel (/api/hotels/{id}/avis)
    @GetMapping("/{id}/avis")
    public List<Map<String, Object>> getAvisByHotelId(@PathVariable Long id) {
        List<Map<String, Object>> avisList = new ArrayList<>();

        Map<String, Object> a1 = new HashMap<>();
        a1.put("id", 1);
        a1.put("note", 5);
        a1.put("commentaire", "Séjour magnifique ! Le service était impeccable et la nourriture délicieuse.");
        a1.put("user_nom", "Arwa Ben Amar");
        a1.put("created_at", "2026-08-01");
        avisList.add(a1);

        Map<String, Object> a2 = new HashMap<>();
        a2.put("id", 2);
        a2.put("note", 4);
        a2.put("commentaire", "Très bon hôtel avec de superbes piscines. Je recommande vivement pour les familles.");
        a2.put("user_nom", "Client Satisfait");
        a2.put("created_at", "2026-08-02");
        avisList.add(a2);

        return avisList;
    }

    @PostMapping
    public Hotel createHotel(@RequestBody Hotel hotel) {
        return hotelRepository.save(hotel);
    }
}
