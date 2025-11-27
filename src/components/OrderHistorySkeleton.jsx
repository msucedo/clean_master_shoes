import './OrderHistorySkeleton.css';

const OrderHistorySkeleton = () => {
  return (
    <div className="order-history-skeleton">
      {/* Search Bar Skeleton */}
      <div className="oh-search-bar-skeleton">
        <div className="skeleton skeleton-search-input"></div>
        <div className="skeleton skeleton-results-count"></div>
      </div>

      {/* Table Skeleton */}
      <div className="oh-table-wrapper-skeleton">
        <table className="oh-table-skeleton">
          <thead>
            <tr>
              <th><div className="skeleton skeleton-th"></div></th>
              <th><div className="skeleton skeleton-th"></div></th>
              <th><div className="skeleton skeleton-th"></div></th>
              <th><div className="skeleton skeleton-th"></div></th>
              <th><div className="skeleton skeleton-th"></div></th>
              <th><div className="skeleton skeleton-th"></div></th>
              <th><div className="skeleton skeleton-th"></div></th>
              <th><div className="skeleton skeleton-th"></div></th>
              <th><div className="skeleton skeleton-th"></div></th>
              <th><div className="skeleton skeleton-th"></div></th>
              <th><div className="skeleton skeleton-th"></div></th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
              <tr key={index} className="oh-row-skeleton">
                <td><div className="skeleton skeleton-td-order"></div></td>
                <td><div className="skeleton skeleton-td-photo"></div></td>
                <td><div className="skeleton skeleton-td-client"></div></td>
                <td><div className="skeleton skeleton-td-date"></div></td>
                <td><div className="skeleton skeleton-td-date"></div></td>
                <td><div className="skeleton skeleton-td-badge"></div></td>
                <td><div className="skeleton skeleton-td-services"></div></td>
                <td><div className="skeleton skeleton-td-currency"></div></td>
                <td><div className="skeleton skeleton-td-badge"></div></td>
                <td><div className="skeleton skeleton-td-badge"></div></td>
                <td><div className="skeleton skeleton-td-author"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderHistorySkeleton;
