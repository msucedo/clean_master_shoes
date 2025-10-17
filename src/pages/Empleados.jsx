import PageHeader from '../components/PageHeader';
import './Empleados.css';

const Empleados = () => {
  return (  
    <div className="empleados-page">
      <PageHeader
        title="Empleados"
        buttonLabel="Agregar Empleado"
        buttonIcon="➕"
      />
    </div>
  );
};

export default Empleados;
