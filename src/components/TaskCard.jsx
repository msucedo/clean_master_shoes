import './TaskCard.css';

const TaskCard = ({ id, badge, badgeType, client, model, service, price, action, actionType }) => {
  return (
    <div className="task-card">
      <div className="task-card-header">
        <span className="task-card-id">#{id}</span>
        <span className={`task-badge ${badgeType}`}>{badge}</span>
      </div>
      <div className="sneaker-preview">👟</div>
      <div className="task-card-client">{client}</div>
      <div className="task-card-model">{model}</div>
      <div className="task-card-service">{service}</div>
      <div className="task-card-footer">
        <div className="task-card-price">${price}</div>
        <div className={`task-card-action ${actionType}`}>{action}</div>
      </div>
    </div>
  );
};

export default TaskCard;
