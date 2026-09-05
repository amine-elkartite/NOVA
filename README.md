NOVA — E-commerce Full Stack

Projet e-commerce moderne inspiré de la maquette NOVA, avec une partie boutique client et un panel administrateur.

Stack technique

Frontend

React.js

HTML5 / JSX

CSS3

JavaScript ES6+

React Router

Axios

Context API ou Redux Toolkit

Lucide React / React Icons

Backend

Node.js

Express.js

JWT

bcrypt

Multer

Nodemailer

express-validator

Base de données

MySQL

mysql2

Sequelize ou requêtes SQL classiques

1. Fonctionnalités principales

Boutique client

Accueil

Nouveautés

Homme

Femme

Accessoires

Recherche

Fiche produit

Panier

Paiement / Checkout

Connexion

Inscription

Profil utilisateur

Mes commandes

Mes adresses

Mes favoris

Sécurité du compte

Administration

Tableau de bord

Commandes

Produits

Catégories

Clients

Promotions

Analyses

Messages

Paramètres

Profil administrateur

2. Structure générale du projet

nova-ecommerce/
│
├── client/
│   ├── public/
│   │   ├── images/
│   │   │   ├── banners/
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   └── avatars/
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── assets/
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   └── fonts/
│   │   │
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Loader.jsx
│   │   │   │   ├── Pagination.jsx
│   │   │   │   └── Badge.jsx
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── AdminSidebar.jsx
│   │   │   │   └── AdminHeader.jsx
│   │   │   │
│   │   │   ├── product/
│   │   │   │   ├── ProductCard.jsx
│   │   │   │   ├── ProductGrid.jsx
│   │   │   │   ├── ProductFilters.jsx
│   │   │   │   ├── ProductGallery.jsx
│   │   │   │   └── ProductReviews.jsx
│   │   │   │
│   │   │   ├── cart/
│   │   │   │   ├── CartItem.jsx
│   │   │   │   ├── CartSummary.jsx
│   │   │   │   └── PromoCode.jsx
│   │   │   │
│   │   │   ├── checkout/
│   │   │   │   ├── ContactForm.jsx
│   │   │   │   ├── AddressForm.jsx
│   │   │   │   ├── DeliveryMethod.jsx
│   │   │   │   ├── PaymentMethod.jsx
│   │   │   │   └── CheckoutSummary.jsx
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── StatCard.jsx
│   │   │       ├── DataTable.jsx
│   │   │       ├── SalesChart.jsx
│   │   │       ├── StatusChart.jsx
│   │   │       └── AdminFilters.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── shop/
│   │   │   │   ├── Home.jsx
│   │   │   │   ├── NewArrivals.jsx
│   │   │   │   ├── Men.jsx
│   │   │   │   ├── Women.jsx
│   │   │   │   ├── Accessories.jsx
│   │   │   │   ├── Search.jsx
│   │   │   │   ├── ProductDetails.jsx
│   │   │   │   ├── Cart.jsx
│   │   │   │   └── Checkout.jsx
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   ├── ForgotPassword.jsx
│   │   │   │   └── ResetPassword.jsx
│   │   │   │
│   │   │   ├── account/
│   │   │   │   ├── Profile.jsx
│   │   │   │   ├── Orders.jsx
│   │   │   │   ├── OrderDetails.jsx
│   │   │   │   ├── Addresses.jsx
│   │   │   │   ├── Favorites.jsx
│   │   │   │   └── Security.jsx
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── Orders.jsx
│   │   │       ├── OrderDetails.jsx
│   │   │       ├── Products.jsx
│   │   │       ├── ProductCreate.jsx
│   │   │       ├── ProductEdit.jsx
│   │   │       ├── Categories.jsx
│   │   │       ├── Customers.jsx
│   │   │       ├── CustomerDetails.jsx
│   │   │       ├── Promotions.jsx
│   │   │       ├── PromotionCreate.jsx
│   │   │       ├── Analytics.jsx
│   │   │       ├── Messages.jsx
│   │   │       ├── Settings.jsx
│   │   │       └── AdminProfile.jsx
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CartContext.jsx
│   │   │   └── WishlistContext.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useCart.js
│   │   │   └── useFetch.js
│   │   │
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── productService.js
│   │   │   ├── orderService.js
│   │   │   ├── cartService.js
│   │   │   ├── promotionService.js
│   │   │   └── adminService.js
│   │   │
│   │   ├── routes/
│   │   │   ├── AppRoutes.jsx
│   │   │   ├── PrivateRoute.jsx
│   │   │   └── AdminRoute.jsx
│   │   │
│   │   ├── styles/
│   │   │   ├── variables.css
│   │   │   ├── global.css
│   │   │   ├── shop.css
│   │   │   └── admin.css
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── .env
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── product.controller.js
│   │   │   ├── category.controller.js
│   │   │   ├── cart.controller.js
│   │   │   ├── order.controller.js
│   │   │   ├── address.controller.js
│   │   │   ├── favorite.controller.js
│   │   │   ├── promotion.controller.js
│   │   │   ├── review.controller.js
│   │   │   ├── message.controller.js
│   │   │   ├── analytics.controller.js
│   │   │   └── settings.controller.js
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── product.routes.js
│   │   │   ├── category.routes.js
│   │   │   ├── cart.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── address.routes.js
│   │   │   ├── favorite.routes.js
│   │   │   ├── promotion.routes.js
│   │   │   ├── review.routes.js
│   │   │   ├── message.routes.js
│   │   │   ├── analytics.routes.js
│   │   │   └── settings.routes.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── admin.middleware.js
│   │   │   ├── upload.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   └── validation.middleware.js
│   │   │
│   │   ├── services/
│   │   │   ├── email.service.js
│   │   │   ├── payment.service.js
│   │   │   └── analytics.service.js
│   │   │
│   │   ├── utils/
│   │   │   ├── generateToken.js
│   │   │   ├── slugify.js
│   │   │   └── pagination.js
│   │   │
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── uploads/
│   │   └── products/
│   ├── package.json
│   └── .env
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── nova_database.sql
│
├── .gitignore
└── README.md

