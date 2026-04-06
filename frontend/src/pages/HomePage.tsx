import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import './HomePage.css';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <section className="hero-section">
        <h2>Bun venit la Sistemul de Închirieri Online</h2>
        <p>Găsește și închiriază produsele de care ai nevoie</p>
        <Link to={ROUTES.PRODUCTS} className="btn btn-primary btn-large">
          Vezi Produse
        </Link>
      </section>
    </div>
  );
};

export default HomePage;
