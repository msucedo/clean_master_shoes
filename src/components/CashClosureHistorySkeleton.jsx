import './CashClosureHistorySkeleton.css';

const CashClosureHistorySkeleton = () => {
  return (
    <div className="cash-closure-history-skeleton">
      {/* Search Bar Skeleton */}
      <div className="cch-search-bar-skeleton">
        <div className="skeleton skeleton-search-input"></div>
        <div className="skeleton skeleton-results-count"></div>
      </div>

      {/* Table Skeleton */}
      <div className="cch-table-wrapper-skeleton">
        <table className="cch-table-skeleton">
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
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <tr key={index} className="cch-row-skeleton">
                <td><div className="skeleton skeleton-td-date"></div></td>
                <td><div className="skeleton skeleton-td-badge"></div></td>
                <td><div className="skeleton skeleton-td-text"></div></td>
                <td><div className="skeleton skeleton-td-currency"></div></td>
                <td><div className="skeleton skeleton-td-currency"></div></td>
                <td><div className="skeleton skeleton-td-currency"></div></td>
                <td><div className="skeleton skeleton-td-orders"></div></td>
                <td><div className="skeleton skeleton-td-button"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashClosureHistorySkeleton;