3. Routes frontend

Boutique

Route

Page

/

Accueil

/nouveautes

Nouveautés

/homme

Homme

/femme

Femme

/accessoires

Accessoires

/recherche?q=

Recherche

/produit/:slug

Détail produit

/panier

Panier

/checkout

Paiement

/connexion

Connexion

/inscription

Inscription

/mot-de-passe-oublie

Mot de passe oublié

Compte client

Route

Page

/mon-compte

Profil

/mon-compte/commandes

Mes commandes

/mon-compte/commandes/:id

Détail commande

/mon-compte/adresses

Mes adresses

/mon-compte/favoris

Mes favoris

/mon-compte/securite

Sécurité

Administration

Route

Page

/admin

Dashboard

/admin/commandes

Commandes

/admin/commandes/:id

Détails commande

/admin/produits

Produits

/admin/produits/ajouter

Ajouter produit

/admin/produits/:id/modifier

Modifier produit

/admin/categories

Catégories

/admin/clients

Clients

/admin/clients/:id

Détail client

/admin/promotions

Promotions

/admin/promotions/ajouter

Nouvelle promotion

/admin/analyses

Analyses

/admin/messages

Messages

/admin/parametres

Paramètres

/admin/profil

Profil admin

4. Pages boutique

Accueil

Sections :

Header
├── Bandeau livraison
├── Logo NOVA
├── Navigation
│   ├── Accueil
│   ├── Nouveautés
│   ├── Homme
│   ├── Femme
│   └── Accessoires
├── Recherche
├── Profil
└── Panier

Hero
├── Titre
├── Description
├── CTA
└── Image collection

Catégories
├── Homme
├── Femme
└── Accessoires

Services
├── Livraison rapide
├── Paiement sécurisé
└── Retours faciles

Meilleures ventes
└── ProductCard[]

Footer

Nouveautés / Homme / Femme / Accessoires

Breadcrumb
Titre
Description
Filtres
├── Catégorie
├── Taille
├── Couleur
├── Prix
├── Marque
└── Disponibilité

Tri
├── Nouveautés
├── Prix croissant
├── Prix décroissant
└── Popularité

ProductGrid
Pagination

Fiche produit

Galerie images
Informations produit
├── Nom
├── Prix
├── Ancien prix
├── Note
├── Description
├── Couleurs
├── Tailles
├── Quantité
├── Stock
├── Ajouter au panier
└── Ajouter aux favoris

