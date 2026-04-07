import React from 'react';
import { Link } from 'react-router-dom';
import { APP_DISPLAY_NAME, ROUTES } from '../utils/constants';
import './HomePage.css';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <section className="hero-section" aria-labelledby="hero-heading">
        <p className="hero-eyebrow">Platformă de închiriere</p>
        <h2 id="hero-heading">Bun venit la {APP_DISPLAY_NAME}</h2>
        <p className="hero-lead">
          Găsește și închiriază produsele de care ai nevoie — catalog clar, prețuri pe zi și flux simplu de la
          rezervare la plată.
        </p>
        <Link to={ROUTES.PRODUCTS} className="btn btn-primary btn-large hero-cta">
          Vezi produse
        </Link>
      </section>
    </div>
  );
};

export default HomePage;
