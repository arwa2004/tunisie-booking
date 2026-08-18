CREATE TABLE IF NOT EXISTS HOTEL (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    NOM VARCHAR(255),
    ETOILES INT,
    PRIX_PAR_NUIT DOUBLE,
    VILLE VARCHAR(255),
    DISPONIBLE BOOLEAN
);

INSERT INTO HOTEL (NOM, ETOILES, PRIX_PAR_NUIT, VILLE, DISPONIBLE) VALUES
('El Mouradi El Menzah', 4, 120.0, 'Hammamet', true),
('The Orangers Garden Villa & Bungalows', 5, 350.0, 'Hammamet', true),
('Hasdrubal Prestige Thalassa & Spa', 5, 450.0, 'Djerba', true),
('Djerba Plaza Thalasso & Spa', 4, 180.0, 'Djerba', true),
('Movenpick Resort & Marine Spa Sousse', 5, 280.0, 'Sousse', true);