Livraison / Retour
Description détaillée
Avis clients
Produits similaires

Panier

Mon panier

CartItems
├── Image
├── Produit
├── Variante
├── Quantité
├── Prix
└── Supprimer

Résumé
├── Sous-total
├── Livraison
├── Réduction
├── Total
├── Code promo
└── Passer au paiement

Produits recommandés

Checkout / Paiement

1. Coordonnées
├── Email
└── Téléphone

2. Adresse de livraison
├── Prénom
├── Nom
├── Adresse
├── Ville
├── Code postal
└── Pays

3. Livraison
├── Standard
└── Express

4. Paiement
├── Carte bancaire
├── PayPal
└── Paiement à la livraison

Résumé de commande
Bouton Confirmer et payer

5. Pages compte client

Profil

Sidebar compte
├── Profil
├── Mes commandes
├── Mes adresses
├── Mes favoris
└── Sécurité

Informations
├── Photo
├── Prénom
├── Nom
├── Email
├── Téléphone
└── Date de naissance

Mes commandes

Afficher :

Numéro de commande

Date

Produits

Total

Paiement

Statut

Bouton détails

Bouton suivi

Facture PDF

Statuts :

En attente
Confirmée
En préparation
Expédiée
Livrée
Annulée

Mes adresses

Fonctionnalités :

Ajouter une adresse

Modifier

Supprimer

Définir comme principale

Adresse de livraison

Adresse de facturation

Mes favoris

Afficher tous les produits favoris avec :

Image

Nom

Prix

Disponibilité

Ajouter au panier

Supprimer des favoris

Sécurité

Modifier mot de passe

Authentification 2FA

Sessions actives

Appareils connectés

Déconnexion de toutes les sessions

6. Admin Dashboard

Tableau de bord

Statistiques

Total commandes
Total clients
Produits vendus
Chiffre d'affaires

Graphiques

Évolution des ventes

Ventes par canal

Commandes par statut

Produits les plus vendus

Dernières commandes

Afficher :

ID

Client

Produits

Montant

Statut

Date

7. Admin — Commandes

Fonctions :

Recherche

Filtrage

Pagination

Export CSV / Excel

Voir détails

Changer statut

Confirmer commande

Préparer commande

Marquer expédiée

Marquer livrée

Annuler

Voir facture

Colonnes :

Commande
Client
Produits
Montant
Paiement
Statut
Date
Actions

8. Admin — Produits

Fonctions :

Ajouter produit

Modifier produit

Supprimer produit

Upload images

Gestion stock

Catégories

Promotions

Recherche

Filtres

Pagination

Champs produit :

Nom
Slug
SKU
Description courte
Description complète
Prix
Ancien prix
Catégorie
Genre
Marque
Couleur
Taille
Stock
Images
Statut
Promotion

9. Admin — Catégories

Champs :

Nom
Slug
Description
Image
Statut

Actions :

Ajouter
Modifier
Supprimer
Activer
Désactiver

Exemples :

Chaussures

Accessoires

Vêtements Homme

Vêtements Femme

Lunettes

Montres

Casquettes

Bijoux

10. Admin — Clients

Afficher :

Client
Email
Téléphone
Ville
Total commandes
Montant dépensé
Statut
Date d'inscription

Actions :

Voir profil

Voir commandes

Désactiver

Bloquer

Réactiver

11. Admin — Promotions

Types :

Pourcentage
Montant fixe
Livraison gratuite
Code promo

Champs :

Nom
Code
Type
Valeur
Montant minimum
Date début
Date fin
Nombre maximum d'utilisations
Produits concernés
Catégories concernées
Statut

12. Admin — Analyses

Statistiques :

Chiffre d'affaires

Taux de conversion

Panier moyen

Visiteurs

Nombre de commandes

Clients

Produits vendus

Graphiques :

Évolution des ventes

Sources de trafic

Ventes par catégorie

Produits les plus performants

Répartition mobile / desktop / tablette

Filtres :

Aujourd'hui
7 derniers jours
30 derniers jours
Ce mois
Cette année
Période personnalisée

13. Admin — Messages

Structure :

Liste conversations
├── Tous
├── Non lus
├── En attente
└── Résolus

Conversation
├── Messages client
├── Messages admin
├── Pièces jointes
└── Champ de réponse

