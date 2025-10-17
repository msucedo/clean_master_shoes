import PageHeader from '../components/PageHeader';
import './Catalog.css';

const Catalog = () => {
  return (  
    <div className="catalog-page">
      <PageHeader
        title="Catálogo"
        buttonLabel="Agregar Producto"
        buttonIcon="➕"
      />
    </div>
  );
};

export default Catalog;
