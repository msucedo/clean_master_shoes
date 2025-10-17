import PageHeader from '../components/PageHeader';
import './Promotions.css';

const Promotions = () => {
  return (  
    <div className="promotions-page">
      <PageHeader
        title="Promociones"
        buttonLabel="Agregar Promocion"
        buttonIcon="➕"
      />
    </div>
  );
};

export default Promotions;