Informations client
├── Nom
├── Email
├── Téléphone
├── Ville
├── Total commandes
├── Total dépensé
└── Activité récente

Fonctions :

Envoyer message

Archiver conversation

Marquer résolu

Marquer non lu

Ajouter tags

14. Admin — Paramètres

Informations boutique

Nom boutique
Email
Téléphone
Adresse
Devise
Langue

Préférences

Notifications email
Mode maintenance
Affichage stock
Fuseau horaire

Sécurité

Mot de passe
2FA
Sessions actives
Appareils connectés

Livraison

Livraison standard
Livraison express
Livraison gratuite à partir de X DH

Paiements

Carte bancaire
PayPal
Paiement à la livraison

Système

Sauvegarde
Clé API
Centre d'aide

15. Admin — Profil

Informations :

Photo
Prénom
Nom
Email
Téléphone
Poste
Adresse
Langue
Fuseau horaire

Sécurité :

Modifier mot de passe
2FA
Sessions
Appareils

Statistiques :

Commandes gérées
Produits ajoutés
Messages traités
Dernière connexion

16. Structure de la base MySQL

users

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30),
    password VARCHAR(255) NOT NULL,
    role ENUM('customer','admin') DEFAULT 'customer',
    avatar VARCHAR(255),
    status ENUM('active','inactive','blocked') DEFAULT 'active',
    email_verified_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

categories

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) UNIQUE NOT NULL,
    description TEXT,
    image VARCHAR(255),
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

products

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) UNIQUE NOT NULL,
    sku VARCHAR(100) UNIQUE,
    short_description VARCHAR(500),
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    old_price DECIMAL(10,2),
    stock INT DEFAULT 0,
    gender ENUM('homme','femme','unisex'),
    brand VARCHAR(100),
    status ENUM('active','inactive','draft') DEFAULT 'active',
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

product_images

CREATE TABLE product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

product_variants

CREATE TABLE product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    size VARCHAR(50),
    color VARCHAR(100),
    sku VARCHAR(100),
    stock INT DEFAULT 0,
    additional_price DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

addresses

CREATE TABLE addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(30),
    address_line VARCHAR(255),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Maroc',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

favorites

CREATE TABLE favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

carts

CREATE TABLE carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

cart_items

CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

orders

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT,
    address_id INT,
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    payment_method ENUM('card','paypal','cash_on_delivery'),
    payment_status ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
    status ENUM(
        'pending',
        'confirmed',
        'preparing',
        'shipped',
        'delivered',
        'cancelled'
    ) DEFAULT 'pending',
    tracking_number VARCHAR(150),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (address_id) REFERENCES addresses(id)
);

order_items

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    variant_id INT,
    product_name VARCHAR(200),
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

promotions

