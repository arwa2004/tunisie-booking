package com.tunisiebooking.hotelservice.model;

import jakarta.persistence.*;

@Entity
@Table(name = "hotels")
public class Hotel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nom;
    private int etoiles;
    private String ville;
    private double prixNuit;

    public Hotel() {}

    public Hotel(String nom, int etoiles, String ville, double prixNuit) {
        this.nom = nom;
        this.etoiles = etoiles;
        this.ville = ville;
        this.prixNuit = prixNuit;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public int getEtoiles() { return etoiles; }
    public void setEtoiles(int etoiles) { this.etoiles = etoiles; }
    public String getVille() { return ville; }
    public void setVille(String ville) { this.ville = ville; }
    public double getPrixNuit() { return prixNuit; }
    public void setPrixNuit(double prixNuit) { this.prixNuit = prixNuit; }
}