CREATE TABLE promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) UNIQUE,
    type ENUM('percentage','fixed','free_shipping') NOT NULL,
    value DECIMAL(10,2) DEFAULT 0,
    minimum_amount DECIMAL(10,2) DEFAULT 0,
    max_uses INT,
    used_count INT DEFAULT 0,
    start_date DATETIME,
    end_date DATETIME,
    status ENUM('active','inactive','expired','scheduled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

promotion_products

CREATE TABLE promotion_products (
    promotion_id INT,
    product_id INT,
    PRIMARY KEY (promotion_id, product_id),
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

reviews

CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    rating TINYINT NOT NULL,
    comment TEXT,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

conversations

CREATE TABLE conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    status ENUM('open','waiting','resolved','archived') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

messages

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT,
    sender_type ENUM('customer','admin') NOT NULL,
    content TEXT,
    attachment VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

settings

CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(150) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

17. Relations principales

users
├── addresses
├── orders
├── favorites
├── reviews
├── carts
└── conversations

categories
└── products
    ├── product_images
    ├── product_variants
    ├── cart_items
    ├── order_items
    ├── favorites
    └── reviews

orders
└── order_items

promotions
└── promotion_products

conversations
└── messages

18. API REST Express

URL de base :

http://localhost:5000/api

Auth

POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
PUT    /api/auth/password

Produits

GET    /api/products
GET    /api/products/:id
GET    /api/products/slug/:slug
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id

Catégories

GET    /api/categories
GET    /api/categories/:id
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id

Panier

GET    /api/cart
POST   /api/cart/items
PUT    /api/cart/items/:id
DELETE /api/cart/items/:id
DELETE /api/cart

Commandes

GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
PUT    /api/orders/:id/status
DELETE /api/orders/:id

Adresses

GET    /api/addresses
POST   /api/addresses
PUT    /api/addresses/:id
DELETE /api/addresses/:id
PUT    /api/addresses/:id/default

Favoris

GET    /api/favorites
POST   /api/favorites/:productId
DELETE /api/favorites/:productId

Promotions

GET    /api/promotions
POST   /api/promotions
PUT    /api/promotions/:id
DELETE /api/promotions/:id
POST   /api/promotions/validate

Clients / utilisateurs

GET    /api/users
GET    /api/users/:id
PUT    /api/users/:id
PUT    /api/users/:id/status
DELETE /api/users/:id

Messages

GET    /api/conversations
GET    /api/conversations/:id
POST   /api/conversations
POST   /api/conversations/:id/messages
PUT    /api/conversations/:id/status

Analyses

GET /api/analytics/dashboard
GET /api/analytics/sales
GET /api/analytics/categories
GET /api/analytics/products
GET /api/analytics/customers

Paramètres

GET /api/settings
PUT /api/settings

19. Authentification

Utiliser JWT.

Exemple de réponse après connexion :

{
  "user": {
    "id": 1,
    "first_name": "Amine",
    "last_name": "Elkartite",
    "email": "admin@nova.ma",
    "role": "admin"
  },
  "token": "JWT_TOKEN"
}

Envoyer le token :

Authorization: Bearer JWT_TOKEN

Routes admin protégées avec :

authMiddleware
adminMiddleware

20. Variables .env

Backend

PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=nova_ecommerce
DB_USER=root
DB_PASSWORD=

JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=

Frontend

VITE_API_URL=http://localhost:5000/api

21. Installation

Cloner le projet

git clone https://github.com/yourusername/nova-ecommerce.git
cd nova-ecommerce

Installer frontend

cd client
npm install
npm run dev

Frontend :

http://localhost:5173

Installer backend

cd server
npm install
npm run dev

Backend :

http://localhost:5000

22. Packages frontend

npm install react-router-dom axios
npm install lucide-react
npm install react-hot-toast
npm install recharts

Optionnel :

npm install @reduxjs/toolkit react-redux

23. Packages backend

npm install express mysql2 cors dotenv bcrypt jsonwebtoken
npm install multer nodemailer express-validator cookie-parser

Développement :

npm install -D nodemon

24. Scripts backend

Dans server/package.json :

{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}

25. Scripts frontend

Dans client/package.json :

{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}

26. Style visuel NOVA

Palette recommandée :

:root {
    --nova-green: #3f493b;
    --nova-green-dark: #293127;

    --nova-black: #111111;
    --nova-text: #242424;
    --nova-muted: #737373;

    --nova-background: #f7f4ee;
    --nova-card: #fffdf9;
    --nova-border: #e5e0d8;

    --nova-success: #3c8c5a;
    --nova-warning: #d8a33f;
    --nova-danger: #c94a4a;

    --radius-sm: 8px;
    --radius-md: 14px;
    --radius-lg: 20px;
}

Fonts recommandées :

Titres : Playfair Display / Cormorant Garamond
Interface : Inter / Poppins / Helvetica

27. Responsive

Breakpoints :

/* Mobile */
@media (max-width: 576px) {}

/* Tablet */
@media (max-width: 768px) {}

/* Laptop */
@media (max-width: 1200px) {}

Le site doit être optimisé pour :

Mobile

Tablette

Desktop

Grand écran

28. Sécurité

À prévoir :

Hash des mots de passe avec bcrypt

JWT

Validation serveur

Protection des routes admin

Limitation des requêtes

Helmet

CORS

Requêtes SQL préparées

Validation des uploads

Taille maximale des fichiers

Types d'images autorisés

Protection XSS

Protection CSRF si authentification par cookie

Ne jamais stocker les informations complètes d'une carte bancaire

Packages supplémentaires :

npm install helmet express-rate-limit

29. Paiement

Pour une vraie boutique, utiliser un prestataire de paiement.

Architecture :

Checkout
    ↓
Express API
    ↓
Payment Provider
    ↓
Webhook
    ↓
Mise à jour payment_status
    ↓
Confirmation commande

Ne jamais sauvegarder :

Numéro complet de carte
CVC

dans MySQL.

30. Workflow commande

Client ajoute au panier
        ↓
Client passe au checkout
        ↓
Adresse + livraison
        ↓
Paiement
        ↓
Création commande
        ↓
En attente
        ↓
Confirmée
        ↓
En préparation
        ↓
Expédiée
        ↓
Livrée

31. Workflow admin produit

Admin
  ↓
Produits
  ↓
Ajouter
  ↓
Informations générales
  ↓
Images
  ↓
Prix
  ↓
Variantes
  ↓
Stock
  ↓
Catégorie
  ↓
Enregistrer

32. Composants React réutilisables

Créer des composants réutilisables :

Button
Input
Select
Checkbox
Modal
Badge
Card
StatCard
ProductCard
ProductGrid
DataTable
Pagination
SearchBar
Filters
Sidebar
Navbar
Header
Footer
ChartCard
ConfirmDialog
Toast
EmptyState
Loader

33. États globaux

AuthContext

Stocker :

user
token
isAuthenticated
login()
logout()
register()

CartContext

Stocker :

cart
cartItems
cartCount
subtotal

addToCart()
removeFromCart()
updateQuantity()
clearCart()

WishlistContext

Stocker :

favorites
addFavorite()
removeFavorite()
isFavorite()

34. Exemple de router React

<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/nouveautes" element={<NewArrivals />} />
  <Route path="/homme" element={<Men />} />
  <Route path="/femme" element={<Women />} />
  <Route path="/accessoires" element={<Accessories />} />
  <Route path="/produit/:slug" element={<ProductDetails />} />
  <Route path="/panier" element={<Cart />} />
  <Route path="/checkout" element={<Checkout />} />

  <Route path="/connexion" element={<Login />} />
  <Route path="/inscription" element={<Register />} />

  <Route element={<PrivateRoute />}>
    <Route path="/mon-compte" element={<Profile />} />
    <Route path="/mon-compte/commandes" element={<Orders />} />
    <Route path="/mon-compte/adresses" element={<Addresses />} />
    <Route path="/mon-compte/favoris" element={<Favorites />} />
    <Route path="/mon-compte/securite" element={<Security />} />
  </Route>

  <Route element={<AdminRoute />}>
    <Route path="/admin" element={<Dashboard />} />
    <Route path="/admin/commandes" element={<AdminOrders />} />
    <Route path="/admin/produits" element={<AdminProducts />} />
    <Route path="/admin/categories" element={<AdminCategories />} />
    <Route path="/admin/clients" element={<AdminCustomers />} />
    <Route path="/admin/promotions" element={<AdminPromotions />} />
    <Route path="/admin/analyses" element={<Analytics />} />
    <Route path="/admin/messages" element={<Messages />} />
    <Route path="/admin/parametres" element={<Settings />} />
    <Route path="/admin/profil" element={<AdminProfile />} />
  </Route>
</Routes>

35. Exemple de connexion MySQL

server/src/config/db.js

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;

36. Exemple Express

server/src/app.js

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");
const orderRoutes = require("./routes/order.routes");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);

module.exports = app;

37. MVP conseillé

Commencer dans cet ordre :

1. Base MySQL
2. Express API
3. Authentification
4. Catégories
5. Produits
6. Frontend accueil
7. Listings
8. Fiche produit
9. Panier
10. Checkout
11. Commandes
12. Compte client
13. Admin dashboard
14. Admin produits
15. Admin commandes
16. Promotions
17. Messages
18. Analyses
19. Paramètres

38. Objectif final

L'application NOVA doit permettre :

Client

découvrir les collections ;

filtrer les produits ;

consulter les détails ;

ajouter au panier ;

ajouter aux favoris ;

commander ;

choisir la livraison ;

effectuer un paiement ;

gérer son profil ;

suivre ses commandes.

Administrateur

suivre les performances ;

gérer les commandes ;

gérer les produits ;

gérer les catégories ;

gérer les clients ;

créer des promotions ;

consulter les analyses ;

répondre aux messages ;

gérer les paramètres de la boutique.

NOVA

Plus qu'un style, un art de vivre.